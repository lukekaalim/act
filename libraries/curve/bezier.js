// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import { createProgressAnimator } from "./progress.js";
import { lerp } from "./math.js";

/*::
export type CubicBezier = [number, number, number, number];
*/

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
export const getBerenstienCubicPoint = ([a, b, c, d]/*: CubicBezier*/, t/*: number*/)/*: number*/ => {
  return (
    a * (((-t) ** 3) + (3 * (t ** 2)) - (3 * t) + 1) +
    b * (3 * (t ** 3) - (6 * (t ** 2)) + (3 * t)) +
    c * (-3 * (t ** 3) + (3 * (t ** 2))) +
    d * (t ** 3)
  );
}

export const getBezierWeights = (t/*: number*/)/*: [number, number, number, number]*/ => {
  return [
    ((-t) ** 3) + (3 * (t ** 2)) - (3 * t) + 1,
    3 * (t ** 3) - (6 * (t ** 2)) + (3 * t),
    -3 * (t ** 3) + (3 * (t ** 2)),
    t ** 3,
  ]
}

export const getBezierVelocityWeights = (t/*: number*/)/*: [number, number, number, number]*/ => {
  return [
    -3 * ((t - 1) ** 2),
    3 - (12 * t) + (9 * (t ** 2)),
    3 * (2 - (3 * t)) * t,
    3 * (t * t),
  ];
}

export const getBezierP2ForVelocity = ([a, c, d]/*: [number, number, number]*/, t/*: number*/, v/*: number*/)/*: number*/ => {
  return -(
    a * (-3 * ((t - 1) ** 2)) +
    c * (3 * (2 - (3 * t)) * t) +
    d * (3 * (t * t)) -
    v
  ) / (3 - (12 * t) + (9 * (t ** 2)))
}
export const getBezierP3ForVelocity = ([a, b, d]/*: [number, number, number]*/, t/*: number*/, v/*: number*/)/*: number*/ => {
  return -(
    a * (-3 * ((t - 1) ** 2)) +
    b * (3 - (12 * t) + (9 * (t ** 2)) +
    d * (3 * (t * t)) -
    v
  ) / (3 * (2 - (3 * t)) * t))
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

/*::
export type BezierAnimatorOptions = {
  initial?: { to: number, from: number, velocity: number },
  duration?: number,
  impulse?: number,
};

export type BezierAnimator = {
  update: (to: number, start: DOMHighResTimeStamp) => void,
  getPosition: (now: DOMHighResTimeStamp) => number,
  getVelocity: (now: DOMHighResTimeStamp) => number,
  getAcceleteration: (now: DOMHighResTimeStamp) => number,
  isDone: (now: DOMHighResTimeStamp) => boolean,
};
*/

export const createBezierAnimator = ({
  initial = { to: 0, from: 0, velocity: 0 },
  duration = 500,
  impulse = 0,
}/*: BezierAnimatorOptions*/ = {})/*: BezierAnimator*/ => {
  let curve = [initial.to, initial.to + initial.velocity, initial.from, initial.from];

  const progressAnimator = createProgressAnimator();

  const update = (nextTo, start) => {
    const velocity = getVelocity(start);
    const p1 = getPosition(start);
    const distance = nextTo - p1;
    const direction = Math.abs(distance) / distance;
    const impulseForce = distance === 0 ? 0 : (direction * impulse);
    const p2 = getBezierP2ForVelocity([p1, nextTo, nextTo], 0, velocity + impulseForce);

    curve = [p1, p2, nextTo, nextTo];
    progressAnimator.update(start, duration);
  };
  const getPosition = (now) => {
    const progress = progressAnimator.getProgress(now);
    return getBerenstienCubicPoint(curve, progress);
  }
  const getVelocity = (now) => {
    const progress = progressAnimator.getProgress(now);
    return getBezierVelocity(curve, progress);
  }
  const getAcceleteration = (now) => {
    const progress = progressAnimator.getProgress(now);
    return getBezierAcceleration(curve, progress);
  }
  const isDone = (now) => {
    const progress = progressAnimator.getProgress(now);
    return progress >= 1;
  }

  return { update, getPosition, getVelocity, getAcceleteration, isDone };
};
