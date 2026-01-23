import { CommitID, Reconciler2, Scheduler } from '@lukekaalim/act-recon';
import { Root } from 'hast';
import { createHASTBuilder } from '../hast';
import { RenderSpace2 } from '@lukekaalim/act-backstage';
import { convertNodeToElement, createElement, Node, primitiveNodeTypes, specialNodeTypes } from '@lukekaalim/act';
import { HTML } from '../space';


const createImmediateScheduler = async (): Promise<Scheduler> => {
  const { nextTick } = await import('node:process');

  let needs_callback = false;
  let callback_pending = false;
  let callback = () => {};

  const run = () => {
    while (needs_callback) {
      needs_callback = false;
      callback();
    }
    callback_pending = false
  }

  return {
    setCallbackFunc(nextCallback) {
      callback = nextCallback;
    },
    requestCallback() {
      needs_callback = true;
      if (!callback_pending) {
        callback_pending = true;
        nextTick(run)
      }
    },
    cancelCallback() {
      needs_callback = false;
    },
    isCallbackPending() {
      return needs_callback;
    },
  }
}

export type DehydratedCommit = {
  id: CommitID,
  elementType: string,
  parent: CommitID | null,
  distance: number,
  key: string | null,
  children: CommitID[],
  props: [string, string][],
}

export type DehydratedBundle = {
  commits: DehydratedCommit[],
  mountId: CommitID,
}

export const dehydrate = async (node: Node, done: null | Promise<void> = null) => {
  const root: Root = { type: 'root', children: [] }
  const element = convertNodeToElement(node);

  const scheduler = await createImmediateScheduler();
  const reconciler = new Reconciler2(scheduler);
  const space = new RenderSpace2(reconciler.tree, createHASTBuilder(root));

  await new Promise<void>(r => {
    reconciler.bus = {
      render(delta) {
        space.bus.render(delta);
        r();
      },
    }
    
    reconciler.mount(createElement(HTML, {}, element));
  });
  if (done)
    await done;


  const commits: DehydratedCommit[] = [];
  let mountId: CommitID | null = null;

  const primitiveMap = {
    [primitiveNodeTypes.string]: 'primitive:string',
    [primitiveNodeTypes.number]: 'primitive:number',
    [primitiveNodeTypes.null]: 'primitive:null',
    [primitiveNodeTypes.boolean]: 'primitive:boolean',
    [primitiveNodeTypes.array]: 'primitive:array',

    [specialNodeTypes.placeholder]: 'special:placeholder',
    [specialNodeTypes.render]: 'special:render',
  }

  for (const commit of  reconciler.tree.commits.values()) {
    const elementType =
      typeof commit.element.type === 'symbol'
        ? primitiveMap[commit.element.type] || 'unsupported type'
        : typeof commit.element.type === 'string'
        ? commit.element.type
        : 'special:placeholder'

    const dehydrated: DehydratedCommit = {
      id: commit.ref.id,
      elementType,
      parent: commit.ref.parent && commit.ref.parent.id || null,
      key: commit.element.props['key'] as string || null,
      children: commit.children.map(ref => ref.id),
      distance: commit.ref.length,
      props: [],
    };
    if (commit.element.type === specialNodeTypes.render) {
      console.log(commit.element)
      dehydrated.props.push(['type', commit.element.props.type as string])
    }

    if (commit.element.id === element.id) {
      mountId = commit.ref.id;
    }
    commits.push(dehydrated);
  }
  if (!mountId)
    throw new Error();

  const bundle: DehydratedBundle = {
    mountId,
    commits,
  }

  return { bundle, root };
}