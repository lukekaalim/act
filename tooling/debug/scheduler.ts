import { Scheduler } from "@lukekaalim/act-recon";

// export type ScheduleEventBus = {
//   onInterceptEnd(): void,
//   onInterceptStart(): void,

//   onAfterCallbackExecute(): void,
// }

// export type ScheduleController = {
//   /**
//    * When paused, manually perform (one or more)
//    * units of "Work".
//    * @param stride
//    */
//   step(stride?: number): void,

//   cancelIntercept(): void,
//   /**
//    * Request that when work is about to be started,
//    * that the scheduler be "paused"
//    */
//   requestIntercept(): void,

//   paused: boolean,
//   intercept: boolean,
// }

// class DebugScheduler implements Scheduler {
//   setCallbackFunc(callback: () => void): void {
//     throw new Error("Method not implemented.");
//   }
//   requestCallback(): void {
//     throw new Error("Method not implemented.");
//   }
//   cancelCallback(): void {
//     throw new Error("Method not implemented.");
//   }
//   isCallbackPending(): boolean {
//     throw new Error("Method not implemented.");
//   }
// }

// export const createDebugScheduler = (
//   events: ScheduleEventBus, 
//   schedulerName: string = "Scheduler"
// ): Scheduler & { controller: ScheduleController } =>  {
//   let callbackFunc = () => {};
//   let pending_callback = false;

//   const pause = () => {
//     controller.paused = true;
//     events.onInterceptStart();
//   }
//   const resume = () => {
//     controller.intercept = false;
//     controller.paused = false;
//     events.onInterceptEnd();
//     run();
//   }

//   const run = (maxWork = 10000) => {
//     let workCount = 0;
//     const startMark = performance.mark(`${schedulerName}:work:start`);

//     while (pending_callback && workCount < maxWork) {
//       pending_callback = false;
//       callbackFunc();
//       events.onAfterCallbackExecute();
//       workCount++;

//       if (controller.intercept === true) {
//         pause();
//         return;
//       }
//     }
//     const endMark = performance.mark(`${schedulerName}:work:end`);
//     const measurement = performance.measure(`${schedulerName}:work(${workCount})`, startMark.name, endMark.name);
    
//     if (pending_callback) {
//       timeoutId = window.setTimeout(onTimeout, 0);
//     } else
//       timeoutId = null;
//   }

//   const controller: ScheduleController = {
//     intercept: false,
//     paused: false,
//     requestIntercept() {
//       controller.intercept = true;
//     },
//     cancelIntercept() {
//       resume();
//     },
//     step(stride = 1) {
//       run(stride);
//       if (!pending_callback) {
//         events.onInterceptEnd();
//         timeoutId = null;
//       }
//     },
//   }
//   const onTimeout = () => {
//     run();
//   }

//   let timeoutId: number | null = null;

//   return {
//     controller,
//     setCallbackFunc(callback) {
//       callbackFunc = callback;
//     },
//     requestCallback() {
//       pending_callback = true;
//       if (controller.intercept) {
//         pause();
//         return;
//       }

//       if (!timeoutId)
//         timeoutId = window.setTimeout(onTimeout, 0);
//     },
//     cancelCallback() {
//       pending_callback = false;
//       if (timeoutId) {
//         window.clearTimeout(timeoutId)
//         timeoutId = null;
//       }
//     },
//     isCallbackPending() {
//       return pending_callback;
//     },
//   }
// };