import { Scheduler } from "@lukekaalim/act-recon";

export type ScheduleEventBus = {
  onInterceptEnd(): void,
  onInterceptStart(): void,

  onAfterCallbackExecute(): void,
}

export type ScheduleController = {
  step(stride?: number): void,
  cancelIntercept(): void,

  intercept: boolean,
}

export const createDebugScheduler = (events: ScheduleEventBus, schedulerName: string = "Scheduler"): Scheduler & { controller: ScheduleController } =>  {
  let callbackFunc = () => {};
  let pending_callback = false;

  const run = (maxWork = 10000) => {
    let workCount = 0;
    const startMark = performance.mark(`${schedulerName}:work:start`);

    while (pending_callback && workCount < maxWork) {
      pending_callback = false;
      callbackFunc();
      events.onAfterCallbackExecute();
      workCount++;
    }
    const endMark = performance.mark(`${schedulerName}:work:end`);
    const measurement = performance.measure(`${schedulerName}:work(${workCount})`, startMark.name, endMark.name);
    
    if (pending_callback) {
      timeoutId = window.setTimeout(onTimeout, 0);
    } else
      timeoutId = null;
  }

  const controller: ScheduleController = {
    intercept: false,
    cancelIntercept() {
      controller.intercept = false;
      run();
    },
    step(stride = 1) {
      run(stride);
      if (!pending_callback) {
        events.onInterceptEnd();
        timeoutId = null;
      }
    },
  }
  const onTimeout = () => {
    if (controller.intercept) {
      events.onInterceptStart();
    } else {
      run();
    }
  }

  let timeoutId: number | null = null;

  return {
    controller,
    setCallbackFunc(callback) {
      callbackFunc = callback;
    },
    requestCallback() {
      pending_callback = true;

      if (!timeoutId)
        timeoutId = window.setTimeout(onTimeout, 0);
    },
    cancelCallback() {
      pending_callback = false;
      if (timeoutId) {
        window.clearTimeout(timeoutId)
        timeoutId = null;
      }
    },
    isCallbackPending() {
      return pending_callback;
    },
  }
};