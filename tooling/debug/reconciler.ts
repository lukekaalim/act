import {  CommitTree2, Delta, EffectCleanupState, EffectID, EffectTask, EffectTask2, Reconciler2, Scheduler } from "@lukekaalim/act-recon";
import { createEffectWorkerReport, createSubmissionReport, EffectReport, EffectWorkerReport, SubmissionReport } from "./report";
import { EffectConstructor, Node } from "@lukekaalim/act";
import { Breakpoints, DEFAULT_BREAKPOINTS } from "./breakpoints";
import { createEventEmitter } from "./events";

export class DebugReconciler extends Reconciler2 {
  liveEffects: Map<EffectID, EffectTask> = new Map()

  paused: boolean = false;

  breakpoints: Breakpoints = { ...DEFAULT_BREAKPOINTS };

  #events = {
    break: createEventEmitter(),
    submit: createEventEmitter<SubmissionReport>(),
    effects: createEventEmitter<EffectWorkerReport>(),
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
    if (!this.effectWorker)
      return false;

    const currentEffectId = this.effectWorker.nextId;
    if (!currentEffectId)
      return false

    if (this.breakpoints.effects.has(currentEffectId)) {
      return true;
    }

    if (this.breakpoints.effectsStart) {
      if (this.effectWorker.finished === 0)
        return true;
    }

    return false;
  }

  get workState() {
    if (!this.thread.done)
      return 'thread';
    if (this.effectWorker)
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
        if (!this.effectWorker)
          return;
        this.effectWorker.work()
        if (this.effectWorker.done) {
          const report = createEffectWorkerReport(this.effectWorker);
          this.effectWorker = null;

          this.#events.effects.run(report);
          this.finish();
        } else {
          this.scheduler.requestCallback();
        }
        return;
      case 'submitting':
        const report = createSubmissionReport(this.thread)
        this.submitThread();

        this.#events.submit.run(report);
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
  effectWorker: EffectWorker | null = null;


  runEffects(delta: Delta): void {
    this.effectWorker = new EffectWorker(delta, this.tree);
    this.scheduler.requestCallback();
  }
}

/**
 * A Debug-exclusive class that will iteratively run an
 * effect each call to "work()", for ease of breakpoints.
 */
export class EffectWorker {
  effects: [EffectID, EffectTask2, EffectConstructor][] = [];
  cleanups: [EffectID, EffectCleanupState][] = [];

  tree: CommitTree2;

  completedEffects = new Set<EffectID>();
  completedCleanups = new Set<EffectID>();
  newCleanups = new Map<EffectID, EffectCleanupState>();

  get nextCleanup() {
    return this.cleanups[this.cleanups.length - 1];
  }
  get nextEffect() {
    return this.effects[this.effects.length - 1];
  }
  get nextId() {
    if (this.nextCleanup)
      return this.nextCleanup[0]
    if (this.nextEffect)
      return this.nextEffect[0]
    return null;
  }
  get done() {
    return !this.nextCleanup && !this.nextEffect;
  }
  get finished() {
    return this.completedEffects.size + this.completedCleanups.size;
  }

  constructor (delta: Delta, tree: CommitTree2) {
    for (const task of delta.effects.values()) {
      const cleanup = tree.cleanups.get(task.id);

      if (cleanup) {
        this.cleanups.push([task.id, cleanup]);
      }

      if (task.effect) {
        this.effects.push([task.id, task, task.effect]);
      }
    }
    
    this.tree = tree;
  }

  work() {
    if (this.nextCleanup) {
      const [id, cleanup] = this.nextCleanup;
      this.cleanups.pop();

      cleanup.func()
      this.tree.cleanups.delete(id);
      this.completedCleanups.add(id);
      
      return;
    }
    if (this.nextEffect) {
      const [id, task, effect] = this.nextEffect;
      this.effects.pop();

      const cleanupFunc = effect();
      this.completedEffects.add(id);
      console.log(id, task, effect, cleanupFunc);
      if (cleanupFunc) {
        const cleanup = {
          id,
          ref: task.ref,
          func: cleanupFunc
        }
        this.tree.cleanups.set(id, cleanup);
        this.newCleanups.set(id, cleanup);
      }
      return;
    }
  }
}