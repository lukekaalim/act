// @flow strict
/*::
import type { Element } from "@lukekaalim/act";
import type { ComponentService2 } from "./component2";
import type { EffectRegistry } from "./effect";
*/

import { createId } from "@lukekaalim/act";
import { calculateIndexChanges } from "./util.js";

/*::
export type CommitID3 = string;
export type CommitVersion = string;
export type CommitRef3 = {
  id: CommitID3,
  path: CommitID3[]
};

export type CommitState3 =
  | 'pruned'
  | 'suspended'
  | 'attached';

export type Commit3 = CommitRef3 & {
  version: CommitVersion,
  element: Element,
  children: CommitID3[],
  state: CommitState3
}

export type CommitChange3 = 
  | { type: 'create', element: Element, commit: CommitRef3 }
  | { type: 'remove', commit: Commit3 }
  | { type: 'update', targets: CommitRef3[], commit: Commit3, element: Element }

export type CommitChangeResult3 = {
  changes: $ReadOnlyArray<CommitChange3>,
  commit: Commit3,
}

export type CommitMap = {
  map: Map<CommitID3, Commit3>,
  get: (commitId: CommitID3) => Commit3,

  append: (commit: Commit3) => void,
  clone: () => CommitMap
}
*/
class MissingCommit extends Error {}

export const createCommitMap = (map/*: Map<CommitID3, Commit3>*/ = new Map())/*: CommitMap*/ => {
  const get = (commitId) => {
    const commit = map.get(commitId);
    if (!commit)
      throw new MissingCommit(commitId);
    return commit;
  };
  const append = (commit) => {
    switch (commit.state) {
      case 'attached':
      case 'suspended':
      default:
        return void map.set(commit.id, commit);
      case 'pruned':
        return void map.delete(commit.id);
    }
  };
  const clone = () => {
    return createCommitMap(new Map(map));
  }
  return { get, append, clone, map };
}

const getElementKey = (element, index) => {
  const key = element.props.key;
  if (key && (typeof key === 'string' || typeof key === 'number'))
    return [element.type, 'key', key.toString()]
  return [element.type, 'index', index]
}

/**
 * Saucy function. Given a previous commit, and a new batch of children,
 * marry up new children with their old state, if they match. Generate
 * "changes" for each child, depening on if they were just created, or
 * if they were updated or deleted.
 */
const calculateElementChanges = (
  prev/*: Commit3*/,
  next/*: $ReadOnlyArray<Element>*/,
  commitMap/*: CommitMap*/,
  targets/*: CommitRef3[]*/,
)/*: $ReadOnlyArray<CommitChange3>*/ => {
  const prevCommits = prev.children.map(commitMap.get);
  const prevKeys = prevCommits.map((commit, index) => getElementKey(commit.element, index));
  const nextKeys = next.map((element, index) => getElementKey(element, index));

  const { removed, persisted, moved } = calculateIndexChanges(prevKeys, nextKeys, (keyA, keyB) =>
    keyA[0] === keyB[0] &&
    keyA[1] === keyB[1] &&
    keyA[2] === keyB[2]
  );
  const nextCommitByIndex = new Map([
    ...persisted.map(nextIndex => [nextIndex, prev.children[nextIndex]]),
    ...moved.map(([prevIndex, nextIndex]) => [nextIndex, prev.children[prevIndex]])
  ]);

  return [
    ...removed.map(i => ({
      type: 'remove',
      commit: prevCommits[i],
    })),
    ...next.map((element, index) => {
      const elementPrevCommitId = nextCommitByIndex.get(index);
      if (!elementPrevCommitId)
        return { type: 'create', element, commit: createChildRef(prev) };
      const elementPrevCommit = commitMap.get(elementPrevCommitId);
      return { type: 'update', element, commit: elementPrevCommit, targets };
    })
  ]
}

const createChildRef = (parent/*: Commit3 | CommitRef3*/)/*: CommitRef3*/ => ({
  path: [...parent.path, parent.id],
  id: createId()
});

const isOnTargetPath = (change) => change.targets.some(target => target.path.includes(change.commit.id));
const isTarget = (change) => change.targets.some(target => target.id === change.commit.id);
const isSameElement = (change) => change.commit.element.id === change.element.id;

/*::
export type CommitService2 = {
  submit: (
    change: CommitChange3,
    map: CommitMap,
    effect: EffectRegistry,
  ) => CommitChangeResult3,
};
*/
export const createCommitService2 = (component/*: ComponentService2*/)/*: CommitService2*/ => {

  const createCommit = (
    element/*: Element*/,
    ref/*: CommitRef3*/,
    effect/*: EffectRegistry*/,
  )/*: CommitChangeResult3*/ => {
    const nextElements = component.render(ref, element, effect);
    const childPairs = nextElements.map(element => ({
      element,
      commit: createChildRef(ref)
    }))
    return {
      commit: {
        ...ref,
        state: 'attached',
        version: createId(),
        element,
        children: childPairs.map(c => c.commit.id),
      },
      changes: childPairs
        .map(({ element, commit }) => ({ type: 'create', element, commit })),
    }
  };

  const pruneCommit = (
    prev/*: Commit3*/,
    commitMap/*: CommitMap*/,
    effect/*: EffectRegistry*/,
  )/*: CommitChangeResult3*/ => {
    component.remove(prev, effect);
    return {
      commit: {
        ...prev,
        state: 'pruned',
        version: createId(),
        element: prev.element,
        children: [],
      },
      changes: prev.children
        .map(commitMap.get)
        .map(commit => ({ type: 'remove', commit }))
    }
  };

  const updateCommit = (
    prev/*: Commit3*/,
    element/*: Element*/,
    commitMap/*: CommitMap*/,
    targets/*: CommitRef3[]*/,
    effect/*: EffectRegistry*/
  )/*: CommitChangeResult3*/ => {
    const nextElements = component.render(prev, element, effect);
    const changes = calculateElementChanges(prev, nextElements, commitMap, targets);
    return {
      commit: {
        ...prev,
        version: createId(),
        element,
        children: changes
          .filter(c => ['create', 'update'].includes(c.type))
          .map(c => c.commit.id),
      },
      changes,
    };
  };

  /**
   * Commit "Traversal" is when you visit a commit
   * mostly just to update it's children. You don't
   * need to change anything about the commit itself
   * except for the version.
   */
  const traverseCommit = (
    prev/*: Commit3*/,
    targets/*: CommitRef3[]*/,
    commitMap/*: CommitMap*/,
  )/*: CommitChangeResult3*/ => ({
    commit: {
      ...prev,
      version: createId(),
      children: prev.children,
      element: prev.element,
    },
    changes: prev.children
      .map(commitMap.get)
      .map(commit => ({
        type: 'update',
        commit,
        targets,
        element: commit.element
      }))
  })
  /**
   * Commit "Termination" just means that there
   * are no more interesting changes in this commit,
   * or it's children and you can stop checking for updates.
   */
  const terminateCommit = (
    commit/*: Commit3*/
  )/*: CommitChangeResult3*/ => ({
    commit,
    changes: []
  })

  const submit = (change, commitMap, effect) => {
    switch (change.type) {
      case 'create':
        return createCommit(change.element, change.commit, effect);
      case 'remove':
        return pruneCommit(change.commit, commitMap, effect);
  
      case 'update':
        if (isSameElement(change) && !isTarget(change)) {
          if (isOnTargetPath(change)) {
            return traverseCommit(change.commit, change.targets, commitMap);
          } else {
            return terminateCommit(change.commit);
          }
        }
        return updateCommit(change.commit, change.element, commitMap, change.targets, effect);
    }
  };

  return { submit };
}
