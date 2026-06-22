import { Reconciler2, Scheduler } from "@lukekaalim/act-recon";

import { DebugThread } from "./thread";

export class DebugReconciler extends Reconciler2 {
  thread: DebugThread;

  constructor(scheduler: Scheduler) {
    super(scheduler);
    this.thread = new DebugThread(this.tree);
    this.thread.bus = {
      render: (delta) => this.bus.render(delta)
    }
  }

  work(): void {
    this.thread.work();

    if (this.thread.done) 
      this.thread.reset();

    if (this.thread.hasWork && !this.thread.paused)
      this.scheduler.requestCallback();
  }
}

