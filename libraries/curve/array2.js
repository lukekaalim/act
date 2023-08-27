// @flow strict
import { useEffect, useState, createId, useMemo, useRef } from "@lukekaalim/act";
import {
  createInitialCubicBezierAnimation,
  interpolateCubicBezierAnimation,
  calculateCubicBezierAnimationPoint,
} from "./bezier";
import { getCubicPoint } from "./bezier";

/*::
import type { CubicBezierAnimation } from "./bezier";


export type TransitionConfig<T> = {
  calculateKey: T => string,
};
export type ValueState<T> = {
  entering: CubicBezierAnimation,
  exiting: CubicBezierAnimation,

  state: CubicBezierAnimation,
  value: T,
  key: string,
};

export type TransitionState<T> = {
  persisting: Map<string, ValueState<T>>,
  exiting: ValueState<T>[],
};
*/

const startAnimation = (duration, now, start, end, impulse) => {
  return interpolateCubicBezierAnimation(
    createInitialCubicBezierAnimation(start),
    end,
    duration,
    impulse,
    now,
  )
}

const animateEntry = /*:: <T>*/(
  value/*: T*/,
  key/*: string*/,
  now/*: number*/,
  duration/*: number*/,
)/*: ValueState<T>*/ => ({
  key,
  value,
  state: startAnimation(duration, now, -1, 0, 3),
  entering: startAnimation(duration, now, 0, 1, 3),
  exiting: createInitialCubicBezierAnimation(0),
})
const animateExit = /*:: <T>*/(
  state/*: ValueState<T>*/,
  now/*: number*/,
  duration/*: number*/,
)/*: ValueState<T>*/ => ({
  ...state,
  key: state.key + createId(),
  state: interpolateCubicBezierAnimation(
    state.exiting,
    1,
    duration,
    3,
    now
  ), 
  entering: interpolateCubicBezierAnimation(
    state.entering,
    calculateCubicBezierAnimationPoint(state.entering, now).position,
    0,
    0,
    now,
  ),
  exiting: interpolateCubicBezierAnimation(
    state.exiting,
    1,
    duration,
    3,
    now
  ), 
})

const updateTransitionState = /*:: <T>*/(
  config/*: TransitionConfig<T>*/,
  state/*: TransitionState<T>*/,
  nextValues/*: $ReadOnlyArray<T>*/
)/*: TransitionState<T>*/ => {
  const now = performance.now();
  const nextValueMap = new Map(nextValues.map(value => [
    config.calculateKey(value),
    value
  ]));

  state.exiting = state.exiting.filter((valueState) => {
    const { progress } = calculateCubicBezierAnimationPoint(valueState.exiting, now);
    return progress < 1;
  });
  for (const [key, valueState] of state.persisting) {
    if (!nextValueMap.has(key)) {
      state.exiting.push(animateExit(valueState, now, 1000));
      state.persisting.delete(key);
    }
  }
  for (const [key, value] of nextValueMap) {
    const persistingValue = state.persisting.get(key);
    if (persistingValue) {
      persistingValue.value = value;
    } else {
      state.persisting.set(
        key,
        animateEntry(value, key, now, 1000),
      );
    }
  }
  return state;
}

export const useAnimatedList2 = /*:: <T>*/(
  values/*: T[]*/,
  config/*: TransitionConfig<T>*/,
)/*: ValueState<T>[]*/ => {
  const state = useRef/*:: <TransitionState<T>>*/({
    persisting: new Map(),
    exiting: [],
  }).current;

  useMemo(() => {
    updateTransitionState(config, state, values);
  }, [values, config]);
  
  return useMemo(() => [
    ...state.persisting.values(),
    ...state.exiting,
  ], [state.persisting, state.exiting])
};
