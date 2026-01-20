import { CommitID, CommitRef2, CommitTree2, QueueResult, Reconciler2, Scheduler, WorkReason, WorkThread2 } from "@lukekaalim/act-recon";
import { createDebugScheduler, ScheduleController, ScheduleEventBus } from "./scheduler";
import { CommitDetailsReport, createCommitDetailsReport, createDeltaReport, createThreadReport, createTreeReport, createWorkReasonReport, createWorkTaskReport, DeltaReport, ThreadReport, TreeReport, WorkReasonReport, WorkTaskReport } from "./report";
import { Node } from "@lukekaalim/act";

export type ReconcilerDebugEventBus = {
  scheduler: ScheduleEventBus,
  thread: DebugWorkThreadEventBus,

  onThreadDone(thread: ThreadReport, delta: DeltaReport): void,
};
export type ReconcilerDebugController = {
  scheduler: ScheduleController,

  getTree(): TreeReport,
  getThread(): ThreadReport,
  getDelta(): DeltaReport,

  getDetails(commitId: CommitID): CommitDetailsReport | null
}

export class DebugReconciler extends Reconciler2 {
  controller: ReconcilerDebugController;
  debugBus: ReconcilerDebugEventBus;

  started = false;

  constructor() {
    const debugBus: ReconcilerDebugEventBus = {
      scheduler: {
        onAfterCallbackExecute() {},
        onInterceptStart() {},
        onInterceptEnd() {},
      },
      thread: {
        onQueue() {},
        onStartPass() {},
        onWork() {},
      },
      onThreadDone() {},
    };

    const scheduler = createDebugScheduler(debugBus.scheduler);
    super(scheduler);
    this.debugBus = debugBus;
    
    const me = this;

    this.controller = {
      scheduler: scheduler.controller,
      getTree() {
        return createTreeReport(me.tree)
      },
      getThread() {
        return createThreadReport(me.thread)
      },
      getDelta() {
        return createDeltaReport(me.thread.delta);
      },
      getDetails(commitId) {
        const commit = me.tree.commits.get(commitId);
        if (!commit)
          return null;

        return createCommitDetailsReport(commit, me.tree) || null;
      }
    };
    this.thread = new DebugWorkThread(this.tree, debugBus.thread); 
  }
  submitThread(): void {
    const submittedThread = this.thread;
    const { id, visited, passes } = submittedThread;

    this.started = false;
    const delta = createDeltaReport(submittedThread.delta);
    this.debugBus.onThreadDone(createThreadReport(submittedThread), delta)

    // Start a new thread
    this.thread = new DebugWorkThread(this.tree, this.debugBus.thread);

    this.running = false;

    // send delta ready
    this.bus.render(submittedThread.delta);

    // run effects
    for (const cleanup of submittedThread.delta.cleanups.values())
      cleanup.func();
    for (const effect of submittedThread.delta.effects.values())
      effect.func();

    for (const remove of submittedThread.delta.removed.values())
      this.pools.commit.release(remove);
    
    
    performance.mark(`reconciler:thread(${id}):end`);
    performance.measure(`reconciler:thread(${id}, visited=${visited.size})`,
      `reconciler:thread(${id}):start`,
      `reconciler:thread(${id}):end`,
    )
    console.info(`[Reconciler] Thread ${id} visited ${visited.size} nodes, in ${passes} passes`);
  }

  mount(node: Node): void {
    if (!this.started) {
      this.started = true;
      performance.mark(`reconciler:thread(${this.thread.id}):start`);
    }
    super.mount(node);
  }
  render(ref: CommitRef2): void {
    if (!this.started) {
      this.started = true;
      performance.mark(`reconciler:thread(${this.thread.id}):start`);
    }
    super.render(ref);
  }
}

export type DebugWorkThreadEventBus = {
  onWork(nextTask: null | WorkTaskReport): void,

  onStartPass(): void,
  onQueue(reason: WorkReasonReport, result: QueueResult): void,
}

export class DebugWorkThread extends WorkThread2 {
  debugBus: DebugWorkThreadEventBus;

  constructor(tree: CommitTree2, debugBus: DebugWorkThreadEventBus) {
    super(tree);
    this.debugBus = debugBus;
  }

  work(): void {
    const task = this.pendingTasks[this.pendingTasks.length - 1]
    super.work();
    this.debugBus.onWork(task && createWorkTaskReport(task) || null)
  }

  queue(reason: WorkReason): QueueResult {
    const result = super.queue(reason);

    this.debugBus.onQueue(createWorkReasonReport(reason), result);

    return result;
  }

  startNextPass(): void {

    super.startNextPass()
    this.debugBus.onStartPass();
  }
}
