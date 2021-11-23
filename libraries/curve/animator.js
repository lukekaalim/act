// @flow strict

import { useEffect, useMemo } from "@lukekaalim/act"
import { createBezierAnimator } from "./bezier";

const useAnimatedValues = (values) => {
  const animatorMap = useMemo(() => new Map(), []);

  useEffect(() => {
    const entries = Object.fromEntries(values);
    for (const [key, nextValue] of entries) {
      const animator = animatorMap.get(key) || createBezierAnimator(1000, nextValue)
    }
  }, [values])
}