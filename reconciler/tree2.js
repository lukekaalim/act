// @flow strict
import { h, createId } from "@lukekaalim/act";
import { createComponentService } from "./component2.js";
import { createContextService2 } from "./context2.js";
import { createCommitMap } from "./commit3.js";
import { createDiffService } from "./diff.js";
import { createEffectRegistry, createEffectService } from "./effect.js";
import { createBoundaryService, createSuspensionRegistry } from "./boundary.js";

/*::
import type { ElementNode, Element } from "@lukekaalim/act";
import type { CommitChange3, CommitRef3 } from "./commit3";
import type { Scheduler2 } from "./scheduler2";
import type { DiffService, DiffSet } from "./diff";

export type TreeService2 = {
  mount: (element: Element) => void,
  update: (commit: CommitRef3) => void,
  unmount: () => void,

  //subscribeDiff: (subscriber: (diff: DiffSet) => mixed) => () => void,
  //submitDiff: DiffSet => void,
  live: DiffSet,
};
*/

export const createTreeService2 = (
  diff/*: DiffService*/,
)/*: TreeService2*/ => {
  const rootRef = { id: createId(), path: [] };

  const mount = (element) => void diff.submitChange({
    type: 'create',
    commit: rootRef,
    element,
  }, tree.live);
  const update = (commit) => void diff.submitChange({
    type: 'update',
    commit: tree.live.nexts.get(rootRef.id),
    element: tree.live.nexts.get(rootRef.id).element,
    targets: [commit],
  }, tree.live);
  const unmount = () => void diff.submitChange({
    type: 'remove',
    commit: tree.live.nexts.get(rootRef.id),
  }, tree.live)

  diff.subscribeDiff((diff) => {
    tree.live = diff;
  });

  const initialDiffSet = {
    root: rootRef.id,
    diffs: new Map(),
    prevs: createCommitMap(),
    nexts: createCommitMap(),
    registry: createEffectRegistry(),
    suspensions: createSuspensionRegistry()
  }
  const tree = {
    mount,
    update,
    unmount,

    live: initialDiffSet,
  };
  //const context = createContextService2();
  //const component = createComponentService(context, tree)
  //const commit = createCommitService(component)
  //const diff = createDiffService(commit, context, scheduler);

  return tree;
}