// @flow strict
/*::
import type { Element } from "@lukekaalim/act";
import type { Commit3, CommitID3 } from "@lukekaalim/act-reconciler";
import type { Assertion } from "@lukekaalim/test";
*/

import { h } from "../../library/element.js";
import { createId } from "../../library/ids.js";
import { createCommitMap, createEffectRegistry, createCommitService2 } from '@lukekaalim/act-reconciler';
import { assert } from "@lukekaalim/test";

const createTestCommit = (element/*: Element*/, children/*: CommitID3[]*/ = [])/*: Commit3*/ => ({
  id: createId(),
  path: [],
  version: createId(),
  state: 'attached',
  children,
  element,
})

export const testCommitService = ()/*: Assertion*/ => {
  const element = h('subject', { key: 0 });
  const children = [
    createTestCommit(element),
    createTestCommit(h('child:a', { key: '2' })),
  ];
  const commit = createTestCommit(element, children.map(c => c.id));
  const map = createCommitMap(new Map([
    commit,
    ...children,
  ].map(c => [c.id, c])));
  
  const change = {
    type: 'remove',
    commit,
    element: h('subject', { key: 0 }, [h('child'), h('child')]),
    targets: []
  }
  const component = {
    remove: () => void 0,
    render: (c, el) => el.children,
  }
  const service = createCommitService2(component);
  const effect = createEffectRegistry();
  const diff = service.submit(change, map, effect);
  return assert('commit', [
    //assertCommitService(service)
  ]);
};

const assertCommitService = (service) => {
  const assertNoChanges = () => {
    const effect = createEffectRegistry();
    const commits = createCommitMap();
    const element = h('root');
    const commit = createTestCommit(element)
    commits.append(commit);
    const change = {
      type: 'update',
      element,
      commit: commit,
      targets: [],
    };
    const diff = service.submit(change, commits, effect)
    return assert('assertNoChanges', diff.commit.version === commit.version);
  };
  const assertRemoved = () => {
    return assert('assertRemoved', false);
  };
  const assertCreated = () => {
    return assert('assertCreated', false);
  }

  return assert('assertCommitService', [
    assertNoChanges(),
    assertRemoved(),
    assertCreated()
  ])
}
