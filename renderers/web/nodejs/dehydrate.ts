import { CommitID, Reconciler2, Scheduler } from '@lukekaalim/act-recon';
import { Root } from 'hast';
import { createHASTBuilder } from '../hast';
import { RenderSpace2 } from '@lukekaalim/act-backstage';
import { Component, ContextID, convertNodeToElement, createElement, Element, h, Node, primitiveNodeTypes, specialNodeTypes } from '@lukekaalim/act';
import { HTML } from '../space';
import { createTickScheduler } from './TickScheduler';
import {
  DehydratedCommit, RehydratableComponent, RehydratableProps, 
  serializeSSRContext, SSRContext, ssrSymbolToStringMap
} from '../ssr';

export const dehydrate = async (
  node: Node,
  targets: { [key: string]: RehydratableComponent }
) => {
  const reverseTargetMap = new Map<RehydratableComponent, string>(
    Object.entries(targets).map(([key, component]) => [component, key])
  )

  const root: Root = { type: 'root', children: [] }

  const scheduler = createTickScheduler();
  const reconciler = new Reconciler2(scheduler);
  const space = new RenderSpace2(reconciler.tree, createHASTBuilder(root));
  reconciler.bus = space.bus;

  const ssrContext: SSRContext = {
    components: new Map(),
    contexts: new Map(),
    commits: new Map(),
    mounts: [],

    mode: 'server',
    contextCommitID: null,
    readyForServer() {}
  };
  const readyPromise = new Promise<void>(resolve => {
    ssrContext.readyForServer = resolve
  });
  reconciler.mount(createElement(HTML, {}, h(SSRContext.Provider, { value: ssrContext }, node)));

  // Either use the user-provided promise,
  // or just wait until we finish rendering
  await readyPromise;
  
  const serializeElementType = (element: Element) => {
    switch (typeof element.type) {
      case 'symbol':
        return ssrSymbolToStringMap[element.type] || 'special:unknown';
      case 'function':
        if (reverseTargetMap.has(element.type as RehydratableComponent))
          return 'special:target:' + reverseTargetMap.get(element.type as RehydratableComponent) as string;
        return 'special:placeholder';
      case 'string':
        return element.type;
      default:
        throw new Error(`Cannot serialize element type "${typeof element.type}"`);
    }
  }

  for (const commit of  reconciler.tree.commits.values()) {
    const dehydrated: DehydratedCommit = {
      id: commit.ref.id,
      elementType: serializeElementType(commit.element),
      parent: commit.ref.parent && commit.ref.parent.id || null,
      key: commit.element.props['key'] as string || null,
      children: commit.children.map(ref => ref.id),
      distance: commit.ref.length,
      props: [],
    };
    if (commit.element.type === specialNodeTypes.render) {
      dehydrated.props.push(['type', commit.element.props.type as string])
    }
    if (commit.element.type === specialNodeTypes.provider) {
      if (commit.element.props.id as ContextID === SSRContext.id) {
        ssrContext.contextCommitID = commit.ref.id;
      }
    }
    if (reverseTargetMap.has(commit.element.type as RehydratableComponent)) {
      const name = reverseTargetMap.get(commit.element.type as RehydratableComponent) as string;

      dehydrated.elementType = `special:mount:${name}`
      const props = commit.element.props as RehydratableProps;
      for (const [key, value] of Object.entries(props)) {
        dehydrated.props.push([key, value])
      }
    }

    ssrContext.commits.set(dehydrated.id, dehydrated);
  }

  const payload = serializeSSRContext(ssrContext);

  return { payload, root };
}