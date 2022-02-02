// @flow strict
/*:: import type { Element, Component, Context, ContextID } from '@lukekaalim/act'; */

/*:: import type { BranchState, Commit, Change, CommitRef, CommitID } from './commit2.js'; */
/*:: import type { Scheduler } from './schedule.js'; */

/*::
export type ContextState<T> = {|
  value: T,
|};

export type ContextService = {|
  calculateNextBranch: (element: Element, prev: BranchState) => BranchState,
|};
*/

export const createContextService = (scheduler/*: Scheduler*/)/*: ContextService*/ => {
  const calculateNextBranch = (element, prev) => {
    const { contextId, value } = (element.props/*: any*/);

    return { ...prev, context: { ...prev.context, [contextId]: { value } } };
  };

  return {
    calculateNextBranch,
  };
};
