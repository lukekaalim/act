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

  constructor(scheduler: Scheduler, { WorkThread = WorkThread2 }: { WorkThread?: typeof WorkThread2} = {}) {
    this.scheduler = scheduler;
    this.tree = new CommitTree2(this);
    this.thread = new WorkThread(this.tree);

    this.thread.bus = {
      render: (delta) => this.bus.render(delta)
    }

    this.scheduler.setCallbackFunc(() => this.work());
  }

  work() {
    this.thread.work();

    if (this.thread.done) 
      this.thread.reset();

    if (this.thread.hasWork)
      this.scheduler.requestCallback();
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
