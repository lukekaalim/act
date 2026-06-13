/**
 * The Scheduler is an agnostic interface for a very simple
 * request/cancel interface for async work.
 * 
 * In practice, this will be backed by something
 * as simple as setTimeout, requestAnimationFrame
 * or even idleCallback - by the renderer, who
 * knows a bit more about the current runtime
 * environment (aka which callbacks are more
 * suited for the task.)
 * 
 * It should have a bit of internal state - only
 * a single callback can be queued at once.
 */
export type Scheduler = {
  /**
   * The scheduler will call a specific function when
   * requested. This method provides that function.
   * 
   * If not set before the a callback is requested, nothing will
   * happen (a noop is expected by default).
   * 
   * @param callback The function that the Scheduler will call when requested.
   */
  setCallbackFunc(callback: () => void): void,

  /**
   * Request that (using whatever mechanism the implementer wants)
   * the Callback Function be executed. It should not be called
   * _immediately_, but after some amount of time.
   */
  requestCallback(): void,
  cancelCallback(): void,

  isCallbackPending(): boolean,
};
