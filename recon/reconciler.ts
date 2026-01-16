import { convertNodeToElements, h, Node, OpaqueID, primitiveNodeTypes } from "@lukekaalim/act";
import { CommitID, CommitRef, CommitRef2 } from "./commit";
import { WorkThread, WorkThread2 } from "./thread"
import { CommitTree, CommitTree2 } from "./tree";
import { ElementService } from "./element";
import { Scheduler } from "./scheduler";
import { createEventEmitter, EventEmitter } from "./event";
import { Delta, DeltaSet2 } from "./delta";

export type Reconciler = {
  mount(node: Node): void,
  render(ref: CommitRef): void,

  state: ReconcilerState,
  tree: CommitTree,
  elements: ElementService,
  subscribe: EventEmitter<ReconcilerEvent>["subscribe"],
}

export type ReconcilerEventBus = {
  render(delta: Delta): void,
};

/**
 * The Reconciler is the main object that
 * owns the CommitTree, and can coordinate threads
 * to work on new changes.
 * 
 * Renderers can subscribe to it's events
 */
export class Reconciler2 {
  tree: CommitTree2;
  scheduler: Scheduler;
  bus: ReconcilerEventBus = {
    render: () => {}
  };
  // in the future - maybe more than one thread?
  thread: WorkThread2;

  constructor(scheduler: Scheduler) {
    this.scheduler = scheduler;
    this.tree = new CommitTree2(this);
    this.thread = new WorkThread2(this.tree);

    this.scheduler.setCallbackFunc(() => this.work());
  }

  work() {
    if (!this.thread.done) {
      // do some work
      this.thread.work();
      this.scheduler.requestCallback();
    } else {
      const currentThread = this.thread;
      // Start a new thread
      this.thread = new WorkThread2(this.tree);

      console.log(currentThread);
      console.log(currentThread.delta);
      console.log('Thread.size', currentThread.visited.size)
      console.log('Delta.size', currentThread.delta.size)

      // send delta ready
      this.bus.render(currentThread.delta);

      // run effects
      for (const cleanup of currentThread.delta.cleanups.values())
        cleanup.func();
      for (const effect of currentThread.delta.effects.values())
        effect.func();

    }
  }

  mount(node: Node): void {
    const ref = CommitRef2.fresh();
    const element = (!!node && typeof node === 'object' && "type" in node)
      ? node
      : h(primitiveNodeTypes.array, {}, node);

    this.thread.queue({ type: 'mount', ref, element });
    this.scheduler.requestCallback();
  }
  render(ref: CommitRef2): void {
    console.log(`Queueing work for `, ref)
    this.thread.queue({ type: 'target', ref });
    this.scheduler.requestCallback();
  }
}

export type ReconcilerState = {
  thread: WorkThread | null,
  pendingThreadStack: WorkThread[],
  /**
   * These are targets that can't be fulfilled with the current thread
   * */
  pendingTargets: Map<CommitID, CommitRef>,
}

export type ReconcilerEvent =
  | { type: 'thread:start', thread: WorkThread }
  | { type: 'thread:update', thread: WorkThread }
  | { type: 'thread:complete', thread: WorkThread }
  | { type: 'thread:new-target', thread: WorkThread }
  | { type: 'thread:new-root', thread: WorkThread }

export const createReconciler = (scheduler: Scheduler): Reconciler => {
  const events = createEventEmitter<ReconcilerEvent>();
  const state: ReconcilerState = {
    thread: null,
    pendingThreadStack: [],
    pendingTargets: new Map(),
  };

  const work = () => {
    if (!state.thread)
      return;

    const update = state.thread.pendingUpdates.pop();
    if (update) {
      WorkThread.update(state.thread, update, tree, elements);
      
      scheduler.requestCallback();
    } else {
      const completedThread = state.thread;
      state.thread = null;

      const pendingTargets = [...state.pendingTargets]
      state.pendingTargets.clear();
      state.pendingThreadStack.push(completedThread);
      WorkThread.apply(completedThread, tree);

      if (pendingTargets.length === 0) {
        for (const thread of state.pendingThreadStack) {
          // fire off all renders
          events.emit({ type: 'thread:complete', thread });

          // Run side effects
          for (const effect of thread.pendingEffects) {
            try {
              effect.func();
            } catch (error) {
              console.error(error);
            }
          }
        }

        state.pendingThreadStack = [];
      } else {
        const nextThread = getOrStartThread();
        for (const [,target] of pendingTargets) {
          render(target);
        }
        nextThread.pendingEffects.push(...completedThread.pendingEffects);
      }
    }
  }

  const getOrStartThread = () => {
    if (!state.thread) {
      state.thread = WorkThread.new();
      events.emit({ type: 'thread:start', thread: state.thread });
    } else {
    }
    scheduler.requestCallback();
    return state.thread;
  }

  const mount = (node: Node) => {
    const thread = getOrStartThread();
    const elements = convertNodeToElements(node)

    for (const element of elements) {
      const ref = CommitRef.new()
      tree.roots.add(ref);
      WorkThread.queueMount(thread, ref, element);
    }
    events.emit({ type: 'thread:new-root', thread });
  };
  const render = (ref: CommitRef) => {
    const thread = getOrStartThread();

    if (WorkThread.queueTarget(thread, ref, tree)) {
      events.emit({ type: 'thread:new-target', thread });
    } else {
      state.pendingTargets.set(ref.id, ref);
    }
  }

  const tree = CommitTree.new();
  const elements = ElementService.create(tree, render);


  scheduler.setCallbackFunc(work);

  return { mount, render, state, tree, elements, subscribe: events.subscribe };
}