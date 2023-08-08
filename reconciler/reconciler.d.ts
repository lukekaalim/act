import { CommitService2 } from "./commit3";
import { ComponentService2 } from "./component2";
import { ContextService2 } from "./context2";
import { DiffService } from "./main";
import { Scheduler2 } from "./scheduler2";
import { TreeService2 } from "./tree2";

export type Reconciler = {
  tree: TreeService2,
  diff: DiffService,
  commit: CommitService2,
  component: ComponentService2,
  context: ContextService2,
}

declare export function createReconciler(scheduler: Scheduler2): Reconciler;