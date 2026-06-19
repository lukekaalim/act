import { CommitID, CommitVersion, EffectID } from "@lukekaalim/act-recon";
import { CommitReport, DeltaReport, EffectCleanupReport, EffectReport, EffectWorkerReport, ElementReport, ThreadReport, TreeReport, WorkTaskReport } from "./report";

export type FlattenedCommitReport = {
  id: CommitID,
  task: WorkTaskReport | null,
  commit: CommitReport,
  children: CommitID[],
}

/**
 * The DebugCache is a mutable store for accumulating
 * reports from Debug Event Buses, to reconstruct
 * an accurate and fast set of lookup maps for the 
 * state of a reconciler.
 */
export class DebugCache {
  roots: Set<CommitID> = new Set();

  // Live commits represents commits present in the current
  // tree.
  liveCommits: Map<CommitID, CommitReport> = new Map();

  liveCleanups: Map<EffectID, EffectCleanupReport> = new Map();

  /**
   * Pending commits represent commit information acquired during a
   * "delta"
   */
  pendingCommits: Map<CommitID, CommitReport> = new Map();
  pendingCommitStates: Map<CommitID, 'created' | 'updated' | 'removed'> = new Map();

  /**
   * Provided by the delta - the set of all effects to be applied
   */
  pendingEffects: Map<EffectID, EffectReport> = new Map();
  /**
   * The effect worker tells you how many of the delta's effects have been applied.
   */
  pendingEffectWorker: EffectWorkerReport | null = null;

  mountTasks: Map<CommitID, WorkTaskReport> = new Map();

  allCommits: Set<CommitID> = new Set();

  /**
   * Loading a tree "resets" a debug cache
   * @param tree 
   */
  loadTree(tree: TreeReport) {
    this.roots = new Set(tree.roots);
    this.liveCommits.clear();
    this.allCommits.clear();
    this.liveCleanups.clear();

    for (const commit of tree.commits) {
      this.liveCommits.set(commit.id, commit);
      this.allCommits.add(commit.id);
    }
    for (const effect of tree.cleanups) {
      this.liveCleanups.set(effect.id, effect);
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
          if (pending.distance === 1) {
            this.roots.add(pending.id);
          }
          break;
        case 'removed':
          this.liveCommits.delete(pending.id);
          this.allCommits.delete(pending.id);
          if (pending.distance === 1) {
            this.roots.delete(pending.id);
          }
          break;
      }
    }
  }

  loadEffectWorker(effectWorker: EffectWorkerReport) {
    this.pendingEffectWorker = effectWorker;
  }

  applyEffects() {
    if (!this.pendingEffectWorker)
      return;

    for (const [_, effectReport] of this.pendingEffects) {
      // First, consider every effect that ran
      // must have run it's cleanup (if available)
      this.liveCleanups.delete(effectReport.id);
    }
    for (const effectCleanupReport of this.pendingEffectWorker.newCleanups) {
      this.liveCleanups.set(effectCleanupReport.id, effectCleanupReport);
    }
  }

  getAllCleanups() {
    if (!this.pendingEffectWorker)
      return [...this.liveCleanups.values()];

    return [...new Map([
      ...this.liveCleanups,
      ...this.pendingEffectWorker.newCleanups.map(c => [c.id, c] as const)
    ]).values()]
  }

  clearDelta() {
    this.pendingCommits.clear();
    this.pendingCommitStates.clear();
    this.pendingEffects.clear();
  }

  getCommit(id: CommitID) {
    const mountTask = this.mountTasks.get(id);
    if (mountTask) {
      // this commit isn't "real" yet
      // so lets make up shit.
      const commit = {
        id: mountTask.id,
        // mountTasks will always have element defined
        element: mountTask.element as ElementReport,
        children: [],
        parent: mountTask.parent,
        distance: mountTask.distance,
        version: -1 as CommitVersion
      };
      return commit;
    }

    const pendingCommit = this.pendingCommits.get(id);
    const liveCommit = this.liveCommits.get(id);

    if (pendingCommit && liveCommit) {
      // merge children if we have old + new
      return {
        ...pendingCommit,
        children: [...new Set([...pendingCommit.children, ...liveCommit.children])],
      }
    }
    return pendingCommit || liveCommit || null;
  }
  getCommitOrThrow(id: CommitID) {
    const commit = this.getCommit(id);
    if (!commit)
      throw new Error();
    return commit;
  }
  getCommitState(id: CommitID) {
    if (this.mountTasks.has(id))
      return 'mount-task';

    return this.pendingCommitStates.get(id) || 'live';
  }
}