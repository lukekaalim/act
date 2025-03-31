import { CommitTree, createReconciler, Scheduler, WorkID, WorkThread } from "@lukekaalim/act-recon";
import { createId, Node } from "@lukekaalim/act";
import { RenderSpace } from "@lukekaalim/act-backstage";
import { DebugOptions, getDebuggerClient } from "./channel";
import { recon } from "@lukekaalim/act-three/deps";

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

export const renderDebug = async (node: Node, createSpace: (tree: CommitTree) => RenderSpace) => {
  const debug = await getDebuggerClient();
  let options: DebugOptions = {
    stepWork: true,
  };
  
  const debugScheduler = createDebugScheduler();

  debug.on('work:perform', () => debugScheduler.work());

  const reconciler = createReconciler(debugScheduler.inner);

  reconciler.on('on-thread-start', thread => {
    debug.startThread(WorkThread.clone(thread));
  });
  reconciler.on('on-thread-update', thread => {
    if (options.stepWork)
      debug.updateThread(WorkThread.clone(thread));
  });

  const threadCompleteSub = reconciler.on('on-thread-complete', (thread: WorkThread) => {
    debug.finishThread(WorkThread.clone(thread));
    space.create(thread.deltas).configure();
  });

  const space = createSpace(reconciler.tree);

  debug.ready();
  
  reconciler.mount(node);

  return {
    stop() {
      threadCompleteSub.cancel();
    },
  }
};
