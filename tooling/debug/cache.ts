import { CommitID, CommitVersion, EffectID } from "@lukekaalim/act-recon";
import { CommitReport, DeltaReport, EffectReport, ElementReport, ThreadReport, TreeReport, WorkTaskReport } from "./report";

/**
 * The DebugCache is a mutable store for accumulating
 * reports from Debug Event Buses, to reconstruct
 * an accurate and fast set of lookup maps for the 
 * state of a reconciler.
 */
export class DebugCache {
  roots: CommitID[] = [];

  // Live commits represents commits present in the current
  // tree.
  liveCommits: Map<CommitID, CommitReport> = new Map();

  liveEffects: Map<EffectID, EffectReport> = new Map();

  /**
   * Pending commits represent commit information acquired during a
   * "delta"
   */
  pendingCommits: Map<CommitID, CommitReport> = new Map();
  pendingCommitStates: Map<CommitID, 'created' | 'updated' | 'removed'> = new Map();
  pendingEffects: Map<EffectID, EffectReport> = new Map();

  mountTasks: Map<CommitID, WorkTaskReport> = new Map();

  allCommits: Set<CommitID> = new Set();

  /**
   * Loading a tree "resets" a debug cache
   * @param tree 
   */
  loadTree(tree: TreeReport) {
    this.roots = [...tree.roots];
    this.liveCommits.clear();
    this.allCommits.clear();
    this.liveEffects.clear();

    for (const commit of tree.commits) {
      this.liveCommits.set(commit.id, commit);
      this.allCommits.add(commit.id);
    }
    for (const effect of tree.effects) {
      this.liveEffects.set(effect.id, effect);
    }
  }

  loadDelta(delta: DeltaReport) {
    this.clearDelta();

    for (const commit of delta.created) {
      this.allCommits.add(commit.id);
      this.pendingCommits.set(commit.id, commit);
      this.pendingCommitStates.set(commit.id, 'created');
    }
    for (const commit of delta.updated) {
      this.allCommits.add(commit.id);
      this.pendingCommits.set(commit.id, commit);
      this.pendingCommitStates.set(commit.id, 'updated');
    }
    for (const commit of delta.removed) {
      this.allCommits.add(commit.id);
      this.pendingCommits.set(commit.id, commit);
      this.pendingCommitStates.set(commit.id, 'removed');
    }
    for (const effect of delta.effects) {
      this.pendingEffects.set(effect.id, effect);
    }
  }

  loadThread(thread: ThreadReport) {
    this.mountTasks.clear();
    console.log("Loading Thread")

    for (const task of thread.pendingTasks) {
      if (!task.prev) {
        this.mountTasks.set(task.id, task);
        console.log('Loading "mount task"', task.id)
      }
    }
  }
  clearThread() {
    this.mountTasks.clear();
  }

  /**
   * Convert any loaded pending commits into the live tree,
   * representing the "delta" being applied.
   * 
   * This does not automatically clear the DeltaReport,
   * but will update the AllCommits set.
   */
  apply() {
    for (const pending of this.pendingCommits.values()) {
      const state = this.pendingCommitStates.get(pending.id);
      if (!state)
        continue;

      switch (state) {
        case 'created':
        case 'updated':
          this.liveCommits.set(pending.id, pending);
          break;
        case 'removed':
          this.liveCommits.delete(pending.id);
          this.allCommits.delete(pending.id);
          break;
      }
    }
  }
  clearDelta() {
    this.pendingCommits.clear();
    this.pendingCommitStates.clear();
    this.pendingEffects.clear();
  }

  loadEffects(effects: EffectReport[]) {
    for (const effect of effects) {
      this.liveEffects.set(effect.id, effect)
    }
  }

  getCommit(id: CommitID) {
    return this.pendingCommits.get(id) || this.liveCommits.get(id) || null;
  }
  getCommitState(id: CommitID) {
    if (this.mountTasks.has(id))
      return 'mount-task';

    return this.pendingCommitStates.get(id) || 'live';
  }
  getCommitList() {
    const idStack: CommitID[] = [...this.roots.values()];

    const flat: CommitReport[] = [];
    
    while (idStack.length > 0) {
      const commitId = idStack.pop() as CommitID;

      const mountTask = this.mountTasks.get(commitId);
      if (mountTask) {
        // this commit isn't "real" yet
        // so lets make up shit.
        flat.push({
          id: mountTask.id,
          element: mountTask.element as ElementReport,
          children: [],
          parent: mountTask.parent,
          distance: mountTask.distance,
          version: -1 as CommitVersion
        })
        continue;
      }


      const pendingCommit = this.pendingCommits.get(commitId);
      const liveCommit = this.liveCommits.get(commitId);


      const commit = pendingCommit || liveCommit;
      if (!commit) {
        console.log(`Could not resolve "${commitId}"`);
        continue;
      }

      let children: CommitID[];
      if (pendingCommit && liveCommit) {
        // Include _both_ new and old children
        children = [...new Set([...pendingCommit.children, ...liveCommit.children])];
      } else {
        children = commit.children;
      }

      flat.push(commit);

      for (const childId of children.toReversed()) {
        idStack.push(childId);
      }
    }

    return flat;
  }
  getEffectList() {
    const effects = new Map<EffectID, EffectReport>(this.liveEffects);

    for (const effect of this.pendingEffects.values())
      effects.set(effect.id, effect);

    return [...effects.values()];
  }
}