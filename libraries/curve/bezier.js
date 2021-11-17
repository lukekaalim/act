// @flow strict

import { useInterpolation } from "./linear";
import { usePreviousEffect } from "./previous";
import { calculateProgress, createProgressTimer } from "./progress";

/*::
export type Vector2 = [number, number];
*/

const calculateInterpolation = (v1/*: number*/, v2/*: number*/, t/*: number*/)/*: number*/ => {
  const distance = v2 - v1;
  return v1 + (t*distance);
}

const calculateVector2Interpolation = (v1/*: Vector2*/, v2/*: Vector2*/, t/*: number*/)/*: Vector2*/ => {
  return [
    calculateInterpolation(v1[0], v2[0], t),
    calculateInterpolation(v1[1], v2[1], t),
  ];
};

const calculateQuadraticBezierValue = (v/*: [Vector2, Vector2, Vector2]*/, t/*: number*/) => {
  const a = calculateVector2Interpolation(v[0], v[1], t);
  const b = calculateVector2Interpolation(v[1], v[2], t);
  return calculateVector2Interpolation(a, b, t);
}

const calculateCubicBezierValue = (v/*: [Vector2, Vector2, Vector2, Vector2]*/, t/*: number*/) => {
  const a = calculateQuadraticBezierValue([v[0], v[1], v[2]], t);
  const b = calculateQuadraticBezierValue([v[1], v[2], v[3]], t);
  return calculateVector2Interpolation(a, b, t);
};

const useBezier = (to/*: number*/, onUpdate/*: number => mixed*/) => {
  const interpolate = (previous, current, progress) => {
  };

  useInterpolation(
    to,
    (current, previous, progress) => {
      calculateCubicBezierValue([])
    },
    (previous) => {
      const start = performance.now();
      const progress = calculateProgress(previous.start, previous.duration, start);
      const from = interpolate(previous.to, previous.from, progress);
      const duration = calculateDuration(to, from);
      throw '';
    },
    { duration: 0, from: to, to, start: 0 }
  )
};