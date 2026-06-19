import { CommitID } from "@lukekaalim/act-recon";
import { CommitDetailsReport, createCommitDetailsReport, createDeltaReport, createEffectWorkerReport, createSubmissionReport, createThreadReport, createTreeReport, DeltaReport, EffectReport, EffectWorkerReport, SubmissionReport, ThreadReport, TreeReport } from "./report";
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

    this.cache.loadTree(createTreeReport(this.reconciler.tree));

    this.reconciler.onBreak(() => {
      if (this.reconciler.effectWorker) {
        const workerReport = createEffectWorkerReport(this.reconciler.effectWorker);
        this.cache.loadEffectWorker(workerReport);

        this.#events.break.run([null, workerReport]);
      } else {
        const delta = createDeltaReport(this.reconciler.thread.delta);
        const thread = createThreadReport(this.reconciler.thread);
        this.cache.loadDelta(delta);
        this.cache.loadThread(thread);

        this.#events.break.run([{ delta, thread }, null]);
      }
    })
    this.reconciler.onSubmit((submission) => {
      this.cache.loadDelta(submission.delta);
      this.cache.apply();

      this.#events.submission.run(submission);
    })
    this.reconciler.onEffects(effects => {
      console.log(effects);
      this.cache.loadEffectWorker(effects);
      this.cache.applyEffects();
      console.log(this.cache.liveCleanups)
      this.#events.effects.run(effects);
    })
    this.reconciler.onFinish(() => {
      this.#events.finish.run();
    })
  } 

  get breakpoints() {
    return this.reconciler.breakpoints;
  };
  reconciler: DebugReconciler;

  #events = {
    breakpointsChange: createEventEmitter<Breakpoints>(),

    break: createEventEmitter<[submission: null | SubmissionReport, effects: null | EffectWorkerReport]>(),
    
    submission: createEventEmitter<SubmissionReport>(),
    effects: createEventEmitter<EffectWorkerReport>(),

    finish: createEventEmitter(),
  }

  setBreakpoints(nextSettings: Breakpoints) {
    this.reconciler.breakpoints = nextSettings;
    this.#events.breakpointsChange.run(nextSettings);
  }

  get onBreakpointsChange() {
    return this.#events.breakpointsChange.subscribe;
  };
  
  onThreadSubmit = this.#events.submission.subscribe;
  onBreak = this.#events.break.subscribe;
  onEffectsFinish = this.#events.effects.subscribe;
  onFinish = this.#events.finish.subscribe;

  step() {
    this.reconciler.step();

    const delta = createDeltaReport(this.reconciler.thread.delta);
    const initialThread = createThreadReport(this.reconciler.thread);
    this.cache.loadDelta(delta);
    this.cache.loadThread(initialThread)

    // Only if the reconciler is still paused
    // (aka we didn't finish a thread)
    // we let clients know to update
    if (this.reconciler.paused) {
      if (this.reconciler.effectWorker) {
        const workerReport = createEffectWorkerReport(this.reconciler.effectWorker);
        this.cache.loadEffectWorker(workerReport);

        this.#events.break.run([null, workerReport]);
      } else {
        const delta = createDeltaReport(this.reconciler.thread.delta);
        const thread = createThreadReport(this.reconciler.thread);
        this.cache.loadDelta(delta);
        this.cache.loadThread(thread);

        this.#events.break.run([{ delta, thread }, null]);
      }
    }
  }

  resume() {
    this.reconciler.resume()
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
  /**
   * This event triggers before a thread is submitted to
   * the renderer.
   */
  onThreadSubmit: SubscribeFunction<SubmissionReport>,
  /**
   * This event triggers after all cleanups & effects for a thread
   * have run
   */
  onEffectsFinish: SubscribeFunction<EffectWorkerReport>,
  /**
   * This event triggers when a breakpoint is hit. This puts the reconciler
   * in a "paused" state, where no further work will be done.
   * 
   */
  onBreak: SubscribeFunction<[submission: null | SubmissionReport, effects: null | EffectWorkerReport]>,

  onFinish: SubscribeFunction;

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