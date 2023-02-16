// @flow strict

import { createId } from "@lukekaalim/act";

/*::
export type SchedulePriority2 =
  | 'low'
  | 'normal'
  | 'high'

export type TaskID = string;
export type ScheduledTask<T> = {
  id: TaskID,
  work: Generator<mixed, T, void>,
  resolve: T => mixed,
}

export type Scheduler2 = {
  requestWork: <T>(work: Generator<mixed, T, void>) => { promise: Promise<T>, id: TaskID },

  run: (deadline: number) => void,
};
*/

export const createSchedule2 = (
  requestCallback/*: (callback: (deadline: number) => void) => () => void*/
)/*: Scheduler2*/ => {
  let tasks/*: ScheduledTask<mixed>[]*/ = [];
  let clearCallback = null;

  const enqueueCallback = () => {
    if (clearCallback)
      return;

    clearCallback = requestCallback((deadline) => {
      clearCallback = null;
      run(deadline);
    })
  }

  const requestWork = /*:: <T>*/(work/*: Generator<mixed, T, void>*/)/*: { promise: Promise<T>, id: TaskID }*/ => {
    const id = createId();
    const promise/*: Promise<T>*/ = new Promise(resolve => {
      tasks.push({
        id: createId(),
        work,
        // $FlowFixMe
        resolve: result => resolve(result),
      });
      enqueueCallback();
    });
    return { id, promise };
  };

  const run = (deadline) => {
    console.info('Tick');
    const start = performance.now();
    const ignoreDeadline = deadline === -1;

    while (tasks.length > 0) {
      performance.mark('act:scheduler:startrun')
      const task = tasks.pop();

      let result = null;
      while (!result || !result.done) {
        if (!ignoreDeadline && performance.now() - start > deadline) {
          enqueueCallback();
          tasks.push(task);
          performance.mark('act:scheduler:interruptrun')
          performance.measure('act:scheduler:run', 'act:scheduler:startrun', 'act:scheduler:interruptrun')
          return;
        }
        result = task.work.next();
        if (result.done) {
          task.resolve(result.value);
        }
      }
    }
    performance.mark('act:scheduler:finishrun')
    performance.measure('act:scheduler:run', 'act:scheduler:startrun', 'act:scheduler:finishrun')
  };
  return { requestWork, run };
};