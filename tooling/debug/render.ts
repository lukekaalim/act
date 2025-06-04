import { CommitTree, createReconciler, Scheduler, WorkID, WorkThread } from "@lukekaalim/act-recon";
import { createId, Node } from "@lukekaalim/act";
import { RenderSpace } from "@lukekaalim/act-backstage";
import { createPostMessageClient } from "./channel";
import { recon } from "@lukekaalim/act-three/deps";
import { createDebuggerClient, DebuggerClient, DebugOptions } from "./protocol";
import { createDOMScheduler } from "@lukekaalim/act-web";
import { createCommitStateReport, createThreadReport } from "./report";

export type DebugScheduler = {
  isWorkPending(): boolean,
  work(): void,

  inner: Scheduler,
}

export const renderDebug = async (node: Node, createSpace: (tree: CommitTree) => RenderSpace) => {
  const debug = createDebuggerClient(createPostMessageClient(
    '@lukekaalim/act-debug:debugger',
    '@lukekaalim/act-debug:target',
  ));

  let options: DebugOptions = {
    stepWork: true,
  };
  
  const scheduler = createDOMScheduler();
  const reconciler = createReconciler(scheduler);
  const space = createSpace(reconciler.tree);

  reconciler.subscribe(event => {
    switch (event.type) {
      case 'thread:new-root':
        debug.rootUpdate([...reconciler.tree.roots]);
        break;
      case 'thread:complete':
        debug.finishThread(createThreadReport(event.thread));
        space.create(event.thread.deltas).configure();
        break;
      case 'thread:start':
        //debug.startThread(event.thread);
        break;
      case 'thread:update':
        //debug.updateThread(event.thread);
        break;
    }
  });
  debug.subscribe(event => {
    switch (event.type) {
      case 'work:perform':
        //debugScheduler.work();
        break;
      case 'debug:options':
        options = event.options;
        break;
      case 'commit-state:request':
        const commit = reconciler.tree.commits.get(event.commitId);
        const componentState = reconciler.tree.components.get(event.commitId);
        if (!commit)
          return;
        debug.commitState(createCommitStateReport(commit, componentState), commit.id);
        break;
    }
  });

  await new Promise<void>(r => {
    const sub = debug.subscribe(e => {
      switch (e.type) {
        case 'server:accept':
          sub.cancel();
          r();
          break;
        case 'server:ready':
          debug.ready();
          break;
      }
    });
    debug.ready();
  });

  reconciler.mount(node);

  return {
    stop() {
      
    },
  }
};
