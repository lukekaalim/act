import { createId, Element } from "@lukekaalim/act";
import { Commit2, CommitID, CommitRef2 } from "./commit.ts";
import { Delta } from "./delta.ts";
import { CommitTree2 } from "./tree.ts";
import { WorkTask } from "./update.ts";
import { EffectTask } from "./state.ts";

export type WorkReason =
  | { type: 'mount', element: Element, ref: CommitRef2 }
  | { type: 'target', ref: CommitRef2 }

/**
 * A temporary data structure that carries the state of a
 * work-in-progress update to the tree.
 *
 * An update to the tree is designed to be broken up - the scheduler
 * will continually call the "work" function many times.
 */
export class WorkThread2 {
  tree: CommitTree2;

  /**
   * Each time an external system adds an update to the current thread,
   * they record the "reason", so you can trace which effects
   * cause/contributed to this thread.
   */
  reasons: WorkReason[] = [];
  /**
   * A Map of every commit that NEEDS to be rendered if you visit them.
   * This is often for commits that explicitly need a re-render because
   * they updated and are the reason for the re-render.
   */
  mustRender: Set<CommitID> = new Set();
  /**
   * A Set of every commit that NEEDS to be visited. Normally,
   * when an update is requested all the target's parents are
   * labelled "mustVisit" so any update thread should get to
   * the target eventually.
   */
  mustVisit: Set<CommitID> = new Set();
  
  /**
   * A stack of "Update" objects representing Commits (often
   * children of commits just processed)
   */
  pendingTasks: WorkTask[] = [];

  /** 
   * When a change is requested on a thread, but the target
   * commit has already been "visited", we instead put it
   * in out "missed" backlog.
   * 
   * Once a thread has completed all it's updates, it may
   * start an additional "pass", resetting itself (but not it's "DeltaSet")
   * and loading in all the missed targets as new updates.
  */
  missed: Set<CommitID> = new Set();


  errorNotifications: Map<CommitID, CommitRef2> = new Map();

  /**
   * A list of each commit the thread processed
   */
  visited: Set<CommitID> = new Set();

  delta: Delta = new Delta();

  id = createId("ThreadID")
  passes = 1;

  constructor(tree: CommitTree2) {
    this.tree = tree;
  }

  /**
   * Clear out the internal state of the thread
   * to be ready to start a fresh pass
   * 
   * Keeps the results of the previous visits!
   */
  reset() {
    this.pendingTasks = [];
    this.mustRender.clear();
    this.mustVisit.clear();
    this.visited.clear();
  }

  get done() {
    return this.pendingTasks.length === 0 && this.missed.size === 0;
  }

  /**
   * Add some work to be done by the thread.
   * 
   * @param reason 
   * @returns true if the Thread can accept the work, or false 
   * if the Thread has already rendered this element (you
   * have to queue it in the next thread)
   */
  queue(reason: WorkReason) {
    // We are very lazy in this function -  we only
    // want to create a new update at the worst possible
    // case
    this.reasons.push(reason);

    // Mounts are really easy - they never have any history, so
    // we don't need to check for conflicts.
    if (reason.type === 'mount') {
      this.pendingTasks.push(WorkTask.fresh(reason.ref, reason.element));
      return;
    }
    if (this.visited.has(reason.ref.id)) {
      this.missed.add(reason.ref.id);
      return;
    }

    // If the reason is already in the "mustRender",
    // we already intend to render it, so do nothing
    if (this.mustRender.has(reason.ref.id))
      return;
    this.mustRender.add(reason.ref.id);

    // Search through all the parents, looking to see if
    // there are any pendingTasks that might
    // lead to this commit. If so, make sure ancestor commit
    // is on the MustVisit so they should make their way down
    // eventually
    let ancestor: CommitRef2 | null = reason.ref;
    while (ancestor) {
      this.mustVisit.add(ancestor.id);

      // If we find there is an Update already
      // existing to handle our commit, exit early
      for (const update of this.pendingTasks) {
        if (update.ref.id === ancestor.id) {
          return true;
        }
      }
      ancestor = ancestor.parent;
    }

    // There are no updates (queued pieces of work)
    // We need at least one to kick off the rendering process

    // We're going to just skip all the parents up until the
    // specific commit we want to render
    ancestor = reason.ref;
    while (ancestor) {
      this.visited.add(ancestor.id);
      ancestor = ancestor.parent;
    }

    const prev = this.tree.commits.get(reason.ref.id) as Commit2;
    this.pendingTasks.push(WorkTask.visit(prev))
  }

  /**
   * Perform the work to add a fresh commit into the tree,
   * enqueuing additional work onto the thread if the commit has children.
   * 
   * @param element The element that the commit will have.
   * @param ref The location where the commit will be installed.
   */
  createCommit(element: Element, ref: CommitRef2) {
    const output = this.tree.processElement(element, ref, null);
        
    const commit = this.tree.reconciler.pools.commit.acquire(ref, element, output.childRefs);

    this.tree.commits.set(commit.ref.id, commit);
    this.delta.add(commit);

    if (output.effects)
      this.delta.addEffects(output.effects);

    for (const update of output.updates) {
      // if someone has already marked the update as needing rendering, assume
      // that there is already an update in the stack to handle it.
      if (!this.mustRender.has(update.ref.id))
        this.pendingTasks.push(update);
    }
  }
  updateCommit(commit: Commit2, element: Element, moved: boolean) {
    const output = this.tree.processElement(element, commit.ref, commit);

    const oldElement = commit.element;
    commit.update(element, output.childRefs);
    this.delta.update(oldElement, commit, moved);

    this.pendingTasks.push(...output.updates);
    if (output.effects)
      this.delta.addEffects(output.effects);
  }
  removeCommit(commit: Commit2) {
    const output = this.tree.unmountCommit(commit);

    this.tree.commits.delete(commit.ref.id);
    this.delta.delete(commit);

    this.pendingTasks.push(...output.updates);
    if (output.cleanups)
      this.delta.addEffects(output.cleanups);
  }
  skipCommit(commit: Commit2) {
    const prevChildren = commit.children
      .map(c => this.tree.commits.get(c.id) as Commit2);

    const updates = prevChildren.map(prev => WorkTask.visit(prev));  
    this.pendingTasks.push(...updates);

    commit.update();
  }

  visit(update: WorkTask) {
    this.visited.add(update.ref.id);
    
    if (update.next && !update.prev) {
      this.createCommit(update.next, update.ref);
    }
    else if (update.next && update.prev) {
      this.updateCommit(update.prev, update.next, update.moved);
    }
    else if (!update.next && update.prev) {
      this.removeCommit(update.prev);
    }
  }

  processTask(task: WorkTask) {
    const { next, prev, ref } = task;

    const identicalChange = next && prev && (next.id === prev.element.id);

    if (identicalChange) {
      const mustVisit = this.mustVisit.has(ref.id);
      if (!mustVisit)
        return;

      const mustRender = this.mustRender.has(ref.id);

      if (!mustRender) {
        this.skipCommit(prev)
        return
      }
    }
    
    this.visit(task);
  }

  work() {
    const task = this.pendingTasks.pop();
    if (task) {
      this.processTask(task);
      task.free();
    } else if (!this.done) {
      this.reset();
      this.queueMissed();
      this.passes++;
    }
  }

  queueMissed() {
    const missedCommit = [...this.missed]
      .map(id => this.tree.commits.get(id))
      .filter(x => !!x)
      .sort((a, b) => a.ref.length - b.ref.length);

    for (const commit of missedCommit) {
      this.queue({ type: 'target', ref: commit.ref });
    }
    this.missed.clear();
  }
}
