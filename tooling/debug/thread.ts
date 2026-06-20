import { CommitTree2, WorkThread2 } from "@lukekaalim/act-recon";
import { EffectWorker } from "./effectWorker";
import { createEventEmitter } from "./events";
import { Breakpoints, BreakPosition, DEFAULT_BREAKPOINTS, evaluateBreakpoints } from "./breakpoints";

export class DebugThread extends WorkThread2 {
  effects: EffectWorker;

  paused = false;
  breakpoints: Breakpoints = DEFAULT_BREAKPOINTS;

  #events = {
    break: createEventEmitter(),
    finish: createEventEmitter()
  }

  on = {
    break: this.#events.break.subscribe,
    finish: this.#events.finish.subscribe,
  }

  constructor(tree: CommitTree2) {
    super(tree);
    this.effects = new EffectWorker(tree);
  }
  
  get done() {
    return super.done && this.effects.done;
  }

  get state() {
    if (this.pendingTasks.length > 0)
      return 'commit';
    else if (this.missed.size > 0)
      return 'commit-pass';
    else if (!this.effects.done)
      return 'effect';
    else if (!this.submitted)
      return 'submit';
    else
      return 'idle';
  }

  work() {
    if (this.paused)
      return;

    const breakPositions = evaluateBreakpoints(this.breakpoints, this);
    if (breakPositions.length > 0) {
      this.paused = true;
      this.#events.break.run();
      return;
    }

    this.forceWork();
  }

  forceWork() {
    if (!this.effects.done) {
      this.effects.work();
    } else {
      super.work();
    }
    if (this.done) {
      console.log('Finish')
      this.paused = false;
      this.#events.finish.run();
    }
  }

  submit(): void {
    this.submitted = true;

    this.bus.render(this.delta);
    this.effects.loadDelta(this.delta);
  }
}
