// @flow strict

/*::
import * as element from "../../library/element";

export type ArrayElementState = 
  | 'initial'
  | 'entering'
  | 'exiting'

export type ArrayAnimator<T> = {
  update: (nextArray: T[]) => void,
  remove: (elementToRemove: T) => void,
  getElements: () => [T, ArrayElementState][],
};
*/

export const createArrayAnimator = /*:: <T>*/(
  initialArray/*: T[]*/,
)/*: ArrayAnimator<T>*/ => {
  const elements = new Map(initialArray.map(v => [v, 'initial']));

  const update = (nextArray) => {
    const exiting = [...elements.keys()].filter(v => !nextArray.includes(v));
    const entering = nextArray.filter(v => {
      const state = elements.get(v);
      return !state || state === 'exiting';
    });

    for (const element of exiting)
      elements.set(element, 'exiting');
    for (const element of entering)
      elements.set(element, 'entering');
  };
  const remove = (elementToRemove) => {
    elements.delete(elementToRemove);
  };
  const getElements = () => {
    return [...elements.entries()];
  };

  return {
    update,
    remove,
    getElements,
  };
};

class MissingKeyError extends Error {};

export const createKeyedArrayAnimator = /*:: <T>*/(
  initialArray/*: T[]*/,
  getKey/*: T => mixed*/,
)/*: ArrayAnimator<T>*/ => {
  const keyMap = new Map(initialArray.map(e => [getKey(e), e]));
  const animator = createArrayAnimator([...keyMap.keys()]);

  const update = (nextArray) => {
    const nextKeys = nextArray.map(getKey);
    for (let i = 0; i < nextKeys.length; i++)
      keyMap.set(nextKeys[i], nextArray[i]);
    animator.update(nextKeys);
  };
  const remove = (elementToRemove) => {
    const key = getKey(elementToRemove);
    keyMap.delete(key);
    animator.remove(key);
  };
  const getElements = () => {
    return animator.getElements()
      .map(([ key, state ]) => {
        const value = keyMap.get(key);
        if (!keyMap.has(key))
          throw new MissingKeyError(`Key "${JSON.stringify(key) || 'undefined'}" is not in map!`);
        return [(value/*: any*/), state];
      });
  };

  return {
    update,
    remove,
    getElements,
  }
};