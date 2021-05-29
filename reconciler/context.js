// @flow strict
/*:: import type { Element, Component, Context, ContextID } from '@lukekaalim/act'; */
import { getStateId } from "./commit2";

/*:: import type { Tree } from './tree'; */
/*:: import type { StateID, StatePath, ComponentState } from './state2'; */
/*:: import type { Commit, CommitDiff } from './commit2'; */

/*::
export type ContextState<T> = {|
  providerId: StateID,
  contextId: ContextID,
  subscribers: Map<StateID, (value: T) => void>,
  currentValue: T,
|};

export type ContextService = {|
  traverseProviderElement: (path: StatePath, element: Element) => void,
  removeContextState: (path: StatePath) => void,
|};
*/

export const createContextService = (tree/*: Tree*/)/*: ContextService*/ => {
  const updateContextState = (state, newValue) => {
    tree.contexts.set(state.providerId, { ...state, currentValue: newValue });
    for (const [_, subscriber] of state.subscribers)
      subscriber(newValue);
  };
  const createContextState = (stateId, contextId, initialValue) => {
    const state = {
      providerId: stateId,
      contextId,
      subscribers: new Map(),
      currentValue: initialValue
    }
    tree.contexts.set(stateId, state);
  };
  const removeContextState = (path) => {
    const stateId = getStateId(path);
    tree.contexts.delete(stateId);
  };
  const traverseProviderElement = (path, element) => {
    const stateId = getStateId(path);
    const { value, contextId } = element.props;
    const prevState = tree.contexts.get(stateId);
    if (prevState)
      if (prevState.currentValue !== value)
        updateContextState(prevState, value)
    else
      if (typeof contextId === 'string')
        createContextState(stateId, (contextId/*: any*/), value);
  };

  return {
    traverseProviderElement,
    removeContextState,
  };
};
