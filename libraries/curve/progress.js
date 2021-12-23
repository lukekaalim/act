// @flow strict

import { useAnimation } from "./animation";
import { useEffect, useMemo } from "@lukekaalim/act";

export const calculateProgress = (start/*: number*/, duration/*: number*/, now/*: number*/)/*: number*/ => {
  if (duration === 0)
    return 1;

  const difference = now - start;
  const progress = difference / duration;
  const clampedProgress = Math.max(0, Math.min(1, progress))

  return clampedProgress;
}

/*::
export type ProgressAnimator = {
  update: (start: number, duration: number) => void,
  getProgress: (now: number) => number,
  getState: () => { start: number, duration: number };
};
*/

export const createProgressAnimator = ()/*: ProgressAnimator*/ => {
  let start = 0;
  let duration = 0;

  const getProgress = (now) => {
    return calculateProgress(start, duration, now);
  };
  const update = (nextStart, nextDuration) => {
    start = nextStart;
    duration = nextDuration;
  };
  const getState = () => {
    return { start, duration };
  }

  return {
    update,
    getProgress,
    getState,
  }
};

export const useProgress = (
  duration/*: number*/,
  onProgress/*: (progress: number) => mixed*/,
  deps/*:: ?: mixed[]*/ = []
)/*: ProgressAnimator*/ => {
  const animator = useMemo(() => createProgressAnimator(), []);
  useAnimation(now => {
    const progress = animator.getProgress(now);
    onProgress(progress);
    return progress === 1;
  }, [duration, ...deps]);
  useEffect(() => {
    animator.update(duration, performance.now());
  }, [duration, ...deps]);
  return animator;
};