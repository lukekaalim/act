import { CommitService2 } from "./commit3.js";
import { ComponentService2 } from "./component2.js";
import { ContextService2 } from "./context2.js";
import { DiffService } from "./diff.js";
import { Scheduler2 } from "./scheduler2.js";
import { TreeService2 } from "./tree2.js";

export type Reconciler = {
  tree: TreeService2,
  diff: DiffService,
  commit: CommitService2,
  component: ComponentService2,
  context: ContextService2,
}

export declare function createReconciler(scheduler: Scheduler2): Reconciler;