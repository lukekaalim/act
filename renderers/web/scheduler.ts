import { Scheduler } from "@lukekaalim/act-recon";

export const createDOMScheduler = (): Scheduler => {
  let id: number | null | NodeJS.Timeout = null;
  let callbackFunc = () => console.error(`DOMScheduler got callback before callback function was configured`)
  let synccall_available = false;
  let synccall_requested = false;
  const time_budget = 60;

  const onTimeout = () => {
    const start = performance.now();
    id = null;

    synccall_available = true;
    // at least 1 call
    callbackFunc();

    // if callback func re-requested a call,
    // do the rest in sync
    while (synccall_requested) {
      synccall_requested = false;
      const now = performance.now();
      
      if (now - start >= time_budget) {
        synccall_available = false;
      }
      
      callbackFunc();
    }
    synccall_available = false;
  }

  return {
    setCallbackFunc(newCallbackFunc) {
      callbackFunc = newCallbackFunc;
    },
    isCallbackPending() {
      return id !== null;
    },
    requestCallback() {
      if (synccall_available) {
        synccall_requested = true;
      }
      else if (!id) {
        id = globalThis.setTimeout(onTimeout, 0);
      }
    },
    cancelCallback() {
      if (id !== null)
        globalThis.clearTimeout(id);
    },
  }
}
