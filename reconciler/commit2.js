// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
import { createId } from '@lukekaalim/act';
import { calculatePersisted } from './diff.js';
import { elementsAreEqual } from './element.js';
import { generateStateID, generateStatePath } from './state2.js';
/*:: import type { ComponentService } from './component.js'; */
/*:: import type { ContextService } from './context.js'; */
/*:: import type { StateID, StatePath } from './state2.js'; */

/*::
export opaque type CommitID: string = string;

export type Commit = {|
  commitId: CommitID,
  stateId: StateID,
  statePath: StatePath,

  element: Element,
  children: $ReadOnlyArray<Commit>,
|};
*/
export const createCommitId = ()/*: CommitID*/ => createId();

/*::
export type CreateDiff = {|
  type: 'create',
  stateId: StateID,
  prev: null, next: Commit,
  children: $ReadOnlyArray<CommitDiff>
|};
export type UpdateDiff = {|
  type: 'update',
  stateId: StateID,
  prev: Commit, next: Commit,
  children: $ReadOnlyArray<CommitDiff>
|};
export type PersistDiff = {|
  type: 'persist',
  stateId: StateID,
  curr: Commit,
|};
export type RemoveDiff = {|
  type: 'remove',
  stateId: StateID,
  prev: Commit, next: null,
  children: $ReadOnlyArray<CommitDiff>,
|};

export type CommitDiff = 
  | CreateDiff
  | UpdateDiff
  | PersistDiff
  | RemoveDiff
*/
export const getStateId = (statePath/*: StatePath*/)/*: StateID*/ => statePath[statePath.length - 1];

const createDiff = (
  next/*: Commit*/,
  children/*: $ReadOnlyArray<CommitDiff>*/
)/*: CreateDiff*/ => ({
  type: 'create',
  stateId: next.stateId,
  prev: null, next,
  children,
});
const updateDiff = (
  prev/*: Commit*/,
  next/*: Commit*/,
  children/*: $ReadOnlyArray<CommitDiff>*/
)/*: UpdateDiff*/ => ({
  type: 'update',
  stateId: next.stateId,
  prev, next,
  children,
});
const persistDiff = (
  curr/*: Commit*/,
)/*: PersistDiff*/ => ({
  type: 'persist',
  stateId: curr.stateId,
  curr,
});
export const removeDiff = (
  prev/*: Commit*/,
  children/*: $ReadOnlyArray<CommitDiff>*/
)/*: RemoveDiff*/ => ({
  type: 'remove',
  stateId: prev.stateId,
  prev, next: null,
  children,
});

/*::
export type CommitService = {|
  create: (element: Element, parentPath?: StatePath) => CreateDiff,
  updateWithElement: (prev: Commit, element: Element) => UpdateDiff,
  updateWithState: (prev: Commit, path: StatePath) => UpdateDiff,
  remove: (prev: Commit) => RemoveDiff,
|};
*/

export const createCommitService = (componentService/*: ComponentService*/, contextService/*: ContextService*/)/*: CommitService*/ => {
  const traverse = (path, element) => {
    if (element.type === 'act:context')
      contextService.traverseProviderElement(path, element);
    
    if (typeof element.type === 'string')
      return element.children;
  
    return componentService.traverseComponent(path, element.type, element.props, element.children);
  };

  const create = (element/*: Element*/, parentPath/*:: ?: StatePath*/)/*: CreateDiff*/ => {
    const stateId = generateStateID()
    const commitId = createCommitId();
    const statePath = generateStatePath(stateId, parentPath);

    const elementChildren = traverse(statePath, element);
    
    const diffChildren = elementChildren.map(childElement => create(childElement, statePath));
    const commitChildren = diffChildren.map(c => c.next);
  
    const commit = {
      commitId,
      stateId,
      statePath,

      element,
      children: commitChildren,
    };
    return createDiff(commit, diffChildren);
  };
  const updateWithElement = (prev/*: Commit*/, element/*: Element*/)/*: UpdateDiff*/ => {
    const commitId = createCommitId();
    const childElements = traverse(prev.statePath, element);
    const persisted = calculatePersisted(prev.children, childElements);
    const removed = prev.children
      .filter(c => !persisted.has(c.element.id))
      .map(c => remove(c));

    // Build diffs for elements created or updated
    const createdOrUpdated = childElements
      .map(element => {
        const persistedElement = persisted.get(element.id);
        if (persistedElement)
          if (elementsAreEqual(persistedElement.prev, persistedElement.next))
            return persistDiff(persistedElement.commit);
          else
            return updateWithElement(persistedElement.commit, persistedElement.next);
        else
          return create(element, prev.statePath);
      });

    const next/*: Commit*/ = {
      ...prev,
      element,
      commitId,
      children: createdOrUpdated.map(d => d.next || d.curr),
    };
    
    return updateDiff(prev, next, [...removed, ...createdOrUpdated]);
  };
  const updateWithState = (prev/*: Commit*/, path/*: StatePath*/)/*: UpdateDiff*/ => {
    const commitId = createCommitId();
    const stateId = getStateId(path);
    // Trigger re-render
    if (prev.stateId === stateId)
      return updateWithElement(prev, prev.element);
    
    // Check if child may be part of state
    const updated = prev.children
      .map(c => path.includes(c.stateId) ? updateWithState(c, path) : persistDiff(c));
    // Build a commit 
    const next = {
      ...prev,
      commitId,
      children: updated.map(d => d.next || d.curr)
    };

    return updateDiff(prev, next, updated)
  };
  const remove = (prev/*: Commit*/)/*: RemoveDiff*/ => {
    if (typeof prev.element.type === 'function')
      componentService.teardownComponent(prev.statePath);
    
    if (prev.element.type === 'act:context')
      contextService.traverseProviderElement(prev.statePath, prev.element);

    const children = prev.children.map(childCommit => remove(childCommit));

    return removeDiff(prev, children);
  };

  return {
    create,
    updateWithElement,
    updateWithState,
    remove,
  };
};
