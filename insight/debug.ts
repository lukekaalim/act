import { Commit, CommitTree, createReconciler, Scheduler, WorkID, WorkThread } from "@lukekaalim/act-recon";
import { createId, h, Node } from "@lukekaalim/act";
import { createRenderFunction, RenderFunction, RenderSpace } from "@lukekaalim/act-backstage";
import { createDOMScheduler, createWebSpace, HTML, render } from "@lukekaalim/act-web";
import { InsightApp } from "./InsightApp";

export type DebugScheduler = {
  isWorkPending(): boolean,
  work(): void,

  inner: Scheduler,
}

export const createDebugScheduler = (): DebugScheduler => {
  const pending = new Map<WorkID, () => void>();

  const inner: Scheduler = {
    requestWork(callback) {
      const id = createId<'WorkID'>();
      pending.set(id, callback);
      return id;
    },
    cancelWork(workId) {
      pending.delete(workId)
    },
  }

  return {
    isWorkPending() {
      return pending.size > 0;
    },
    work() {
      const pendingWork = [...pending];
      pending.clear();
      for (const [,callback] of pendingWork)
        callback();
    },
    inner,
  }
}

export const renderDebug = (node: Node, createSpace: (tree: CommitTree) => RenderSpace) => {
  const debugScheduler = createDebugScheduler();

  const reconciler = createReconciler(debugScheduler.inner);

  const threadCompleteSub = reconciler.on('on-thread-complete', (thread: WorkThread) => {
    space.create(thread.deltas).configure();
  });

  const space = createSpace(reconciler.tree);

  const onReady = () => {
    reconciler.mount(node);
  };

  const debugWindow = window.open('', 'debug', 'popup');
  if (debugWindow) {
    const node = h(InsightApp, { reconciler, onReady, scheduler: debugScheduler });
    const root = debugWindow.document.body;
    for (const child of [...debugWindow.document.body.children, ...debugWindow.document.head.children])
      child.remove()

    for (const child of document.head.children) {
      if (child instanceof HTMLStyleElement) {
        debugWindow.document.head.append(child.cloneNode(true));
      }
    }
    const renderWeb = createRenderFunction<HTMLElement>(
      createDOMScheduler(),
      (tree, root) => createWebSpace(tree, root, debugWindow)
    )(h(HTML, {}, node), root);
  }

  return {
    stop() {
      threadCompleteSub.cancel();
    },
  }
};
