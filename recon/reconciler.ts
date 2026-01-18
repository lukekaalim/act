import { convertNodeToElements, h, Node, primitiveNodeTypes } from "@lukekaalim/act";
import { Commit2, CommitRef2 } from "./commit";
import { WorkThread2 } from "./thread"
import { CommitTree2 } from "./tree";
import { Scheduler } from "./scheduler";
import { Delta } from "./delta";
import { WorkTask } from "./update";

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

  work() {
    if (!this.thread.done) {
      // do some work
      this.thread.work();
      this.scheduler.requestCallback();
    } else {
      const currentThread = this.thread;
      // Start a new thread
      this.thread = new WorkThread2(this.tree);

      this.running = false;

      // send delta ready
      this.bus.render(currentThread.delta);

      // run effects
      for (const cleanup of currentThread.delta.cleanups.values())
        cleanup.func();
      for (const effect of currentThread.delta.effects.values())
        effect.func();

      for (const remove of currentThread.delta.removed.values())
        this.pools.commit.release(remove);

      performance.mark(`reconciler:thread(${currentThread.id}):end`);
      performance.measure(`reconciler:thread(${currentThread.id}, visited=${currentThread.visited.size})`,
        `reconciler:thread(${currentThread.id}):start`,
        `reconciler:thread(${currentThread.id}):end`,
      )

      console.info(`[Reconciler] Thread ${currentThread.id} visited ${currentThread.visited.size} nodes, in ${currentThread.passes} passes`);
    }
  }
  running = false;

  mount(node: Node): void {
    if (!this.running) {
      this.running = true;
      performance.mark(`reconciler:thread(${this.thread.id}):start`);
    }
    for (const element of convertNodeToElements(node)) {
      const ref = CommitRef2.fresh(null);
      this.thread.queue({ type: 'mount', ref, element });
    }

    this.scheduler.requestCallback();
  }
  render(ref: CommitRef2): void {
    if (!this.running) {
      this.running = true;
      performance.mark(`reconciler:thread(${this.thread.id}):start`);
    }

    this.thread.queue({ type: 'target', ref });

    this.scheduler.requestCallback();
  }
}
