// @flow strict
/*:: import type { BezierAnimator, BezierAnimatorOptions } from "./bezier.js"; */
import { useEffect, useRef, useState } from "@lukekaalim/act";
import { useAnimation } from "./animation";
import { createBezierAnimator } from "./bezier";

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
  const [animator] = useState(createBezierAnimator({ initial: { to: target, from: start, velocity: 0 }, impulse, duration }));
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
type ValueChange<T> = {
  key: mixed,
  value: T,
  added: DOMHighResTimeStamp,
  removed: null | DOMHighResTimeStamp,
};
*/

export const useChangeList = /*:: <T>*/(
  values/*: T[]*/,
  getKey/*: T => mixed*/ = v => v,
  isDone/*: ValueChange<T> => boolean*/ = () => false
)/*: ValueChange<T>[]*/ => {
  const keys = values.map(getKey);

  const allElementsRef = useRef/*:: <ValueChange<T>[]>*/([]);
  const removedElements = allElementsRef.current.filter(e => {
    if (e.removed != null)
      return false;
    return !keys.includes(e.key);
  });
  const removedKeys = removedElements.map(e => e.key);
  const addedKeys = keys.filter(key => {
    const value = allElementsRef.current.find(e => e.key === key)
    if (!value)
      return true;
    return !!value.removed;
  });

  const now = performance.now();

  console.log({ removedElements, addedKeys });

  allElementsRef.current = [
    // change previous states
    ...allElementsRef.current.map(element => {
      if (!removedKeys.includes(element.key))
        return element;
      if (addedKeys.includes(element.key))
        return null;
      return { ...element, removed: now };
    }).filter(Boolean),
    // add new states
    ...addedKeys.map(key =>
      ({ value: values[keys.indexOf(key)], key, added: now, removed: null }))
    // cull "done" states
  ].filter(entry => !isDone(entry));

  return allElementsRef.current;
}