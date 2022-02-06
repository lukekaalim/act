// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { TimeSpan } from "./schedule"; */

import { lerp } from "./math.js";
import { useAnimation } from "./animation.js";
import { calculateSpanProgress } from "./schedule.js";
import { useMemo, useRef } from "@lukekaalim/act";

/*::
export type CubicBezier = [number, number, number, number];

export type CubicBezierAnimation = {
  type: 'cubic-bezier',
  span: TimeSpan,
  shape: CubicBezier,
};

export type CubicBezierPoint = {
  progress: number,

  position: number,
  velocity: number,
  acceleration: number,
};
*/

export const calculateCubicBezierAnimationPoint = (
  anim/*: CubicBezierAnimation*/,
  now/*: DOMHighResTimeStamp*/
)/*: CubicBezierPoint*/ => {
  const progress = calculateSpanProgress(anim.span, now);
  const position = getBerenstienCubicPoint(anim.shape, progress);
  const velocity = getBezierVelocity(anim.shape, now);
  const acceleration = getBezierAcceleration(anim.shape, now);
  return { progress, position, velocity, acceleration };
};

export const getCubicPoint = (
  a/*: number*/,
  b/*: number*/,
  c/*: number*/,
  d/*: number*/,
  t/*: number*/
)/*: number*/ => {
  const ab = lerp(a, b, t);
  const bc = lerp(b, c, t);
  const cd = lerp(c, d, t);

  const abc = lerp(ab, bc, t);
  const bcd = lerp(bc, cd, t);

  const abcd = lerp(abc, bcd, t);

  return abcd;
};

// same thing but more mathy
export const getBerenstienCubicPoint = (
  [a, b, c, d]/*: CubicBezier*/,
  t/*: number*/
)/*: number*/ => {
  return (
    a * (((-t) ** 3) + (3 * (t ** 2)) - (3 * t) + 1) +
    b * (3 * (t ** 3) - (6 * (t ** 2)) + (3 * t)) +
    c * (-3 * (t ** 3) + (3 * (t ** 2))) +
    d * (t ** 3)
  );
}

export const createInitialCubicBezierAnimation = (
  target/*: number*/,
)/*: CubicBezierAnimation*/ => ({
  type: 'cubic-bezier',
  shape: [target, target, target, target],
  span: { start: 0, durationMs: 0 }
});

export const interpolateCubicBezierAnimation = (
  bezier/*: CubicBezierAnimation*/,
  target/*: number*/,
  durationMs/*: number*/,
  impulse/*: number*/,
  start/*: number*/
)/*: CubicBezierAnimation*/ => {

  const progress = calculateSpanProgress(bezier.span, start);

  const currentPosition = getBerenstienCubicPoint(bezier.shape, progress);
  const currentVelocityMs = (getBezierVelocity(bezier.shape, progress) / bezier.span.durationMs) || 0;

  const distance = target - currentPosition;
  const direction = distance !== 0 ? Math.abs(distance) / distance : 0;

  const nextVelocity = (currentVelocityMs * durationMs) + (impulse * direction);

  const shape = calculateBezierFromVelocity(currentPosition, nextVelocity, 0, target);
  const span = { start, durationMs };
  return { type: 'cubic-bezier', span, shape }
}

export const calculateBezierFromVelocity = (
  startPosition/*: number*/,
  startVelocity/*: number*/,
  endVelocity/*: number*/,
  endPosition/*: number*/
)/*: CubicBezier*/ => {
  return [
    startPosition,
    calculateP2ForStartVelocity(startPosition, startVelocity),
    calculateP2ForStartVelocity(endPosition, endVelocity),
    endPosition
  ]
};
export const calculateP2ForStartVelocity = (
  startPosition/*: number*/,
  velocity/*: number*/
)/*: number*/ => {
  return (startPosition * 3 + velocity) / 3
};
export const calculateP3ForEndVelocity = (
  endPosition/*: number*/,
  velocity/*: number*/
)/*: number*/ => {
  return (endPosition * 3 - velocity) / 3;
};

export const useBezierAnimation = (
  bezier/*: CubicBezierAnimation*/,
  animate/*: (CubicBezierPoint) => mixed*/,
) => {
  useAnimation((now) => {
    const point = calculateCubicBezierAnimationPoint(bezier, now);
    animate(point);
    return point.progress === 1;
  }, [bezier, animate]);
}

export const getBezierVelocity = ([a, b, c, d]/*: CubicBezier*/, t/*: number*/)/*: number*/ => {
  return (
    3 * (-a * (-1 + t) ** 2 + t * (2 * c - 3 * c * t + d * t) + b * (1 - 4 * t + 3 * t ** 2))
  );
}

export const getBezierAcceleration = ([a, b, c, d]/*: CubicBezier*/, t/*: number*/)/*: number*/ => {
  return (
    a * (-6 * t + 6) +
    b * (18 * t - 12) +
    c * (-18 * t + 6) +
    d * (6 * t)
  );
}

export const useAnimatedNumber = (
  value/*: number*/,
  initial/*: null | number*/ = null,
  options/*: { impulse: number, duration: number }*/ = { duration: 500, impulse: 10 }
)/*: [CubicBezierAnimation]*/ => {
  const initialAnimation = useMemo(() => {
    return interpolateCubicBezierAnimation(
      createInitialCubicBezierAnimation(initial === null ? value : initial),
      value,
      500,
      10,
      performance.now()
    );
  })

  const prevValueRef = useRef(initial === null ? value : initial);
  const animRef = useRef(initialAnimation);

  if (prevValueRef.current !== value) {
    animRef.current = interpolateCubicBezierAnimation(animRef.current, value, options.duration, options.impulse, performance.now());
    prevValueRef.current = value;
  }

  return [animRef.current];
};
