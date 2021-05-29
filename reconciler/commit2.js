// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */

import { nanoid } from 'nanoid/non-secure';
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

export type CommitDiffBase = { children: $ReadOnlyArray<CommitDiff> }

export type CreateDiff = CommitDiffBase & { prev: null, next: Commit };
export type UpdateDiff = CommitDiffBase & { prev: Commit, next: Commit };
export type RemoveDiff = CommitDiffBase & { prev: Commit, next: null };

export type CommitDiff = 
  | CreateDiff
  | UpdateDiff
  | RemoveDiff
*/
export const getStateId = (statePath/*: StatePath*/)/*: StateID*/ => statePath[statePath.length - 1];

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
    const commitId = nanoid(8);
    const statePath = generateStatePath(stateId, parentPath);

    const elementChildren = traverse(statePath, element);
    
    const diffChildren = elementChildren.map(childElement => create(childElement, statePath));
    const commitChildren = diffChildren.map(c => c.next).filter(Boolean);
  
    const commit = {
      commitId,
      stateId,
      statePath,

      element,
      children: commitChildren,
    };
    return {
      prev: null,
      next: commit,
      children: diffChildren,
    };
  };
  const updateWithElement = (prev/*: Commit*/, element/*: Element*/)/*: UpdateDiff*/ => {
    const commitId = nanoid(8);
    // Get new elements
    const childElements = traverse(prev.statePath, element);
    // See if we can re-use any
    const persisted = calculatePersisted(prev.children, childElements);
    // Build diffs for elements removed
    const removed = prev.children
      .filter(c => !persisted.has(c.element.id))
      .map(c => remove(c));
    // Build diffs for elements created or updated
    const createdOrUpdated = childElements
      .map(e => {
        const persistedElement = persisted.get(e.id);
        if (persistedElement)
          if (elementsAreEqual(persistedElement.prev, persistedElement.next))
            return ({
              prev: persistedElement.commit,
              next: persistedElement.commit,
              children: []
            }/*: UpdateDiff*/);
          else
            return updateWithElement(persistedElement.commit, persistedElement.next);
        return create(e, prev.statePath);
      });

    const nextCommit/*: Commit*/ = {
      ...prev,
      element,
      commitId,
      children: createdOrUpdated.map(d => d.next),
    };
    
    return {
      prev,
      next: nextCommit,
      children: [...removed, ...createdOrUpdated],
    }
  };
  const updateWithState = (prev/*: Commit*/, path/*: StatePath*/)/*: UpdateDiff*/ => {
    const commitId = nanoid(8);
    const stateId = getStateId(path);
    // Trigger re-render
    if (prev.stateId === stateId)
      return updateWithElement(prev, prev.element);
    
    // Check if child may be part of state
    const updated/*: UpdateDiff[]*/ = prev.children
      .map(c => path.includes(c.stateId) ?
        updateWithState(c, path) :
        { prev: c, next: c, children: [] });
    // Build a commit 
    const commit = {
      ...prev,
      commitId,
      children: updated.map(d => d.next)
    };

    return {
      prev,
      next: commit,
      children: updated,
    }
  };
  const remove = (prev/*: Commit*/)/*: RemoveDiff*/ => {
    if (prev.element.type === 'function')
      componentService.teardownComponent(prev.statePath);
    
    if (prev.element.type === 'act:context')
      contextService.traverseProviderElement(prev.statePath, prev.element);

    const children = prev.children.map(childCommit => remove(childCommit));

    return {
      prev,
      next: null,
      children,
    }
  };

  return {
    create,
    updateWithElement,
    updateWithState,
    remove,
  };
};
