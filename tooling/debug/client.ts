import { CommitID } from "@lukekaalim/act-recon";
import {
  CommitDetailsReport, createCommitDetailsReport, createDeltaReport,
  createEffectWorkerReport, createThreadReport, createTreeReport, DeltaReport,
  ThreadReport, TreeReport
} from "./report";
import { DebugCache } from "./cache";
import { DebugReconciler } from "./reconciler";
import { createEventEmitter, SubscribeFunction } from "./events";
import { Breakpoints } from "./breakpoints";

/**
 * This debug client connects directly to the underlying
 * reconciler via a reference
 */
export class DirectDebugClient implements DebugClient {
  constructor(reconciler: DebugReconciler) {
    this.reconciler = reconciler;

    this.cache.init(createTreeReport(this.reconciler.tree));

    this.reconciler.thread.on.break(() => {
      const thread = this.getThread()
      this.cache.load(thread);
      this.#events.break.run(thread);
    });
    this.reconciler.thread.on.finish(() => {
      const thread = this.getThread()
      this.cache.load(thread)
      this.cache.apply();
      this.#events.finish.run(thread);
    });
  } 

  get breakpoints() {
    return this.reconciler.thread.breakpoints;
  };
  reconciler: DebugReconciler;

  #events = {
    breakpointsChange: createEventEmitter<Breakpoints>(),

    break: createEventEmitter<ThreadReport>(),
    finish: createEventEmitter<ThreadReport>(),
  }

  setBreakpoints(nextSettings: Breakpoints) {
    if (nextSettings === this.reconciler.thread.breakpoints)
      return;

    this.reconciler.thread.breakpoints = nextSettings;
    this.#events.breakpointsChange.run(nextSettings);
  }

  get onBreakpointsChange() {
    return this.#events.breakpointsChange.subscribe;
  };
  
  onBreak = this.#events.break.subscribe;
  onFinish = this.#events.finish.subscribe;

  step() {
    this.reconciler.thread.forceWork();
    if (this.reconciler.thread.done) {
      this.reconciler.thread.reset();
    }
    if (this.reconciler.thread.paused) {
      // re-run "break" on step
      const thread = this.getThread()
      this.cache.load(thread);
      this.#events.break.run(thread);
    }
  }

  resume() {
    this.reconciler.thread.paused = false;
    this.reconciler.thread.forceWork();
    this.reconciler.scheduler.requestCallback();
  }

  getThread() {
    return createThreadReport(this.reconciler.thread);
  }
  getTree() {
    return createTreeReport(this.reconciler.tree);
  }
  getDelta() {
    return createDeltaReport(this.reconciler.thread.delta);
  }
  getDetails(commitId: CommitID): null | CommitDetailsReport {
    const commit = this.reconciler.tree.commits.get(commitId);
    if (!commit)
      return null;

    return createCommitDetailsReport(commit, this.reconciler.tree);
  }

  requestFlash(commit: CommitID) {
    console.warn("I don't really know what this should do so far...")
  }
  requestRender(commitId: CommitID) {
    const commit = this.reconciler.tree.commits.get(commitId);
    if (commit)
      this.reconciler.render(commit.ref);
  }

  cache: DebugCache = new DebugCache();
}

export type DebugClient = {
  /**
   * This event trigger after "setBreakpoints()" is called,
   * to notify any UI to update
   */
  onBreakpointsChange: SubscribeFunction<Breakpoints>,
  
  onBreak: SubscribeFunction<ThreadReport>;
  onFinish: SubscribeFunction<ThreadReport>;

  /**
   * Calling `step()` will cause the reconciler to perform one "task" (process one commit,
   * one effect, or perform thread submission) when it is paused. This does not unpause the reconciler.
   */
  step(): void,
  resume(): void,

  getThread(): ThreadReport,
  getTree(): TreeReport,
  getDelta(): DeltaReport,
  getDetails(commit: CommitID): null | CommitDetailsReport,

  requestFlash(commit: CommitID): void,
  requestRender(commit: CommitID): void,

  cache: DebugCache,
  breakpoints: Readonly<Breakpoints>,
  setBreakpoints(nextBreakpoints: Breakpoints): void,
}