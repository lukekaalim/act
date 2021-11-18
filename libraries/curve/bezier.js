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

export const useBezier = (to/*: number*/, onUpdate/*: number => mixed*/) => {
  const interpolate = (from, to, progress) => {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const value = calculateCubicBezierValue([from[0], from[1], to[1], to[0]], clampedProgress);
    return value;
  };
  const getSlope = (from, to, progress) => {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const a = calculateQuadraticBezierValue([from[0], from[1], to[1]], clampedProgress);
    const b = calculateQuadraticBezierValue([from[1], to[1], to[0]], clampedProgress);
    const direction = [b[0] - a[0], b[1] - a[1]];
    const slope = (direction[1] / direction[0]) || 0;
    return slope;
  }

  useInterpolation(
    to,
    (current, previous, progress) => {
      const value = interpolate(current.from, current.to, progress);
      onUpdate(value[1]);
      return value[1];
    },
    (previous) => {
      const progress = calculateProgress(previous.start, previous.duration, performance.now());
      const value = interpolate(previous.from, previous.to, progress);
      const slope = getSlope(previous.from, previous.to, progress);
      
      return {
        ...previous,
        from: [[0, value[1]], [0, value[1] + slope]],
        to: [[1, to], [1, to]],
        start: performance.now()
      };
    },
    { duration: 1000, from: [[0, to], [0, to]], to: [[1, to], [1, to]], start: performance.now() },
    [to]
  )
};