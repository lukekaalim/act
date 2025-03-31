import { convertNodeToElements, Node, OpaqueID } from "@lukekaalim/act";
import { CommitID, CommitRef } from "./commit";
import { WorkThread } from "./thread"
import { CommitTree } from "./tree";
import { ElementService } from "./element";
import { Scheduler, WorkID } from "./scheduler";
import { createEventEmitter, EventEmitter } from "./event";

export type Reconciler = {
  mount(node: Node): void,
  render(ref: CommitRef): void,

  state: ReconcilerState,
  tree: CommitTree,
  elements: ElementService,
  on: EventEmitter<ReconcilerEvents>["on"],
}

export type ReconcilerState = {
  thread: WorkThread | null,
  work: WorkID | null,
  /**
   * These are targets that can't be fulfilled with the current thread
   * */
  pendingTargets: Map<CommitID, CommitRef>,
}

export type ReconcilerEvents = {
  'on-thread-start': WorkThread,
  'on-thread-update': WorkThread,
  'on-thread-complete': WorkThread,
}

export const createReconciler = (scheduler: Scheduler): Reconciler => {
  const events = createEventEmitter<ReconcilerEvents>();
  const state: ReconcilerState = {
    thread: null,
    work: null,
    pendingTargets: new Map(),
  };

  const work = () => {
    state.work = null;
    if (!state.thread)
      return;

    const update = state.thread.pendingUpdates.pop();
    if (update) {
      WorkThread.update(state.thread, update, tree, elements);
      state.work = scheduler.requestWork(work);
    } else {
      const completedThread = state.thread;
      state.thread = null;

      const pendingTargets = [...state.pendingTargets]
      state.pendingTargets.clear();

      for (const [,target] of pendingTargets)
        render(target);

      WorkThread.apply(completedThread, tree);
      events.call('on-thread-complete', completedThread);

      // Run side effects
      for (const effect of completedThread.pendingEffects) {
        try {
          effect.func();
        } catch (error) {
          console.error(error);
        }
      }
    }
  }

  const start = () => {
    if (!state.thread) {
      state.thread = WorkThread.new();
      events.call('on-thread-start', state.thread);
    }
    if (!state.work) {
      state.work = scheduler.requestWork(work);
    }
    return state.thread;
  }

  const mount = (node: Node) => {
    const thread = start();
    const elements = convertNodeToElements(node)

    for (const element of elements) {
      const ref = CommitRef.new()
      tree.roots.add(ref);
      WorkThread.queueMount(thread, ref, element);
    }
    events.call('on-thread-update', thread);
  };
  const render = (ref: CommitRef) => {
    const thread = start();

    if (WorkThread.queueTarget(thread, ref, tree)) {
      events.call('on-thread-update', thread);
    } else {
      state.pendingTargets.set(ref.id, ref);
    }
  }

  const tree = CommitTree.new();
  const elements = ElementService.create(tree, render);

  return { mount, render, state, tree, elements, on: events.on };
}