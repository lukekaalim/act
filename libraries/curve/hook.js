// @flow strict
/*:: import type { BezierAnimator, BezierAnimatorOptions } from "./bezier.js"; */
import { useEffect, useState } from "@lukekaalim/act";
import { useAnimation } from "./animation";
import { createBezierAnimator } from "./bezier";

/*::
export type CurveOptions = {
  duration?: number,
  impulse?: number,
}
*/

export const useCurve = (
  target/*: number*/,
  onUpdate/*: (position: number, velocity: number, acceleration: number) => mixed*/,
  { duration = 500, impulse = 0 }/*: CurveOptions */ = {}
)/*: BezierAnimator*/ => {
  const [animator] = useState(createBezierAnimator({ initial: { to: target, from: target, velocity: 0 }, impulse, duration }));
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
