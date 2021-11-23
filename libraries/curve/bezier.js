// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { UseInterpolator, UseInterpolatorMap } from "./hook"; */
import { h, useEffect, useMemo, useRef } from "@lukekaalim/act";
import { usePreviousEffect } from "./previous.js";
import { calculateProgress, createProgressAnimator } from "./progress.js";
import { lerp, Vector2 } from "./math.js";
import { useAnimation } from "./animation.js";
import { createInterpolationMapHook } from "./hook.js";
import { createInterpolationHook } from "./hook";


const calculateBezierPosition = (v/*: Vector2[]*/, t/*: number*/) => {
  if (v.length === 0)
    throw new Error();
  if (v.length === 1)
    return v[0];

  const a = v.slice(0, -1);
  const b = v.slice(1);
  return Vector2.lerp(calculateBezierPosition(a, t), calculateBezierPosition(b, t), t);
}

const calculateCubicBezierPosition = (bezier/*: CubicBezier*/, t/*: number*/)/*: Vector2*/ => {
  return calculateBezierPosition([bezier.start.position, bezier.start.control, bezier.end.control, bezier.end.position], t);
}
const calculateCubicBezierForwardVelocity = (bezier/*: CubicBezier*/, t/*: number*/)/*: Vector2*/ => {
  const a = calculateBezierPosition([bezier.start.position, bezier.start.control, bezier.end.control], t);
  const b = calculateBezierPosition([bezier.start.control, bezier.end.control, bezier.end.position], t);
  const position = calculateBezierPosition([a, b], t);

  return b.add(position.negate());
}

/*::
export type CubicBezier = {
  start: BezierTarget,
  end: BezierTarget,
}

export type BezierTarget = {
  position: Vector2,
  control: Vector2,
};
*/

export const createMomentumPreservingBezier = (previousBezier/*: CubicBezier*/, progress/*: number*/, target/*: number*/)/*: CubicBezier*/ => {
  const position = calculateCubicBezierPosition(previousBezier, progress);
  const velocity = calculateCubicBezierForwardVelocity(previousBezier, progress);
  const bezier = {
    start: {
      position: new Vector2(0, position.y),
      control: new Vector2(1, position.y + (velocity.y)) },
    end: {
      position: new Vector2(1, target),
      control: new Vector2(0, target)
    },
  };
  return bezier;
}
export const createPointBezier = (target/*: number*/)/*: CubicBezier*/ => {
  const bezier = {
    start: { position: new Vector2(0, target), control: new Vector2(0, target) },
    end: { position: new Vector2(1, target), control: new Vector2(1, target) }
  };
  return bezier;
}

/*::
export type BezierAnimator = {
  update: (to: number, start: DOMHighResTimeStamp) => void,
  getPoint: (now: DOMHighResTimeStamp) => { velocity: number, position: number },
  getValue: (now: DOMHighResTimeStamp) => number,
  isDone: (now: DOMHighResTimeStamp) => boolean,
};
*/

const getCubicPoint = (a, b, c, d, t) => {
  const ab = lerp(a, b, t);
  const bc = lerp(b, c, t);
  const cd = lerp(c, d, t);

  const abc = lerp(ab, bc, t);
  const bcd = lerp(bc, cd, t);

  const position = lerp(abc, bcd, t);
  const velocity = bcd - position;
  return { velocity, position };
};

export const createBezierAnimator = (
  duration/*: number*/,
  initialValue/*: number*/
)/*: BezierAnimator*/ => {
  let from = initialValue;
  let to = initialValue;
  let velocity = initialValue;

  const progressAnimator = createProgressAnimator();

  const update = (nextTo, start) => {
    const nextPoint = getPoint(start);

    from = nextPoint.position;
    to = nextTo;
    velocity = nextPoint.velocity;

    progressAnimator.update(start, duration);
  };
  const getPoint = (now) => {
    const progress = progressAnimator.getProgress(now);
    return getCubicPoint(from, from + velocity, to - velocity, to, progress);
  }
  const getValue = (now) => {
    const { position } = getPoint(now);
    return position;
  }
  const isDone = (now) => {
    const progress = progressAnimator.getProgress(now);
    return progress >= 1;
  }

  return { update, getPoint, getValue, isDone };
};

export const calculateBezierPoints = (bezier/*: CubicBezier*/, segments/*: number*/)/*: Vector2[]*/ => {
  const points = [];
  for (let i = 0; i < segments; i++)
    points.push(calculateCubicBezierPosition(bezier, i/segments));
  return points;
}

export const useBeziers/*: UseInterpolatorMap*/ = createInterpolationMapHook(v => createBezierAnimator(1000, v));
export const useBezier/*: UseInterpolator*/ = createInterpolationHook(v => createBezierAnimator(1000, v));
export const useBezierVelocity/*: UseInterpolator*/ = createInterpolationHook(v => {
  const bezier = createBezierAnimator(1000, v)
  return {
    ...bezier,
    getValue: (now) => {
      const { velocity } = bezier.getPoint(now);
      return velocity;
    }
  }
});