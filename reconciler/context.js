// @flow strict
/*:: import type { Element, Component, Context, ContextID } from '@lukekaalim/act'; */

/*:: import type { BranchState, TraversalResult, Commit, Change, CommitRef, CommitID } from './commit2.js'; */
/*:: import type { Scheduler } from './schedule.js'; */

/*::
export type ContextState<T> = {|
  contextId: ContextID,
  subscribers: Map<CommitID, CommitRef>,
  value: T,
|};

export type ContextService = {|
  traverse: (ref: CommitRef, change: Change, branch: BranchState) => TraversalResult,
|};
*/

export const createContextService = (scheduler/*: Scheduler*/)/*: ContextService*/ => {
  const states/*: Map<CommitID, ContextState<mixed>>*/ = new Map();

  const traverse = (ref, change, branch) => {
    const element = change.element || change.prev.element;
    const { contextId, value } = (element.props/*: any*/);
    const state = states.get(ref.id) || { contextId, subscribers: new Map(), value };
    states.set(ref.id, state);

    if (state.value !== value) {
      for (const [id, subscriber] of state.subscribers)
        scheduler.scheduleChange(subscriber);
      states.set(ref.id,{ ...state, value });
    }

    if (change.element === null)
      states.delete(ref.id);
    
    return {
      children: element.children,
      branch: { ...branch, context: new Map(branch.context).set(contextId, { ...state, value}) },
      suspension: null
    };
  };

  return {
    traverse,
  };
};
