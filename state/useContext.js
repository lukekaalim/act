// @flow strict
/*:: import type { Node, Component } from '../node'; */
/*:: import type { Graph } from '../graph'; */
/*:: import type { StatePath, CommitState } from '../state'; */
/*:: import type { Context } from '../context'; */
const { nanoid: uuid } = require('nanoid'); 

/*::
export type UseContext = <T>(context: Context<T>) => T;
*/

const createSubscriber = (graph, path, stateIndex, contextState) => (newValue) => {
  const currentState = graph.states.get(path[path.length - 1]);
  if (!currentState)
    throw new Error(`Attempting to set state on non-existing hook`);
  const usedContexts = new Map(currentState.usedContexts);
  usedContexts.set(stateIndex, {
    ...contextState,
    currentValue: newValue,
  });

  const newState = {
    ...currentState,
    usedContexts,
  };
  graph.update({ path, newState });
}

const getProvider = (graph, path) => {// starting at the closest and working backwards,
  // what's the closest context provider on our tree?
  const providerId = [...path].reverse().find(id => graph.contexts.has(id));
  if (!providerId)
    return null;
  const provider = graph.contexts.get(providerId);
  if (!provider)
    return null;
  return provider;
};

const setupUseContext = (graph/*: Graph*/, path/*: StatePath*/, state/*: CommitState*/)/*: UseContext*/ => {
  let useStateCount = 0;

  const useContext = /*:: <T>*/({ defaultValue, contextId }/*: Context<T>*/)/*: T*/ => {
    const stateIndex = ++useStateCount;

    const provider = getProvider(graph, path);
    if (!provider)
      return defaultValue;
    
    const { providerId, currentValue, subscribers } = provider;
    const subscriberId = uuid();

    const contextState = {
      providerId,
      contextId,
      subscriberId,
      currentValue,
    };
    state.usedContexts.set(stateIndex, contextState);
    subscribers.set(subscriberId, createSubscriber(graph, path, stateIndex, contextState));

    // $FlowFixMe
    return currentValue;
  };

  return useContext;
};

const loadUseContext = (graph/*: Graph*/, path/*: StatePath*/, state/*: CommitState*/)/*: UseContext*/ => {
  let useStateCount = 0;

  const useContext = /*:: <T>*/({ defaultValue, contextId }/*: Context<T>*/)/*: T*/ => {
    const stateIndex = ++useStateCount;
    const commitState = state.usedContexts.get(stateIndex);
    // lack of commit state indicates theres nothing connected when we looked
    if (!commitState)
      return defaultValue;
    if (contextId === commitState.contextId)
      // $FlowFixMe
      return commitState.currentValue;
    
    const oldContextState = graph.contexts.get(commitState.providerId);
    if (!oldContextState)
      throw new Error(`Context unmounted before subscribers`);
    oldContextState.subscribers.delete(commitState.subscriberId);

    state.usedContexts.delete(stateIndex);
    const provider = getProvider(graph, path);
    if (!provider)
      return defaultValue;
    
    const { providerId, currentValue, subscribers } = provider;
    const subscriberId = uuid();
    const newContextState = {
      providerId,
      contextId,
      subscriberId,
      currentValue,
    };
    state.usedContexts.set(stateIndex, newContextState);
    subscribers.set(subscriberId, createSubscriber(graph, path, stateIndex, newContextState));
    // $FlowFixMe
    return currentValue;
  };

  return useContext;
};

const teardownUseContext = (graph/*: Graph*/, path/*: StatePath*/, state/*: CommitState*/) => {
  for (const [index, { providerId, subscriberId }] of state.usedContexts) {
    const context = graph.contexts.get(providerId);
    if (!context)
      throw new Error(`Context unmounted before subscribers`);
    context.subscribers.delete(subscriberId);
  }
};

module.exports = {
  setupUseContext,
  loadUseContext,
  teardownUseContext,
};