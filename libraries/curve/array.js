// @flow strict

/*:: import type { Line, LineAnimation } from "./linear"; */
/*:: import type { CubicBezierAnimation } from "./bezier"; */

import { createInitialCubicBezierAnimation, interpolateCubicBezierAnimation } from "./bezier.js";
import { useMemo, useRef } from "@lukekaalim/act";

/*::
export type IndexChangeset = {
  created: number[],
  persisted: number[],
  moved: [number, number][],
  removed: number[]
}
*/

const calculateIndexChanges = /*:: <A, B>*/(
  prev/*: A[]*/,
  next/*: B[]*/,
)/*: IndexChangeset*/ => {
  const created = [];
  const persisted = [];
  const moved = [];
  const removed = []

  for (let nextIndex = 0; nextIndex < next.length; nextIndex++) {
    const nextElement = next[nextIndex];
  
    const prevIndex = prev.indexOf(nextElement);
    if (prevIndex === -1) {
      // There is no previous index, this element was just created
      created.push(nextIndex);
    } else {
      // there is a prev & next index, this element persisted
      if (prevIndex === nextIndex) {
        persisted.push(nextIndex)
      } else {
        moved.push([prevIndex, nextIndex])
      }
    }
  }
  for (let prevIndex = 0; prevIndex < prev.length; prevIndex++) {
    const prevElement = prev[prevIndex];
    const nextIndex = next.indexOf(prevElement);
    if (nextIndex === -1)  {
      // there is no next index, this element has been removed
      removed.push(prevIndex);
    } else {
      // there is a prev & next index, but this case shoudl already be handled.
    }
  }

  return {
    created,
    persisted,
    removed,
    moved,
  };
}

/*::
type AnimatedArrayReducer<T, S> = (
  elements: T[],
  now: DOMHighResTimeStamp,
  state: [T, S][]
) => [T, S][]

type AnimatedElementReducer<T, S> = (
  index: null | number,
  state: -1 | 0 | 1,
  value: T,
  now: DOMHighResTimeStamp,
  state?: S,
) => S;
*/

export const createAnimatedArrayReducer = /*:: <T, S>*/(
  elementReducer/*: AnimatedElementReducer<T, S>*/,
)/*: AnimatedArrayReducer<T, S>*/ => {
  const reducer = (
    elements,
    now,
    animations
  ) => {
    const prevElements = animations.map(a => a[0]);
    // Sadly, as we're using the "animations" array to get our previous elements,
    // the indices of the state.animations array don't correlate at all to
    // the indices of the action.elements array, so they basically will always be
    // considered "moved" (unless we get lucky)

    // a "prev index" here is basically just where in the animations array
    // this particular element's animation state is stored.
    const changes = calculateIndexChanges(prevElements, elements);

    const created = changes.created.map(nextIndex => [
      elements[nextIndex],
      elementReducer(nextIndex, 0, elements[nextIndex], now)
    ]);
    const persisted = changes.persisted.map(nextIndex => [
      elements[nextIndex],
      elementReducer(nextIndex, 0, elements[nextIndex], now, animations[nextIndex][1])
    ]);
    const moved = changes.moved.map(([prevIndex, nextIndex]) => [
      elements[nextIndex],
      elementReducer(nextIndex, 0, elements[nextIndex], now, animations[prevIndex][1])
    ]);
    const removed = changes.removed.map(prevIndex => [
      animations[prevIndex][0],
      elementReducer(null, 1, animations[prevIndex][0], now, animations[prevIndex][1])
    ]);

    return [
      ...removed,
      ...created,
      ...persisted,
      ...moved
    ];
  };

  return reducer;
};

/*::
type BezierElementOptions = {
  indexDurationMs: number,
  indexImpulse: number,
  statusDurationMs: number,
  statusImpulse: number,
};
type BezierElementState = {
  index: CubicBezierAnimation,
  status: CubicBezierAnimation
}
*/

export const createCubicBeizerElementReducer = /*:: <T>*/(
  { indexDurationMs, indexImpulse, statusDurationMs, statusImpulse }/*: BezierElementOptions*/
)/*: AnimatedElementReducer<T, BezierElementState>*/ => {
  const indexReducer = (index, now, prevAnimation) => {
    if (!prevAnimation)
      return createInitialCubicBezierAnimation(index || 0);

    if (index === null)
      return prevAnimation;
    
    if (index === prevAnimation.shape[3])
      return prevAnimation;
    
    return interpolateCubicBezierAnimation(prevAnimation, index, indexDurationMs, indexImpulse, now);
  };
  const statusReducer = (status, now, prevAnimation) => {
    if (!prevAnimation)
      return interpolateCubicBezierAnimation(
        createInitialCubicBezierAnimation(-1),
        0,
        statusDurationMs,
        statusImpulse,
        now
      );
    
    if (status === prevAnimation.shape[3])
      return prevAnimation;
    
    return interpolateCubicBezierAnimation(prevAnimation, status, statusDurationMs, statusImpulse, now);
  };

  const elementReducer = (index, status, value, now, state = { index: null, status: null }) => {
    return {
      index: indexReducer(index, now, state.index),
      status: statusReducer(status, now, state.status),
    }
  };

  return elementReducer;
};

/*::
type ListAnimation<T> = {
  index: CubicBezierAnimation,
  status: CubicBezierAnimation,
  value: T
};
*/
export const defaultBezierElementOptions = {
  indexDurationMs: 500,
  indexImpulse: 1,
  statusDurationMs: 500,
  statusImpulse: 0
};

export const useAnimatedList = /*:: <T>*/(
  list/*: T[]*/,
  initial/*: T[]*/,
  options/*: BezierElementOptions*/ = defaultBezierElementOptions
)/*: [ListAnimation<T>[], (ListAnimation<T> => boolean) => void]*/ => {
  const prevListRef = useRef(null);
  const ref = useRef(initial.map((v, i) => [
    v,
    {
      index: createInitialCubicBezierAnimation(i),
      status: createInitialCubicBezierAnimation(0)
    }
  ]));

  const reducer = createAnimatedArrayReducer(createCubicBeizerElementReducer(options))

  if (prevListRef.current !== list) {
    ref.current = reducer(list, performance.now(), ref.current);
    prevListRef.current = list;
  }

  const update = useMemo(() => (filterFunc) => {
    ref.current = ref.current.filter(([value, a]) => filterFunc({ ...a, value }))
  });

  return [
    ref.current.map(([value, a]) => ({ ...a, value })), 
    update,
  ];
};