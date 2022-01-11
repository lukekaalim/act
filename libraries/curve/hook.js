// @flow strict
/*:: import type { BezierAnimator, BezierAnimatorOptions } from "./bezier.js"; */
/*:: import type { ArrayAnimator, ArrayElementState } from "./array.js"; */
import { useEffect, useMemo, useRef, useState } from "@lukekaalim/act";
import { useAnimation } from "./animation.js";
import { createKeyedArrayAnimator } from "./array.js";
import { createBezierAnimator } from "./bezier.js";

/*::
export type CurveOptions = {
  duration?: number,
  impulse?: number,
  start?: number,
}
*/

export const useCurve = (
  target/*: number*/,
  onUpdate/*: (position: number, velocity: number, acceleration: number) => mixed*/,
  { duration = 500, impulse = 0, start = target }/*: CurveOptions */ = {}
)/*: BezierAnimator*/ => {
  const [animator] = useState/*:: <BezierAnimator>*/(() =>
    createBezierAnimator({ initial: { to: target, from: start, velocity: 0 }, impulse, duration }));
  useEffect(() => {
    const now = performance.now();
    if (animator.getPosition(now) !== target)
      animator.update(target, now);
  }, [target])
  useAnimation((now) => {
    const position = animator.getPosition(now);
    const velocity = animator.getVelocity(now);
    const acceleration = animator.getAcceleteration(now);
    
    onUpdate(position, velocity, acceleration);
    return animator.isDone(now);
  }, [target, onUpdate])
  return animator;
};

/*::
export type UseChangeListOptions<T> = {
  calculateKey?: T => mixed,
  initialArray?: T[],
};
*/

export const useChangeList = /*:: <T>*/(
  values/*: T[]*/,
  { calculateKey = v => v, initialArray = [] }/*: UseChangeListOptions<T> */ = {}
)/*: [[T, ArrayElementState][], ArrayAnimator<T>]*/ => {
  const [animator] = useState/*:: <ArrayAnimator<T>>*/(
    () => createKeyedArrayAnimator(initialArray, calculateKey)
  );

  const changeList = useMemo(() => {
    animator.update(values);
    return animator.getElements();
  }, [...values]);

  return [changeList, animator];
}