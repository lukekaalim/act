// @flow strict


import { useEffect, useState } from "@lukekaalim/act";
import { createInitialCubicBezierAnimation, interpolateCubicBezierAnimation } from "@lukekaalim/act-curve";
import { calculateIndexChanges } from "@lukekaalim/act-reconciler/util";
import { nanoid } from "nanoid/non-secure";

/*::
import type { CubicBezierAnimation } from "@lukekaalim/act-curve";

export type FadeTransitionStateID = string;
export type FadeTransitionState<T> = {
  id: FadeTransitionStateID,

  value: T,
  key: mixed,
  position: 'entering' | 'exiting',
  animation: CubicBezierAnimation,
};
*/

const createInitialState = /*:: <T>*/(value/*: T*/, getElementKey/*: T => mixed*/)/*: FadeTransitionState<T>*/ => {
  return {
    id: nanoid(),
    value,
    key: getElementKey(value),
    position: 'entering',
    animation: createInitialCubicBezierAnimation(0),
  }
}
const isValidState = /*:: <T>*/(state/*: FadeTransitionState<T>*/, now/*: DOMHighResTimeStamp*/) => {
  return state.animation.span.start + state.animation.span.durationMs > now;
}

export const useFadeTransition = /*:: <T>*/(
  elements/*: T[]*/,
  getElementKey/*: T => mixed*/
)/*: FadeTransitionState<T>[]*/ => {
  const [currentElements, setCurrentElements] = useState/*::<FadeTransitionState<T>[]>*/(
    elements.map(e => createInitialState(e, getElementKey))
  );
  const [prevElements, setPrevElements] = useState/*::<FadeTransitionState<T>[]>*/([]);

  useEffect(() => {
    const now = performance.now();
    const nextKeys = elements.map(getElementKey);
    const changes = calculateIndexChanges(
      currentElements.map(prev => prev.key),
      nextKeys
    );
    const nextElements = elements.map((value, index) => {
      const created = changes.created.includes(index);
      if (created) {
        return {
          id: nanoid(),
          value, key: nextKeys[index],
          position: 'entering',
          animation: interpolateCubicBezierAnimation(
            createInitialCubicBezierAnimation(-1),
            0, 500, 3, now,
          ),
        };
      }
      if (changes.persisted.includes(index))
        return { ...currentElements[index], value };
      const oldIndices = changes.moved.find(([prev, next]) => next === index)
      if (!oldIndices)
        throw new Error();
      return { ...currentElements[oldIndices[0]], value };
    })
    setCurrentElements(nextElements);

    const removed = changes.removed.map(removed => currentElements[removed]);

    setPrevElements(prevs => [
      ...prevs.filter(p => isValidState(p, now)),
      ...removed.map(state => ({
        ...state,
        position: 'exiting',
        animation: interpolateCubicBezierAnimation(state.animation, 1, 500, 3, now)
      }))
    ])

  }, [elements]);

  return [
    ...prevElements,
    ...currentElements,
  ]
};