// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
/*:: import type { Change, TraversalResult, CommitDiff, Commit, BranchState, ElementChange, CommitRef } from './commit2.js'; */
import { createId, h } from '@lukekaalim/act';
import { calculateChanges, emptyCommit } from './commit2';

/*::
export type BoundaryService = {
  tryBoundaryCommit: (
    ref: CommitRef,
    change: Change,
    diffs: CommitDiff[],
    branch: BranchState,
    render: (change: Change, branch?: BranchState) => CommitDiff
  ) => ?CommitDiff
};
*/

export const createBoundaryService = ()/*: BoundaryService*/ => {
  const tryBoundaryCommit = (ref, change, diffs, branch, render) => {
    const prev = change.prev || emptyCommit;
    const element = change.element || change.prev.element;
  
    if (element.type !== 'act:boundary')
      return null;
    
    const previousSuspension = diffs.map(d => d.prev.suspension).find(Boolean);
    const nextSuspension = diffs.map(d => d.next.suspension).find(Boolean);

    const closestSuspension = nextSuspension || previousSuspension;

    if (!closestSuspension)
      return null;

    const fallbackProp/*: any*/ = element.props.fallback;
    const fallbackElement = typeof fallbackProp === 'function' ? h(fallbackProp, { value: closestSuspension.value }) : fallbackProp;
    const fallbackPrev = (
      prev.children.find(c => c.element.props.key && (c.element.props.key === fallbackElement.props.key)) ||
      prev.children.find((c, i) =>
        i === prev.children.length - 1 &&
        c.element.type === fallbackElement.type &&
        !c.element.props.key &&
        !fallbackElement.props.key
      )
    );

    // $FlowFixMe[incompatible-call]
    const fallbackDiff = render({ prev: fallbackPrev, element: nextSuspension ? fallbackElement : null  }, {
      ...branch,
      path: [...branch.path, ref.id]
    });
    const nextDiffs = [...diffs.filter(d => fallbackPrev ? d.next.id !== fallbackPrev.id : true), fallbackDiff];
    
    const next = {
      ...ref,
      version: createId(),
      element,
      pruned: false,
      suspension: fallbackDiff.next.suspension,
      children: nextDiffs.map(d => d.next).filter(c => !c.pruned)
    }
    return { prev, next, diffs: nextDiffs };
  }

  return {
    tryBoundaryCommit,
  };
};