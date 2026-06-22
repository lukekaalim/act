import { createId, Element, OpaqueID, primitiveNodeTypes } from "@lukekaalim/act";
import { Commit2, CommitID, CommitRef2 } from "./commit.ts";
import { Delta } from "./delta.ts";
import { CommitTree2 } from "./tree.ts";
import { WorkTask } from "./update.ts";
import { EffectTask } from "./state.ts";
import { ReconcilerEventBus } from "./reconciler.ts";

export type WorkRequest =
  | { type: 'mount', element: Element, ref: CommitRef2 }
  | { type: 'unmount', ref: CommitRef2 }
  | { type: 'target', ref: CommitRef2 }

export type QueueResult =
  | 'new-task'
  | 'missed'
  | 'existing-target'
  | 'existing-task'

export type ThreadState = {
  requests: WorkRequest[];
  missedRequests: WorkRequest[];

  mustRender: Set<CommitID>;
  mustVisit: Set<CommitID>;
  pendingTasks: WorkTask[];

  missed: Set<CommitID>;
  missedUnmount: Set<CommitID>;

  visited: Set<CommitID>;

  started: boolean;
  submitted: boolean;

  pass: number;
  id: OpaqueID<"ThreadID">;
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
  requests: WorkRequest[] = [];
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

  unmountMissed: Set<CommitID> = new Set();

  requestsMissed: WorkRequest[] = [];
  /**
   * A list of each commit the thread processed
   */
  visited: Set<CommitID> = new Set();

  delta: Delta = new Delta();

  id = createId("ThreadID")
  passes = 1;

  /** Have we done any work yet? */
  started = false;
  /** Have we submitted our delta to the renderer? */
  submitted = false;

  constructor(tree: CommitTree2) {
    this.tree = tree;
  }

  get done() {
    return this.started && !this.hasWork;
  }
  get hasWork() {
    return this.pendingTasks.length > 0 || this.missed.size > 0 || (this.started && !this.submitted);
  }

  /**
   * Add some work to be done by the thread.
   * 
   * @param reason 
   * @returns true if the Thread can accept the work, or false 
   * if the Thread has already rendered this element (you
   * have to queue it in the next thread)
   */
  queue(reason: WorkRequest): QueueResult {
    if (this.submitted) {
      this.requestsMissed.push(reason);
      return 'missed';
    }

    // We are very lazy in this function -  we only
    // want to create a new update at the worst possible
    // case
    this.requests.push(reason);

    // Mounts are really easy - they never have any history, so
    // we don't need to check for conflicts.
    if (reason.type === 'mount') {
      this.pendingTasks.push(WorkTask.fresh(reason.ref, reason.element));
      return 'new-task';
    }
    if (this.visited.has(reason.ref.id)) {
      if (reason.type === 'unmount') {
        this.unmountMissed.add(reason.ref.id);
        return 'missed'
      }
      else {
        this.missed.add(reason.ref.id);
        return 'missed';
      }
    }

    // If the reason is already in the "mustRender",
    // we already intend to render it, so do nothing
    if (this.mustRender.has(reason.ref.id))
      return 'existing-target';
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
          return 'existing-task';
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
      if (ancestor.id !== reason.ref.id)
        this.visited.add(ancestor.id);
      
      ancestor = ancestor.parent;
    }

    const prev = this.tree.commits.get(reason.ref.id) as Commit2;
    switch (reason.type) {
      case 'target':
        this.pendingTasks.push(WorkTask.visit(prev))
        break;
      case 'unmount':
        this.pendingTasks.push(WorkTask.remove(prev))
        break;
    }
    return 'new-task';
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
        
    const commit = new Commit2(ref, element, output.childRefs);

    this.tree.commits.set(commit.ref.id, commit);
    this.delta.add(commit);
    if (commit.ref.length === 1)
      this.tree.roots.add(commit.ref.id);

    if (output.effects)
      this.delta.addEffects(output.effects);

    this.pendingTasks.push(...output.updates.toReversed());
  }
  updateCommit(commit: Commit2, element: Element, moved: boolean) {
    const output = this.tree.processElement(element, commit.ref, commit);

    const oldElement = commit.element;
    commit.update(element, output.childRefs);
    this.delta.update(oldElement, commit, moved);

    this.pendingTasks.push(...output.updates.toReversed());
    if (output.effects)
      this.delta.addEffects(output.effects);
  }
  removeCommit(commit: Commit2) {
    const output = this.tree.unmountCommit(commit);

    this.tree.commits.delete(commit.ref.id);
    this.delta.delete(commit);
    if (commit.ref.length === 1)
      this.tree.roots.delete(commit.ref.id);

    this.pendingTasks.push(...output.updates.toReversed());
    if (output.effects)
      this.delta.addEffects(output.effects);
  }
  skipCommit(commit: Commit2) {
    const prevChildren = commit.children
      .map(c => this.tree.commits.get(c.id) as Commit2);

    const updates = prevChildren.map(prev => WorkTask.visit(prev));  
    this.pendingTasks.push(...updates.toReversed());

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

    if (next && prev) {
      let identicalChange = (
        (next.id === prev.element.id)
        || ((next.type === primitiveNodeTypes.string || next.type === primitiveNodeTypes.number) && next.props.value === prev.element.props.value)
      );

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
    }
    
    this.visit(task);
  }

  work() {
    const task = this.pendingTasks.pop();

    if (task) {
      this.started = true;
      this.processTask(task);
    } else if (this.missed.size > 0) {
      this.startNextPass();
    } else if (this.started && !this.submitted) {
      this.submit();
    } else {
      console.info(`Work on thread was requested, but no work was needed`)
    }
  }

  startNextPass() {
    this.pendingTasks = [];
    this.mustRender.clear();
    this.mustVisit.clear();
    this.visited.clear();
    this.started = false

    this.passes++;

    const missedCommit = [...this.missed]
      .map(id => this.tree.commits.get(id))
      .filter(x => !!x)
      .sort((a, b) => a.ref.length - b.ref.length);

    const unmountingRefs = new Map([...this.unmountMissed]
      .map(id => this.tree.commits.get(id))
      .filter(x => !!x)
      .map(c => [c.ref.id, c.ref])
    ) 

    for (const commitRef of unmountingRefs.values()) {
      this.queue({ type: 'unmount', ref: commitRef });
    }

    for (const commit of missedCommit) {
      if (commit.ref.find(ref => unmountingRefs.has(ref.id)))
        continue;

      this.queue({ type: 'target', ref: commit.ref });
    }
    this.missed.clear();
  }

  /**
   * Clear the thread of all work,
   * except for any missed requests
   */
  reset() {
    const missed = this.requestsMissed;

    this.requests = [];
    this.pendingTasks = [];
    this.requestsMissed = [];

    this.missed.clear();
    this.mustRender.clear();
    this.mustVisit.clear();
    this.visited.clear();
    this.delta = new Delta();

    this.id = createId();
    
    this.passes = 1;

    this.submitted = false;
    this.started = false;

    for (const request of missed)
      this.queue(request);
  }

  bus = { render(delta: Delta): void {} }

  submit() {
    this.submitted = true;

    this.bus.render(this.delta);
    this.tree.runEffects(this.delta.effects);
  }
}
