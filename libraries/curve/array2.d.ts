import type { CubicBezierAnimation } from "./bezier";

export type TransitionConfig<T> = {
  calculateKey: (value: T) => string,
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

export function useAnimatedList2<T>(
  values: ReadonlyArray<T>,
  config: TransitionConfig<T>,
): ValueState<T>[];
