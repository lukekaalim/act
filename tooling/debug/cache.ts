import { CommitID, CommitVersion, EffectID } from "@lukekaalim/act-recon";
import { CommitReport, EffectCleanupReport, ElementReport, ThreadReport, TreeReport, WorkTaskReport } from "./report";

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
  pendingCommitMounts: Map<CommitID, WorkTaskReport> = new Map();

  pendingCleanups: Map<EffectID, EffectCleanupReport> = new Map();
  pendingCleanupStates: Map<EffectID, 'created' | 'removed'> = new Map();

  init(tree: TreeReport) {
    this.roots = new Set(tree.roots);
    this.liveCommits.clear();
    this.liveCleanups.clear();

    for (const commit of tree.commits) {
      this.liveCommits.set(commit.id, commit);
    }
    for (const effect of tree.cleanups) {
      this.liveCleanups.set(effect.id, effect);
    }
  }

  clear() {
    this.pendingCommits.clear();
    this.pendingCommitStates.clear();
    this.pendingCommitMounts.clear();
    this.pendingCleanups.clear();
    this.pendingCleanupStates.clear();
  }

  /**
   * "Loading" a thread stores it's changes temporarily,
   * allowing you to access the original data as well as what
   * changes are proposed. Loaded threads can be replaced
   * by loading another thread. Once a thread is finished,
   * you can "apply" the thread to save it permanently.
   * @param thread 
   */
  load(thread: ThreadReport) {
    this.clear();

    // Update our commits
    for (const commit of thread.delta.created) {
      this.pendingCommits.set(commit.id, commit);
      this.pendingCommitStates.set(commit.id, 'created');
    }
    for (const commit of thread.delta.updated) {
      this.pendingCommits.set(commit.id, commit);
      this.pendingCommitStates.set(commit.id, 'updated');
    }
    for (const commit of thread.delta.removed) {
      this.pendingCommits.set(commit.id, commit);
      this.pendingCommitStates.set(commit.id, 'removed');
    }
    // Update our cleanups
    for (const cleanup of thread.effects.added) {
      this.pendingCleanups.set(cleanup.id, cleanup);
      this.pendingCleanupStates.set(cleanup.id, 'created');
    }
    for (const cleanup of thread.effects.removed) {
      this.pendingCleanups.set(cleanup.id, cleanup);
      this.pendingCleanupStates.set(cleanup.id, 'removed');
    }
    // Update our mount tasks
    for (const task of thread.pendingTasks) {
      if (task.prev)
        continue;
      this.pendingCommitMounts.set(task.id, task)
    }
  }
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
          if (pending.distance === 1) {
            this.roots.delete(pending.id);
          }
          break;
      }
    }
    for (const pending of this.pendingCleanups.values()) {
      const state = this.pendingCleanupStates.get(pending.id)
      if (!state)
        continue;
      switch (state) {
        case 'created':
          this.liveCleanups.set(pending.id, pending);
          break;
        case 'removed':
          this.liveCleanups.delete(pending.id);
          break;
      }
    }
  }


  getAllCleanups() {
    return [...new Map([...this.liveCleanups, ...this.pendingCleanups]).values()]
  }
  
  getCleanup(id: EffectID) {
    return this.pendingCleanups.get(id) || this.liveCleanups.get(id) || null;
  }

  getCommit(id: CommitID) {
    const mountTask = this.pendingCommitMounts.get(id);
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
    if (this.pendingCommitMounts.has(id))
      return 'mount-task';

    return this.pendingCommitStates.get(id) || 'live';
  }
}