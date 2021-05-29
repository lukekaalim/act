// @flow strict
/*:: import type { UseState } from '@lukekaalim/act'; */

/*:: import type { Tree } from '../tree'; */
/*:: import type { ComponentState } from '../state2.js'; */

import { getStateId } from "../commit2.js";

/*::
export type Updater<T> = (old: T) => T;
export type SetValue<T> = (newValue: T | Updater<T>) => void

export type UseStateData = Map<mixed, {|
  value: mixed,
  setValue: SetValue<mixed>,
|}>;
*/

const createSetValue = (index, state, tree, initialValue)/*: SetValue<mixed>*/ => {
  const id = getStateId(state.path);

  const setValue = (newValue) => {
    // Get a fresh copy of the state; It's likely it changed between the creation
    // of the hook and the running of the updater.
    const commitState = tree.states.get(id);
    if (!commitState)
      throw new Error(`Attempting to set state on non-existing hook`);

    // get the new value, weather it's an updater or literal
    let updatedValue;
    if (typeof newValue === 'function') {
      const previousState = commitState.useStateData.get(index) || { value: initialValue };
      updatedValue = (newValue/*: Function*/)(previousState.value);
    } else {
      updatedValue = newValue;
    }

    // Write the new value to our state
    const newCall = {
      setValue,
      value: updatedValue,
    }
    const newState = {
      ...commitState,
      useStateData: new Map(commitState.useStateData).set(index, newCall),
    };
    // Push the new state to the graph
    tree.update(newState);
  };

  return setValue;
};

export const loadUseState = (tree/*: Tree*/, state/*: ComponentState*/)/*: UseState*/ => {
  let useStateCount = 0;

  const useState = (initialValue/*: mixed*/) => {
    const stateIndex = useStateCount++;

    const existingHook = state.useStateData.get(stateIndex);
    if (existingHook)
      return [existingHook.value, existingHook.setValue];
  
    const setValue = createSetValue(stateIndex, state, tree, initialValue);
    state.useStateData.set(stateIndex, { value: initialValue, setValue });
    return [initialValue, setValue];
  };

  // $FlowFixMe
  return useState;
}
