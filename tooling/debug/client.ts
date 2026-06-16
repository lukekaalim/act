import { CommitID } from "@lukekaalim/act-recon";
import { CommitDetailsReport, createCommitDetailsReport, createDeltaReport, createThreadReport, createTreeReport, DeltaReport, EffectReport, SubmissionReport, ThreadReport, TreeReport } from "./report";
import { DebugCache } from "./cache";
import { DebugReconciler } from "./reconciler";
import { createEventEmitter, SubscribeFunction } from "./events";
import { Breakpoints, DEFAULT_BREAKPOINTS } from "./breakpoints";

/**
 * This debug client connects directly to the underlying
 * reconciler via a reference
 */
export class DirectDebugClient implements DebugClient {
  constructor(reconciler: DebugReconciler) {
    this.reconciler = reconciler;

    this.cache.loadTree(createTreeReport(this.reconciler.tree, [...this.reconciler.activeEffects.values()]));

    this.reconciler.onBreak(() => {
      const delta = createDeltaReport(this.reconciler.thread.delta);
      this.cache.loadDelta(delta);
      this.cache.loadThread(createThreadReport(this.reconciler.thread))

      this.#events.break.run();
    })
    this.reconciler.onSubmit((submission) => {
      this.cache.loadDelta(submission.delta);
      this.cache.clearThread();

      this.#events.submission.run(submission);
    })
    this.reconciler.onEffects(effects => {
      this.cache.loadEffects(effects);

      this.#events.effects.run(effects);
    })
    this.reconciler.onFinish(() => {
      this.cache.apply();

      this.#events.finish.run();
    })
  } 

  get breakpoints() {
    return this.reconciler.breakpoints;
  };
  reconciler: DebugReconciler;

  #events = {
    breakpointsChange: createEventEmitter<Breakpoints>(),
    break: createEventEmitter(),
    submission: createEventEmitter<SubmissionReport>(),
    effects: createEventEmitter<EffectReport[]>(),
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
    this.cache.loadDelta(delta);
    this.cache.loadThread(createThreadReport(this.reconciler.thread))

    // Only if the reconciler is still paused
    // (aka we didn't finish a thread)
    // we let clients know to update
    if (this.reconciler.paused)
      this.#events.break.run();
  }

  resume() {
    this.reconciler.resume()
  }

  getThread() {
    return createThreadReport(this.reconciler.thread);
  }
  getTree() {
    return createTreeReport(this.reconciler.tree, [...this.reconciler.activeEffects.values()]);
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
  onEffectsFinish: SubscribeFunction<EffectReport[]>,
  /**
   * This event triggers when a breakpoint is hit. This puts the reconciler
   * in a "paused" state, where no further work will be done.
   * 
   */
  onBreak: SubscribeFunction,

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

  cache: DebugCache,
  breakpoints: Readonly<Breakpoints>,
  setBreakpoints(nextBreakpoints: Breakpoints): void,
}