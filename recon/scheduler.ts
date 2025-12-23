/**
 * The Scheduler is an agnostic interface for a very simple
 * request/cancel interface for async work.
 * 
 * In practice, this will be backed by something
 * as simple as setTimeout, requestAnimationFrame
 * or even idleCallback.
 * 
 * It should have a bit of internal state - only
 * a single callback can be queued at once.
 */
export type Scheduler = {
  setCallbackFunc(callback: () => void): void,

  requestCallback(): void,
  cancelCallback(): void,

  isCallbackPending(): boolean,
};
