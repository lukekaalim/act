// @flow strict
/*:: import type { Node, Component } from './node'; */
/*:: import type { Graph } from './graph'; */
/*:: import type { StatePath, CommitState, StateID } from './state'; */
/*:: import type { Commit, CommitDiff } from './commit'; */
const { nanoid: uuid } = require('nanoid');
const { getStateId } = require('./state');

/*::
export type ContextID = string;
export type ContextSubscriberID = string;

export type Context<T> = {
  contextId: ContextID,
  defaultValue: T,
  Provider: Component<{ value: T }>
};
export type ContextState<T> = {
  providerId: StateID,
  contextId: ContextID,
  subscribers: Map<ContextSubscriberID, (value: T) => void>,
  currentValue: T,
};
*/

const createContext = /*:: <T>*/(defaultValue/*: T*/)/*: Context<T>*/ => {
  const contextId = uuid();

  const Provider = ({ value }, children, { useGraph, useStatePath, useEffect }) => {
    const providerId = getStateId(useStatePath());
    const { contexts } = useGraph();

    useEffect(() => {
      contexts.set(providerId, {
        providerId,
        contextId,
        subscribers: new Map(),
        currentValue: value,
      });
      return () => {
        contexts.delete(providerId);
      };
    }, []);

    useEffect(() => {
      const state = contexts.get(providerId);
      if (!state)
        throw new Error(`Missing context state`);
      contexts.set(providerId, { ...state, currentValue: value });
      for (const [id, subscriber] of state.subscribers)
        subscriber(value);
    }, [value]);
  
    return children;
  };

  return {
    defaultValue,
    contextId,
    Provider,
  };
};

module.exports = {
  createContext,
};