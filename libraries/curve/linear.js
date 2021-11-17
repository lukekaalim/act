// @flow strict

import { useEffect, useRef } from "@lukekaalim/act";
import { easeInOutCubic } from "./easers.js";

import { calculateProgress, createProgressTimer } from "./progress.js";

export const usePreviousEffect = /*:: <T>*/(effect/*: T => ?(() => ?T)*/, deps/*: mixed[]*/, defaultValue/*: T*/) => {
  const previous = useRef(defaultValue)

  useEffect(() => {
    const cleanup = effect(previous.current || defaultValue);
    return () => {
      previous.current = cleanup ? cleanup() : null;
    }
  }, [...deps])
};

export const useConstantInterpolation = /*:: <T>*/(
  value/*: T*/,
  interpolate/*: (to: T, from: T, progress: number) => T*/,
  duration/*: number*/ = 1000,
  onUpdate/*: T => mixed*/,
  deps/*: mixed[]*/
) => {
  useLinearInterpolation(value, interpolate, () => duration, onUpdate, deps);
};
export const useCubicEaseInterpolation = /*:: <T>*/(
  value/*: T*/,
  interpolate/*: (to: T, from: T, progress: number) => T*/,
  duration/*: number*/ = 1000,
  onUpdate/*: T => mixed*/,
  deps/*: mixed[]*/
) => {
  useConstantInterpolation(value, (to, from, progress) => {
    const cubicProcess = easeInOutCubic(progress);
    return interpolate(to, from, cubicProcess);
  }, duration, onUpdate, deps);
};

/*::
export type InterpolationState<T> = {
  start: DOMHighResTimeStamp,
  to: T,
  from: T,
  duration: number,
};
*/

export const useLinearInterpolation = /*:: <T>*/(
  to/*: T*/,
  interpolate/*: (to: T, from: T, progress: number) => T*/,
  calculateDuration/*: (to: T, from: T) => number*/,
  onUpdate/*: T => mixed*/,
  deps/*: mixed[]*/
) => {
  useInterpolation(to, (current, previous, progress) => {
    const value = interpolate(current.to, current.from, progress);
    onUpdate(value);
    return value;
  }, (previous) => {
    const start = performance.now();
    const progress = calculateProgress(previous.start, previous.duration, start);
    const from = interpolate(previous.to, previous.from, progress);
    const duration = calculateDuration(to, from);
    return { duration, to, from, start };
  }, { duration: 0, to, from: to, start: performance.now() }, [...deps]);
}

export const useInterpolation = /*:: <T, S: { duration: number }>*/(
  to/*: T*/,
  interpolate/*: (current: S, previous: S, progress: number) => T*/,
  calculateState/*: (previous: S) => S*/,
  initialState/*: S*/,
  deps/*: mixed[]*/
) => {
  usePreviousEffect((previous) => {
    const state = calculateState(previous);
    const cancel = createProgressTimer(state.duration, (progress) => interpolate(state, previous, progress));

    return () => {
      cancel();
      return state;
    }
  }, [...deps], initialState)
}