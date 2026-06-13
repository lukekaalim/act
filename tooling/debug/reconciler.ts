import { CommitID, CommitRef2, CommitTree2, Delta, EffectID, EffectTask, QueueResult, Reconciler2, Scheduler, WorkReason, WorkTask, WorkThread2 } from "@lukekaalim/act-recon";
import { CommitDetailsReport, createCommitDetailsReport, createDeltaReport, createEffectReport, createSubmissionReport, createThreadReport, createTreeReport, createWorkReasonReport, createWorkTaskReport, DeltaReport, EffectReport, SubmissionReport, ThreadReport, TreeReport, WorkReasonReport, WorkTaskReport } from "./report";
import { Node } from "@lukekaalim/act";
import { Breakpoints, DEFAULT_BREAKPOINTS } from "./breakpoints";
import { createEventEmitter } from "./events";

export class DebugReconciler extends Reconciler2 {
  started = false;
  liveEffects: Map<EffectID, EffectTask> = new Map()

  paused: boolean = false;

  breakpoints: Breakpoints = { ...DEFAULT_BREAKPOINTS };

  #events = {
    break: createEventEmitter(),
    submit: createEventEmitter<SubmissionReport>(),
    effects: createEventEmitter<EffectReport[]>(),
    finish: createEventEmitter()
  }

  onBreak = this.#events.break.subscribe;
  onSubmit = this.#events.submit.subscribe;
  onEffects = this.#events.effects.subscribe;
  onFinish = this.#events.finish.subscribe;

  step() {
    this.workInternal()
  }
  resume() {
    this.paused = false;
    this.workInternal()
  }

  finish() {
    this.paused = false;
    this.#events.finish.run();
  }

  shouldBreakOnThread() {
    if (!this.thread.started && this.thread.reasons.length > 0) {
      if (this.thread.passes === 1) {
        if (this.breakpoints.threadStart)
          return true;
      } else {
        if (this.breakpoints.threadPass)
          return true;
      }
    }
    if (this.thread.started && this.thread.done)
      if (this.breakpoints.threadSubmit)
        return true;

    const nextTask = this.thread.pendingTasks[this.thread.pendingTasks.length - 1] || null;

    if (nextTask && this.breakpoints.commits.has(nextTask.ref.id))
      return true;

    return false;
  }

  /**
   * Check if we should break 
   * @returns 
   */
  shouldBreakOnEffect() {
    const currentTask = this.currentEffectTask;
    if (!currentTask)
      return false

    if (this.breakpoints.effects.has(currentTask.id)) {
      return true;
    }

    if (this.breakpoints.effectsStart) {
      if (this.finishedEffects === 0)
        return true;
    }

    return false;
  }

  activeEffects: Map<EffectID, EffectTask> = new Map();

  runPendingEffects() {
    for (const effectTask of [...this.pendingCleanups]) {
      effectTask.func();
      this.tree.cleanups.delete(effectTask.id)
      this.pendingCleanups.shift()
      this.activeEffects.delete(effectTask.id);
      this.finishedEffects++;
      if (this.shouldBreakOnEffect()) {
        this.#events.break.run()
        this.paused = true;
        return;
      }
    }
    for (const effectTask of [...this.pendingEffects]) {
      const cleanup = effectTask.func();
      if (cleanup) {
        this.tree.cleanups.set(effectTask.id, cleanup)
        this.activeEffects.set(effectTask.id, effectTask)
      }
      this.pendingEffects.shift()
      this.finishedEffects++;
      if (this.shouldBreakOnEffect()) {
        this.#events.break.run()
        this.paused = true;
        return;
      }
    }

    this.#events.effects.run([...this.activeEffects.values()].map(task => createEffectReport(task, 'run')))
    this.finish()
  }

  get workState() {
    if (!this.thread.done)
      return 'thread';
    if (this.currentEffectTask)
      return 'effects';
    if (this.thread.done && this.thread.started && !this.thread.submitted)
      return 'submitting';

    return 'idle'
  }

  // KLUDGE: need a better name
  /**
   * Perform tasks without checking for
   * breakpoints (unlike `work()`)
   * @returns 
   */
  workInternal() {
    switch (this.workState) {
      case 'effects':
        this.runPendingEffects()
        return;
      case 'submitting':
        this.submitThread();
        return;
      case 'thread':
        this.thread.work();
        this.scheduler.requestCallback();
        return;
      case 'idle':
        this.paused = false;
        return;
    }
  }

  work(): void {
    if (this.paused)
      return;

    if (this.shouldBreakOnEffect() || this.shouldBreakOnThread()) {
      this.#events.break.run()
      this.paused = true;
      return;
    }
    if (this.paused)
      return;

    this.workInternal()
  }

  constructor(scheduler: Scheduler) {
    super(scheduler);
  }
  
  // Effects are now "pausable", so we need
  // to store effects that we didn't get around to
  // actioning yet
  pendingEffects: EffectTask[] = [];
  pendingCleanups: EffectTask[] = [];
  finishedEffects = 0;

  get currentEffectTask() {
    if (this.pendingCleanups.length !== 0)
      return this.pendingCleanups[0];
    if (this.pendingEffects.length !== 0)
      return this.pendingEffects[0];

    return null;
  }

  runEffects(delta: Delta): void {
    this.pendingCleanups = [...delta.cleanups.values()];
    this.pendingEffects = [...delta.effects.values()];
    this.finishedEffects = 0;

    if (this.currentEffectTask) {
      // (effects are now done in the scheduler)
      this.scheduler.requestCallback()
    } else {
      this.finish()
    }
  }

  submitThread(): void {
    this.started = false;

    this.#events.submit.run(createSubmissionReport(this.thread));

    super.submitThread();
  }
}

