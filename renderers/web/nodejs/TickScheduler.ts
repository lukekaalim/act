import { Scheduler } from '@lukekaalim/act-recon';
import { nextTick } from 'node:process';

export const createTickScheduler = (): Scheduler => {
  let needs_callback = false;
  let callback_pending = false;
  let callback = () => {};

  const run = () => {
    while (needs_callback) {
      needs_callback = false;
      callback();
    }
    callback_pending = false
  }

  return {
    setCallbackFunc(nextCallback) {
      callback = nextCallback;
    },
    requestCallback() {
      needs_callback = true;
      if (!callback_pending) {
        callback_pending = true;
        nextTick(run)
      }
    },
    cancelCallback() {
      needs_callback = false;
    },
    isCallbackPending() {
      return needs_callback;
    },
  }
}