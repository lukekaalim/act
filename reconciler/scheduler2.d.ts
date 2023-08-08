export type SchedulePriority2 =
  | 'low'
  | 'normal'
  | 'high'

export type TaskID = string;
export type ScheduledTask<T> = {
  id: TaskID,
  work: Generator<mixed, T, void>,
  resolve: (result: T) => mixed,
}

export type Scheduler2 = {
  requestWork: <T>(work: Generator<mixed, T, void>) => { promise: Promise<T>, id: TaskID },

  run: (deadline: number) => void,
};

declare export function createSchedule2(
  requestCallback: (callback: (deadline: number) => void) => () => void
): Scheduler2;