import { CommitTree, createReconciler, Scheduler, WorkThread } from "@lukekaalim/act-recon";
import { RenderSpace } from "./space";
import * as act from '@lukekaalim/act';

export type RenderFunction<T> = (node: act.Node, root: T) => { stop: () => void }

export const createRenderFunction = <T>(
  scheduler: Scheduler,
  createSpace: (tree: CommitTree, root: T) => RenderSpace
): RenderFunction<T> => {

  const render: RenderFunction<T> = (node: act.Node, root: T) => {
    const onThreadComplete = (thread: WorkThread) => {
      space.create(thread.deltas).configure();
    };

    const reconciler = createReconciler(scheduler);
    const threadCompleteSub = reconciler.subscribe(event => {
      switch (event.type) {
        case 'thread:complete':
          return onThreadComplete(event.thread);
      }
    })

    const space = createSpace(reconciler.tree, root);
    
    reconciler.mount(node);

    return {
      stop() {
        threadCompleteSub.cancel();
      },
    }
  };

  return render;
}