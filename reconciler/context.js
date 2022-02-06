// @flow strict
/*:: import type { Element, Component, Context, ContextID } from '@lukekaalim/act'; */

/*:: import type { BranchState, Commit, Change, CommitRef, CommitID } from './commit2.js'; */
/*:: import type { Scheduler } from './schedule.js'; */

/*::
export type BranchContext<T> = {|
  value: T,
  ref: CommitRef,
|};

export type ContextState<T> = {|
  subscribers: CommitRef[],
|};

export type ContextService = {|
  calculateNextBranch: (element: Element, commit: CommitRef, prev: BranchState) => BranchState,
  calculateNextTargets: (element: Element, prev: Commit) => CommitRef[],

  attachSubscriber: (context: CommitRef, subscriber: CommitRef) => void,
  detachSubscriber: (context: CommitRef, subscriber: CommitRef) => void,
|};
*/

export const createContextService = ()/*: ContextService*/ => {
  const states = new Map();

  const attachSubscriber = (context, subscriber) => {
    const prevState = states.get(context.id) || { subscribers: [] };

    if (prevState.subscribers.find(c => c.id === subscriber.id))
      return;

    const nextState = { subscribers: [...prevState.subscribers, subscriber] };

    states.set(context.id, nextState);
  }
  const detachSubscriber = (context, subscriber) => {
    const prevState = states.get(context.id) || { subscribers: [] };

    const nextState = { subscribers: prevState.subscribers.filter(s => s.id !== subscriber.id) };

    states.set(context.id, nextState);
  }

  const calculateNextTargets = (element, prev) => {
    const { contextId, value } = (element.props/*: any*/);

    if (value === prev.element.props.value && contextId === prev.element.props.contextId)
      return [];
    
    const state = states.get(prev.id) || { subscribers: [] };
    return state.subscribers;
  }

  const calculateNextBranch = (element, ref, prev) => {
    const { contextId, value } = (element.props/*: any*/);

    return { ...prev, context: { ...prev.context, [contextId]: { value, ref } } };
  };

  return {
    attachSubscriber,
    detachSubscriber,

    calculateNextBranch,
    calculateNextTargets,
  };
};
