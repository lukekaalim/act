// @flow strict
/*:: import type { Tree } from '../tree.js'; */
/*:: import type { ContextState } from '../context.js'; */
/*:: import type { Context, ContextID } from '@lukekaalim/act'; */
/*:: import type { StateID, StatePath, ComponentState } from '../state2.js'; */

/*::
export type UseContext = <T>(context: Context<T>) => T;

export type UseContextData = Map<ContextID, {|
  providerId: StateID,
  value: mixed,
|}>;
*/

const getContextState = /*:: <T>*/(
  tree/*: Tree*/,
  path/*: StatePath*/,
  context/*: Context<T>*/
)/*: null | ContextState<T>*/ => {
  // starting at the closest and working backwards,
  // what's the closest context provider on our tree?
  const contextState = [...path]
    .reverse()
    .map(id => tree.contexts.get(id))
    .find(state => state && state.contextId === context.contextId);
  if (!contextState)
    return null;
  // Cheat here with typing, since theres no way to prove that
  // this state is the same type
  return (contextState/*: any*/);
};

const subscribeContext = /*:: <T>*/(
  tree/*: Tree*/,
  context/*: Context<T>*/,
  state/*: ComponentState*/,
)/*: {| value: mixed |}*/ => {
  const contextState = getContextState(tree, state.path, context);
  if (!contextState)
    return { value: context.defaultValue };
  const { providerId, currentValue, subscribers } = contextState;

  const subscriber = (freshValue) => {
    const freshState = tree.states.get(state.id);
    if (!freshState)
      throw new Error(`Attempting to update context on non-existing hook`);
    const newContextData = {
      value: freshValue,
      providerId,
    };
    const newState = {
      ...freshState,
      useContextData: new Map(freshState.useContextData).set(context.contextId, newContextData),
    };
    tree.update(newState);
  };
  const data = {
    value: currentValue,
    providerId,
  };
  subscribers.set(state.id, subscriber);
  state.useContextData.set(context.contextId, data)
  return { value: currentValue };
};

export const loadUseContext = (
  tree/*: Tree*/,
  state/*: ComponentState*/
)/*: UseContext*/ => {
  const useContext = /*:: <T>*/(context/*: Context<T>*/)/*: T*/ => {
    const { value } = state.useContextData.get(context.contextId) || subscribeContext(tree, context, state);

    return (value/*: any*/);
  };
  return useContext;
};

export const teardownUseContext = (tree/*: Tree*/, { path, id, useContextData }/*: ComponentState*/) => {
  for (const [_, subscription] of useContextData) {
    const context = tree.contexts.get(subscription.providerId);
    if (!context)
      throw new Error('Attempting to unsubscribe from destroyed context');
    context.subscribers.delete(id);
  }
};