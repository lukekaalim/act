// @flow strict
/*::
import type { CommitService2 } from "./commit3";
import type { ComponentService2 } from "./component2";
import type { ContextService2 } from "./context2";
import type { DiffService } from "./diff";
import type { Scheduler2 } from "./scheduler2";
import type { TreeService2 } from "./tree2";
*/

import { createCommitService2 } from "./commit3.js";
import { createComponentService } from "./component2.js";
import { createContextService2 } from "./context2.js";
import { createDiffService } from "./diff.js";
import { createTreeService2 } from "./tree2.js";

/*::
export type Reconciler = {
  tree: TreeService2,
  diff: DiffService,
  commit: CommitService2,
  component: ComponentService2,
  context: ContextService2,
}
*/

export const createReconciler = (scheduler/*: Scheduler2*/)/*: Reconciler*/ => {
  const updateCommit = (ref) => {
    tree.update(ref);
  };

  const context = createContextService2();
  const component = createComponentService(context, updateCommit);
  const commit = createCommitService2(component);

  const diff = createDiffService(commit, context, scheduler);
  const tree = createTreeService2(diff);

  return {
    context,
    component,
    commit,
    diff,
    tree
  };
}