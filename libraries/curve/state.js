// @flow strict

import { useMemo, useRef, useState } from "@lukekaalim/act";

export const useAccumulatedState = /*:: <T, S>*/(
  next/*: T*/,
  calculateState/*: (next: T, prev?: S) => S*/
)/*: S*/ => {
  const currentRef = useRef(next);
  const previousRef = useRef(calculateState(next));

  if (next !== currentRef.current) {
    previousRef.current = calculateState(next, previousRef.current);
    currentRef.current = next;
  }
  
  return previousRef.current;
};

export const useReducer = /*:: <A, S>*/(reducer/*: (S, A) => S*/, initialState/*: S*/)/*: [S, A => void, S => void]*/ => {
  const [state, setState] = useState/*:: <S>*/(initialState);
  const dispatch = useMemo(() => {
    return (action) => {
      setState(prev => reducer(prev, action));
    };
  }, []);

  return [state, dispatch, setState];
};