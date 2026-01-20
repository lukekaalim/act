import { CommitReport, DeltaReport, ElementReport, ThreadReport, TreeReport, WorkTaskReport } from "@lukekaalim/act-debug";
import { CommitID, CommitVersion, WorkThread2 } from "@lukekaalim/act-recon";

export class MutableCommitRef {
  element: ElementReport;
  id: CommitID;
  version: CommitVersion;
  distance: number;

  report: CommitReport;

  children: MutableCommitRef[] = [];
  parent: null | MutableCommitRef = null;

  constructor(commit: CommitReport) {
    this.element = commit.element;
    this.id = commit.id;
    this.version = commit.version;
    this.distance = commit.distance;

    this.report = commit;
  }

  update(commit: CommitReport) {
    this.report = commit;
    this.version = commit.version;
    this.element = commit.element;
  }

  resolve(lookupMap: Map<CommitID, MutableCommitRef>) {
    if (this.report.parent)
      this.linkParent(this.report.parent, lookupMap);
    this.linkChildren(this.report.children, lookupMap);
  }

  linkParent(parent: CommitID, lookupMap: Map<CommitID, MutableCommitRef>) {
    this.parent = lookupMap.get(parent) || null;
  }
  linkChildren(children: CommitID[], lookupMap: Map<CommitID, MutableCommitRef>) {
    this.children = children.map(c => lookupMap.get(c)).filter(x => !!x);
  }
}

export class CommitLookupCache {
  map: Map<CommitID, CommitReport> = new Map();
  roots: Set<CommitID> = new Set();

  setTree(tree: TreeReport) {
    this.map.clear();
    this.roots.clear();

    for (const commit of tree.commits) {
      this.map.set(commit.id, commit)
      if (!commit.parent)
        this.roots.add(commit.id);
    }
  }

  ingest(delta: DeltaReport) {
    for (const create of delta.created) {
      this.map.set(create.id, create);
      if (!create.parent)
        this.roots.add(create.id);
    }
    for (const update of delta.updated)
      this.map.set(update.id, update);
    for (const remove of delta.removed) {
      this.map.delete(remove.id);
      this.roots.delete(remove.id);
    }
  }
}

/**
 * A bunch of relevant data for a Tree in the progress of changing
 */
export class ThreadLookupCache {
  canon: CommitLookupCache;

  report: DeltaReport | null = null;
  thread: ThreadReport | null = null;

  constructor(canon: CommitLookupCache) {
    this.canon = canon;
  }

  roots: Set<CommitID> = new Set();

  created: Set<CommitID> = new Set();
  updated: Set<CommitID> = new Set();
  removed: Set<CommitID> = new Set();

  /**
   * An up to date map of the tree, plus deleted notes in this delta
   */
  all: Map<CommitID, CommitReport> = new Map();

  nextTask: WorkTaskReport | null = null;
  prevTask: WorkTaskReport | null = null;
  
  allTasks: Map<CommitID, WorkTaskReport> = new Map();

  targets: Set<CommitID> = new Set();
  visited: Set<CommitID> = new Set();

  /**
   * Clear the delta cache
   */
  reset() {
    this.roots = new Set(this.canon.roots)
    this.all = new Map(this.canon.map);
    this.allTasks = new Map();

    this.nextTask = null;
    this.prevTask = null;
    this.report = null;

    this.created.clear();
    this.updated.clear();
    this.removed.clear();

    this.targets.clear();
    this.visited.clear();
  }

  ingestThread(thread: ThreadReport) {
    this.thread = thread;

    this.nextTask = thread.pendingTasks[thread.pendingTasks.length - 1];
    this.targets = new Set(thread.reasons.map(reason => reason.target));
    this.visited = new Set(thread.visited)
    this.allTasks = new Map(thread.pendingTasks.map(task => [task.id, task]))
  }

  ingestDelta(delta: DeltaReport) {
    this.report = delta;

    for (const commit of delta.created) {
      this.created.add(commit.id)

      const children = [...new Set([
        ...commit.children.filter(c => this.all.has(c) || delta.created.find(cs => cs.id === c)),
      ])]
      this.all.set(commit.id, { ...commit, children });

      if (!commit.parent)
        this.roots.add(commit.id);
    }
    for (const commit of delta.updated) {
      const existingCommit = this.canon.map.get(commit.id) as CommitReport;

      const children = [...new Set([
        ...commit.children.filter(c => this.all.has(c)),
        ...existingCommit.children,
      ])]
      const mergedCommitReport = { ...commit, children };

      this.updated.add(commit.id)
      this.all.set(commit.id, mergedCommitReport)
    }
    for (const commit of delta.removed) {
      this.removed.add(commit.id);
      this.all.set(commit.id, commit);
    }
  }

  getFlat() {

  }
}