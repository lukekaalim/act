import { convertNodeToElement, h, Node, primitiveNodeTypes } from "@lukekaalim/act";
import { Commit2, CommitRef2 } from "./commit";
import { WorkThread2 } from "./thread"
import { CommitTree2 } from "./tree";
import { Scheduler } from "./scheduler";
import { Delta } from "./delta";
import { WorkTask } from "./update";
import { EffectTask2 } from "./state";

/**
 * The Reconciler Event Bus is a structure that contains callbacks
 * for specific reconciler events.
 * 
 * Systems like renderers or specific debug interceptors should
 * implement the bus functions, and then pass their instance
 * of the Bus to the reconciler.
 */
export type ReconcilerEventBus = {
  render(delta: Delta): void,
};

/**
 * The Reconciler is the main object that
 * owns the CommitTree, and coordinates with it's
 * thread to perform changes requested via `mount` and `render`.
 * 
 * The reconciler, upon receiving such a request
 */
export class Reconciler2 {
  tree: CommitTree2;
  scheduler: Scheduler;

  bus: ReconcilerEventBus = {
    render: () => {}
  };
  // in the future - maybe more than one thread?
  thread: WorkThread2;

  pools = {
    commit: Commit2.pool(),
  }

  constructor(scheduler: Scheduler) {
    this.scheduler = scheduler;
    this.tree = new CommitTree2(this);
    this.thread = new WorkThread2(this.tree);

    this.scheduler.setCallbackFunc(() => this.work());
    this.pools.commit.maxSize = 2048
  }

  startNewThread() {
    this.thread = new WorkThread2(this.tree);
  }

  runEffects(delta: Delta) {
    const tasksWithEffects: EffectTask2[] = [];
    
    for (const task of delta.effects.values()) {
      const cleanupState = this.tree.cleanups.get(task.id);
      if (cleanupState) {
        cleanupState.func();
        this.tree.cleanups.delete(task.id);
      }
      if (task.effect)
        tasksWithEffects.push(task);
    }
    for (const task of tasksWithEffects) {
      if (task.effect) {
        const cleanup = task.effect();
        if (cleanup) {
          this.tree.cleanups.set(task.id, { id: task.id, ref: task.ref, func: cleanup });
        }
      }
    }
  }

  submitThread() {
    const threadToSubmit = this.thread;

    this.startNewThread();

    threadToSubmit.submitted = true;

    // send delta ready
    this.bus.render(threadToSubmit.delta);

    // run effects
    this.runEffects(threadToSubmit.delta);

    // memory release
    for (const remove of threadToSubmit.delta.removed.values())
      this.pools.commit.release(remove);
  }

  work() {
    if (!this.thread.done) {
      // do some work
      this.thread.work();
      this.scheduler.requestCallback();
    }
    else {
      this.submitThread()
    }
  }

  mount(node: Node): CommitRef2 {
    const element = convertNodeToElement(node);
    const ref = CommitRef2.fresh(null);
    this.thread.queue({ type: 'mount', ref, element });

    this.scheduler.requestCallback();
    return ref;
  }
  unmount(ref: CommitRef2) {
    this.thread.queue({ type: 'unmount', ref });

    this.scheduler.requestCallback();
  }
  render(ref: CommitRef2): void {
    this.thread.queue({ type: 'target', ref });

    this.scheduler.requestCallback();
  }
}
