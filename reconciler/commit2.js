// @flow strict
/*:: import type { Element, ElementType, ContextID } from '@lukekaalim/act'; */
/*:: import type { ComponentService, ComponentState } from './component.js'; */
/*:: import type { BranchContext, ContextService } from './context.js'; */
/*:: import type { BoundaryService } from './boundary.js'; */
import { createElement, createId } from '@lukekaalim/act';

import { calculateIndexChanges } from './util.js';

/*::
export type CommitID = string;
export type CommitPath = CommitID[];
export type CommitVersion = string;

export type CommitRef = {
  id: CommitID,
  path: CommitPath
};
export type Suspension = {
  ref: CommitRef,
  value: mixed,
};
export type Commit = {
  ...CommitRef,

  pruned: boolean,
  suspension: null | Suspension,
  version: CommitVersion,
  element: Element,
  children: $ReadOnlyArray<Commit>,
};
*/

/*::
export type CommitDiff = {|
  +prev: Commit,
  +next: Commit,
  +diffs: $ReadOnlyArray<CommitDiff>,
|}

export type BranchState = {|
  path: CommitPath,
  context: { [id: ContextID]: BranchContext<any> },
|};

export type Change = {
  targets: CommitRef[],
  prev: Commit,
  element?: ?Element
};

export type CommitService = {|
  render: (change: Change, branch?: BranchState) => CommitDiff,
|};
*/

export const emptyBranchState/*: BranchState*/ = {
  path: [],
  context: {}
};
export const createEmptyCommit = (branch/*: BranchState*/ = emptyBranchState)/*: Commit*/ => ({
  id: createId(),
  path: branch.path,
  version: createId(),
  element: deadElement,
  children: [],
  pruned: true,
  suspension: null,
});
const deadElement = createElement('act:dead');


export const createCommitService = (
  componentService/*: ComponentService*/,
  contextService/*: ContextService*/,
  boundaryService/*: BoundaryService*/,
)/*: CommitService*/ => {

  const elementHasKey = (element) => {
    return (
      typeof element.props.key !== 'undefined' &&
      element.props.key !== null
    )
  }
  
  const isEqual = ([commitIndex, commit], [elementIndex, element]) => {
    const prevHasKey = elementHasKey(commit.element);
    const nextHasKey = elementHasKey(element);
  
    const isSameElement = commit.element.id === element.id;
    const isSameType = commit.element.type === element.type;
    const isSameKey = commit.element.props.key === element.props.key;
    const isSameIndex = commitIndex === elementIndex;
  
    return (
      isSameType && (
        isSameElement ||
        (prevHasKey && nextHasKey) ?
          isSameKey : (prevHasKey || nextHasKey) ?
            false : isSameIndex
      )
    );
  };

  const calculateChanges = (prev, next)/*: [Element, ?Commit][]*/ => {
    const { moved, persisted, removed } = calculateIndexChanges(
      prev.map((c, i) => [i, c]),
      next.map((e, i) => [i, e]),
      isEqual
    );
    const nextCommitByIndex = new Map([
      ...persisted.map(nextIndex => [nextIndex, prev[nextIndex]]),
      ...moved.map(([prevIndex, nextIndex]) => [nextIndex, prev[prevIndex]])
    ])
  
    return [
      ...next.map((next, index) => [next, nextCommitByIndex.get(index) || null]),
      ...removed.map(index => [deadElement, prev[index]])
    ];
  };

  const calculateNextBranch = (prevBranch, prevCommit, element) => {
    if (!element)
      return prevBranch;
    
    const path = [...prevBranch.path, prevCommit.id];
    const branchWithPath = { ...prevBranch, path };
    switch (element.type) {
      case 'act:context':
        return contextService.calculateNextBranch(element, prevCommit, branchWithPath);
      default:
        return branchWithPath;
    }
  };
  const calculateNextChildren = (commit, nextElement, branch) => {
    const element = (nextElement || commit.element);
  
    switch (typeof element.type) {
      case 'function':
        return componentService.calculateNextChildren(commit, element, branch);
      case 'string':
        switch (element.type) {
          case 'act:dead':
            return [[], null];
          default:
            return [element.children, null];
        }
      default:
        throw new Error(`Don't know how to traverse element of this type`);
    }
  };
  const calculateNextTargets = (nextElement, commit, prevTargets, branch) => {
    const element = (nextElement || commit.element);
    const depth = branch.path.length;

    const validTargets = prevTargets.filter(ref => ref.path[depth] === commit.id);

    switch (element.type) {
      case 'act:context':
        return [...contextService.calculateNextTargets(element, commit), ...validTargets];
      default:
        return validTargets;
    }
  }

  const remove = (prev) => {
    if (typeof prev.element.type === 'function')
      componentService.teardownComponent(prev);
  
    const diffs = prev.children.map(remove);

    const next = {
      ...prev,
      version: createId(),
      pruned: true,
      children: [],
    };
    return { prev, next, diffs };
  }
  const skip = (prev) => {
    return { prev, next: prev, diffs: [] };
  }
  const climb = (prev, targets, branch) => {
    const nextBranch = calculateNextBranch(branch, prev, prev.element);
    const diffs = prev.children.map(prev =>
      render({ prev, targets }, nextBranch));

    const commit = {
      ...prev,
      version: createId(),
      children: diffs.map(d => d.next).filter(c => !c.pruned),
    };
    return { prev, next: commit, diffs };
  };

  const render = ({ prev, element, targets }/*: Change*/, branch/*: BranchState*/ = emptyBranchState)/*: CommitDiff*/ => {
    const isTarget = targets.find(target => target.id === prev.id);

    const newElement = element && (element.id !== prev.element.id);
    const destroyingElement = element && element.type === 'act:dead';

    const validTargets = calculateNextTargets(element, prev, targets, branch)

    const requiresRender = newElement || destroyingElement || isTarget;

    if (!requiresRender)
      if (validTargets.length === 0)
        return skip(prev);
      else
        return climb(prev, validTargets, branch);

    if (destroyingElement)
      return remove(prev);

    const nextElement = element || prev.element;

    const nextBranch = calculateNextBranch(branch, prev, nextElement);
    const [nextChildren, nextSuspension] = calculateNextChildren(prev, nextElement, nextBranch);

    const prevChildren = calculateChanges(prev.children, nextChildren)

    const diffs = prevChildren.map(([element, commit]) =>
      render({ element, prev: commit || createEmptyCommit(nextBranch), targets: validTargets }, nextBranch));

      /*
    const boundaryDiff = boundaryService.tryBoundaryCommit(ref, change, diffs, branch, render);
    if (boundaryDiff)
      return boundaryDiff;
*/
    const next = {
      ...prev,
      pruned: false,
      version: createId(),
      element: nextElement,
      //suspension: result.suspension || diffs.map(d => d.next.suspension).find(Boolean) || null,
      children: diffs.map(d => d.next).filter(c => !c.pruned)
    };

    return { prev, next, diffs };
  };

  return {
    render,
  };
};
