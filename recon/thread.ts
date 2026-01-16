import { Element, specialNodeTypes } from "@lukekaalim/act";
import { Commit, Commit2, CommitID, CommitRef, CommitRef2 } from "./commit.ts";
import { Delta, DeltaSet, DeltaSet2 } from "./delta.ts";
import { CommitTree, CommitTree2 } from "./tree.ts";
import { calculateUpdates, Update, WorkTask } from "./update.ts";
import { ElementService } from "./element.ts";
import { EffectTask } from "./state.ts";
import { last } from "./algorithms.ts";

export type WorkReason =
  | { type: 'mount', element: Element, ref: CommitRef }
  | { type: 'target', ref: CommitRef }

/**
 * Apply a thread to a tree, modifying it's commit list
 * to match the changes produced by the thread.
 * 
 * @param thread 
 * @param tree 
 */
const applyWorkThread = (thread: WorkThread, tree: CommitTree) => {
  DeltaSet.apply(thread.deltas, tree);
  return null;
}

/**
 * Remove all changes from a particular commit and all it's children
 * - essentially making it as if it had never rendered at all
 * @param thread
 * @param from 
 */
const rollbackWorkThread = (thread: WorkThread, from: CommitRef) => {
  // TODO: rollbacks are hard: need rollback compatible with new
  // thread model
  throw new Error();
  /*
  thread.deltas.created = thread.deltas.created.filter(d => !isDescendant(from, d.ref));
  thread.deltas.updated = thread.deltas.updated.filter(d => !isDescendant(from, d.ref));
  thread.deltas.removed = thread.deltas.removed.filter(d => !isDescendant(from, d.ref));
  thread.deltas.skipped = thread.deltas.skipped.filter(d => !isDescendant(from, d.next));

  thread.visited = new Set([...thread.visited].filter(v => !isDescendant(from, v)))

  thread.pendingUpdates = thread.pendingUpdates.filter(update => !isDescendant(from, update.ref))
  thread.pendingEffects = thread.pendingEffects.filter(effect => !isDescendant(from, effect.ref))
  */
}

const updateWorkThread = (thread: WorkThread, update: Update, tree: CommitTree, element: ElementService) => {
  const { next, prev, ref, moved } = update;

  const identicalChange = next && prev && (next.id === prev.element.id);
  const prevChildren = prev && prev.children
    .map(c => tree.commits.get(c.id) as Commit) || [];

  if (identicalChange) {
    const mustVisit = thread.mustVisit.has(ref.id);
    if (!mustVisit)
      return;

    const mustRender = thread.mustRender.has(ref.id);

    if (!mustRender) {
      const updates = prevChildren.map(prev => Update.skip(prev));  
      thread.pendingUpdates.push(...updates);
      const commit = Commit.version(prev);
      thread.deltas.skipped.push({ next: commit });
      return;
    }
  }
  thread.visited.set(ref.id, ref);
  
  if (next) {
    const output = element.render(next, ref, thread);
    if (output.reject) {
      console.error(output.reject);
      console.error(`No boundary to catch error: Unmounting roots`);
      for (const ref of tree.roots) {
        WorkThread.rollback(thread, ref);
        const prev = tree.commits.get(ref.id);
        if (prev)
          thread.pendingUpdates.push(Update.remove(prev));
      }
    }

    const [childRefs, updates] = calculateUpdates(ref, prevChildren, output.child);

    thread.pendingEffects.push(...output.effects);
    for (const update of updates) {
      // if someone has already marked the update as needing rendering, assume
      // that there is already an update in the stack to handle it.
      if (!thread.mustRender.has(update.ref.id))
        thread.pendingUpdates.push(update);
    }

    const commit = Commit.update(ref, next, childRefs);

    if (prev)
      thread.deltas.updated.push({ ref, prev, next: commit, moved });
    else
      thread.deltas.created.push({ ref, next: commit });

    // Update tree
    //tree.commits.set(ref.id, commit);

    return;
  }
  else if (prev && !next) {
    // We should delay this?
    const output = element.clear(prev);

    thread.deltas.removed.push({ ref: prev, prev });
    thread.pendingUpdates.push(...prevChildren.map(prev => Update.remove(prev)));
    thread.pendingEffects.push(...output.effects);
    return;
  } else {
    throw new Error(`No prev, no next, did this commit ever exist?`)
  }
};

/**
 * Start a new Update in the current Thread.
 * @param thread
 * @param ref 
 * @param tree 
 */
const startWorkThreadUpdate = (thread: WorkThread, ref: CommitRef, prev: Commit | null, next: Element | null) => {
  // Once a update starts,
  // all "parents" are considered to have been visited,
  // and cannot be rendered in this pass.
  for (const id of [...ref.path].reverse().slice(1))
    thread.visited.set(id, ref);

  thread.pendingUpdates.push({
    ref,
    prev,
    next,
    moved: false,
  })
}

/**
 * For a running thread, add an additional "target" to render,
 * which forces the thread to VISIT each commit on the path to the target,
 * and to RENDER the target specifically.
 * 
 * @param thread
 * @param target 
 * @returns `true` if the target was added successfully (or was already in the thread),
 * or `false` if it could not be added for some reason, such as:
 *    - The thread has already visited the Commit (a thread will never backtrack)
 */
const queueWorkThreadTarget = (thread: WorkThread, target: CommitRef, tree: CommitTree): boolean => {
  // We cant do work on a commit that has
  // already been visited
  if (thread.visited.has(target.id))
    return false;

  // If the thread _already_ has this ref as a target,
  // do nothing
  if (thread.mustRender.has(target.id))
    return true;

  thread.reasons.push({ type: 'target', ref: target });
  thread.mustRender.set(target.id, target);

  // Search through all the parents, looking to see if
  // there are any pendingUpdates that might
  // lead to this commit. If so, make sure ancestor commit
  // is on the MustVisit so they should make their way down
  // eventually
  for (let i = target.path.length - 1; i >= 0; i--) {
    const id = target.path[i];
    thread.mustVisit.add(id);

    for (const update of thread.pendingUpdates) {
      // Found an ancestor pending update - it should
      // handle our target eventually
      if (update.ref.id === id)
        return true;
    }
  }

  // otherwise, start a new update from the root
  const prev = tree.commits.get(target.id) as Commit;
  startWorkThreadUpdate(thread, target, prev, prev.element);
  return true;
}

const queueWorkThreadMount = (thread: WorkThread, ref: CommitRef, element: Element) => {
  thread.reasons.push({ type: 'mount', element, ref });
  startWorkThreadUpdate(thread, ref, null, element);
};


/**
 * A WorkThread is a mutable data structure that
 * represents a particular "Tree Traversal Task".
 * 
 * Its expected when you start rendering, you
 * may start rendering more nodes due to updates.
 * 
 * A thread can be "worked" to remove an update off the
 * "pending updates" list, which may optionally produce more
 * updates, effects, or error notification.
 */
export type WorkThread = {
  reasons: WorkReason[],
  
  mustRender: Map<CommitID, CommitRef>,
  mustVisit: Set<CommitID>,
  
  pendingUpdates: Update[],
  pendingEffects: EffectTask[],

  errorNotifications: Map<CommitID, CommitRef>,

  /**
   * A list of each commit the thread processed
   */
  visited: Map<CommitID, CommitRef>,
  deltas: DeltaSet,
};

export const cloneWorkThread = (thread: WorkThread): WorkThread => {
  return {
    reasons: [...thread.reasons],
    pendingEffects: [...thread.pendingEffects],
    pendingUpdates: [...thread.pendingUpdates],
    errorNotifications: new Map(thread.errorNotifications),

    mustVisit: new Set(thread.mustVisit),
    mustRender: new Map(thread.mustRender),

    visited: new Map(thread.visited),

    deltas: DeltaSet.clone(thread.deltas),
  }
}

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
  pendingUpdates: WorkTask[] = [];
  /**
   * A thread collects effects
   */
  pendingEffects: EffectTask[] = [];

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
    this.pendingUpdates = [];
    this.mustRender.clear();
    this.mustVisit.clear();
    this.visited.clear();
  }

  get done() {
    return this.pendingUpdates.length === 0 && this.missed.size === 0;
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
      this.pendingUpdates.push({
        ref: reason.ref,
        prev: null,
        next: reason.element,
        moved: false,
      })
      return console.log('Is Mount', reason);
    }
    if (this.visited.has(reason.ref.id)) {
      this.missed.add(reason.ref.id);
      return console.log('Missed', reason);
    }

    // If the reason is already in the "mustRender",
    // we already intend to render it, so do nothing
    if (this.mustRender.has(reason.ref.id))
      return console.log('Someone else got it', reason);

    // Search through all the parents, looking to see if
    // there are any pendingUpdates that might
    // lead to this commit. If so, make sure ancestor commit
    // is on the MustVisit so they should make their way down
    // eventually
    for (let i = reason.ref.path.length - 1; i >= 0; i--) {
      // tracing backwards up our path
      const id = reason.ref.path[i];
      this.mustVisit.add(id);

      for (const update of this.pendingUpdates) {
        // If we find there is an Update already
        // existing to handle our commit, exit early
        if (update.ref.id === id)
          return console.log('Already on the path', reason);
      }
    }
    // There are no updates (queued pieces of work)
    // We need at least one to kick off the rendering process

    // We're going to just skip all the parents up until the
    // specific commit we want to render
    for (const id of reason.ref.path)
      this.visited.add(id);

    console.log('Making a new Update', reason);
    this.mustRender.add(reason.ref.id);
    const prev = this.tree.commits.get(reason.ref.id) as Commit2;
    this.pendingUpdates.push(WorkTask.visit(prev))
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
        
    const commit = Commit2.fresh(ref, element, output.childRefs);

    this.tree.commits.set(commit.ref.id, commit);
    this.delta.add(commit);

    if (output.effects)
      this.delta.addEffects(output.effects);

    for (const update of output.updates) {
      // if someone has already marked the update as needing rendering, assume
      // that there is already an update in the stack to handle it.
      if (!this.mustRender.has(update.ref.id))
        this.pendingUpdates.push(update);
    }
  }
  updateCommit(commit: Commit2, element: Element, moved: boolean) {
    const oldElement = commit.element;
    const output = this.tree.processElement(element, commit.ref, commit);

    commit.update(element, output.childRefs);
    this.delta.update(oldElement, commit, moved);

    this.pendingUpdates.push(...output.updates);
    if (output.effects)
      this.delta.addEffects(output.effects);
  }
  removeCommit(commit: Commit2) {
    const output = this.tree.unmountCommit(commit);

    this.tree.commits.delete(commit.ref.id);
    this.delta.delete(commit);

    this.pendingUpdates.push(...output.updates);
    if (output.cleanups)
      this.delta.addEffects(output.cleanups);
  }
  skipCommit(commit: Commit2) {
    const prevChildren = commit.children
      .map(c => this.tree.commits.get(c.id) as Commit2);

    const updates = prevChildren.map(prev => WorkTask.visit(prev));  
    this.pendingUpdates.push(...updates);

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

  processUpdate(update: WorkTask) {
    const { next, prev, ref } = update;

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
    
    this.visit(update);
  }

  work() {
    const update = this.pendingUpdates.pop();
    if (update) {
      this.processUpdate(update);
    } else {
      this.reset();
      this.queueMissed();
    }
  }

  queueMissed() {
    for (const missedId of this.missed) {
      const commit = this.tree.commits.get(missedId);
      if (commit)
        this.queue({ type: 'target', ref: commit.ref });
    }
    this.missed.clear();
  }
}

export const WorkThread = {
  new(): WorkThread {
    return {
      reasons: [],
      pendingEffects: [],
      pendingUpdates: [],
      errorNotifications: new Map(),

      mustVisit: new Set(),
      mustRender: new Map(),

      visited: new Map(),

      deltas: DeltaSet.create(),
    }
  },
  rollback: rollbackWorkThread,
  apply: applyWorkThread,
  update: updateWorkThread,
  queueTarget: queueWorkThreadTarget,
  queueMount: queueWorkThreadMount,

  clone: cloneWorkThread,

  notifyError(thread: WorkThread, ref: CommitRef) {
    thread.errorNotifications.set(ref.id, ref);
  },
  /**
   * Find the closest ancestor error boundary for a commit,
   * either in the tree or one that was just created
   * */
  findClosestBoundary(thread: WorkThread, tree: CommitTree, ref: CommitRef): Commit | null {
    return last(ref.path, id => {
      if (tree.commits.has(id)) {
        const commit = tree.commits.get(id) as Commit;
        if (commit.element.type === specialNodeTypes.boundary)
          return commit;
        return null;
      }
      // We also might have just created the boundary
      const freshBoundary = thread.deltas.created.find(c => c.ref.id === id && c.next.element.type === specialNodeTypes.boundary);
      if (freshBoundary)
        return freshBoundary.next;
      return null;
    });
  }
}
