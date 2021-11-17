// @flow strict
import { useEffect, useRef } from "@lukekaalim/act";

export const usePreviousEffect = /*:: <T>*/(effect/*: T => ?(() => ?T)*/, deps/*: mixed[]*/, defaultValue/*: T*/) => {
  const previous = useRef(defaultValue)

  useEffect(() => {
    const cleanup = effect(previous.current || defaultValue);
    return () => {
      previous.current = cleanup ? cleanup() : null;
    }
  }, [...deps])
};