// @flow strict
/*:: import type { Element, ElementType, ContextID } from '@lukekaalim/act'; */
import { createElement, createId } from '@lukekaalim/act';
/*:: import type { ComponentService, ComponentState } from './component.js'; */
/*:: import type { ContextState, ContextService } from './context.js'; */

/*::
export type CommitID = string;
export type CommitPath = CommitID[];
export type CommitVersion = string;

export type CommitRef = {
  id: CommitID,
  path: CommitPath
};
export type Commit = {
  ...CommitRef,

  pruned: boolean,
  version: CommitVersion,
  element: Element,
  children: $ReadOnlyArray<Commit>,
};
*/
const emptyCommit/*: Commit*/ = {
  id: createId(),
  path: [],
  version: createId(),
  element: createElement('act:dead'),
  children: [],
  pruned: true,
};

/*::
export type CommitDiff = {|
  +prev: Commit,
  +next: Commit,
  +diffs: $ReadOnlyArray<CommitDiff>,
|}
*/

/*::
export type BranchState = {|
  path: CommitPath,
  context: Map<ContextID, ContextState<mixed>>,
|};

export type StateChange =
  | {| +ref: CommitRef, +prev: Commit |};
export type CreateElementChange = {| +element: Element, +prev: null |};
export type UpdateElementChange = {| +element: Element, +prev: Commit |};
export type RemoveElementChange = {| +element: null, +prev: Commit |};
export type ElementChange =
  | CreateElementChange
  | UpdateElementChange
  | RemoveElementChange
export type Change =
  | ElementChange
  | StateChange

export type TraversalResult = {
  children: $ReadOnlyArray<Element>,
  branch: BranchState,
};

export type CommitService = {|
  render: (change: Change, branch?: BranchState) => CommitDiff,
|};
*/
export const emptyBranchState/*: BranchState*/ = {
  path: [],
  context: new Map(),
};
export const emptyTraversalResult/*: TraversalResult*/ = {
  children: [],
  branch: emptyBranchState,
};

export const calculateChanges = (
  change/*: Change*/,
  { children }/*: TraversalResult*/,
)/*: Change[]*/ => {
  if (!change.prev)
    return children.map(element => ({ element, prev: null }));
  // assume no changes if we're just doing a state climb
  if (change.ref && change.ref.id !== change.prev.id)
    return change.prev.children.map(prev => ({ ...change, prev }));
  if (change.element === null)
    return change.prev.children.map(prev => ({ element: null, prev }));

  const keyIndices = new Map(children.filter(t => t.props.key).map((t, i) => [t.props.key, i]));

  const nextCommits = new Map();
  const removedChanges = [];

  for (let index = 0; index < change.prev.children.length; index++) {
    const prev = change.prev.children[index];
    const keyIndex = keyIndices.get(prev.element.props.key);
    const elementByKey = (keyIndex !== undefined) && children[keyIndex];
    const elementByIndex = children[index];

    if (elementByKey && !nextCommits.has(keyIndex) && elementByKey.type === prev.element.type)
      nextCommits.set(keyIndex, prev);
    else if (elementByIndex && !nextCommits.has(index) && elementByIndex.type === prev.element.type)
      nextCommits.set(index, prev);
    else
      removedChanges.push({ element: null, prev });
  }

  const changes = [
    ...removedChanges,
    ...children.map((element, index) => ({ element, prev: nextCommits.get(index) || null }/*: any*/)),
  ]

  return changes;
};

export const createCommitService = (
  componentService/*: ComponentService*/,
  contextService/*: ContextService*/
)/*: CommitService*/ => {
  const traverse = (ref/*: CommitRef*/, change/*: Change*/, branch/*: BranchState*/)/*: TraversalResult*/ => {
    const { type } = change.element || change.prev.element;
    switch (type) {
      case 'act:context':
        return contextService.traverse(ref, change, branch);
      case 'act:string':
      case 'act:null':
        return emptyTraversalResult;
    }
    switch (typeof type) {
      case 'string':
        return {
          children: change.element ? change.element.children : [],
          branch: { ...branch, path: [...branch.path, ref.id] }
        };
      case 'function':
        return componentService.traverse(ref, change, branch);
    }
    throw new Error('Don\'t know how to traverse element of this type');
  };
  const render = (change/*: Change*/, branch/*: BranchState*/ = emptyBranchState)/*: CommitDiff*/ => {
    const ref = change.prev || { id: createId(), path: branch.path };
    
    if (change.ref && change.ref.id !== ref.id && !change.ref.path.includes(ref.id))
      return { prev: change.prev, next: change.prev, diffs: [] };

    const result = traverse(ref, change, branch);

    const changes = calculateChanges(change, result);
    const diffs = changes.map(change => render(change, { ...result.branch, path: [...result.branch.path, ref.id] }));
    const next = {
      ...ref,
      version: createId(),
      element: change.element || change.prev.element,
      // $FlowFixMe[prop-missing]
      pruned: change.element === null,
      children: diffs.map(d => d.next).filter(c => !c.pruned)
    };
    return { prev: change.prev || emptyCommit, next, diffs };
  };

  return {
    render,
  };
};
