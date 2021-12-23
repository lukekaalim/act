// @flow strict
/*:: import type { ElementType } from '@lukekaalim/act'; */
/*:: import type { Renderer, RenderResult } from '@lukekaalim/act-renderer-core'; */
import { createManagedRenderer } from '@lukekaalim/act-renderer-core';
import { setProps, setRef } from './prop.js';
import { createNode, removeNode, setNodeChildren } from './node.js';

export const createDOMRenderer = (
  namespace/*: string*/,
  nodeSubRenderers/*: { [type: string]: ?Renderer<Node> }*/ = {},
)/*: Renderer<Node>*/ => {
  const add = (diff)/*: null | Node*/ => {
    const node = createNode(diff.next.element, namespace);
    if (node !== null) {
      const parentId = diff.next.path[diff.next.path.length - 1];
      nodeRenderer.nodesByCommitID.get(parentId);
    }
    return node;
  }
  const remove = (node) => {
    removeNode(node);
  };
  const update = (node, diff, children) => {
    setRef(node, diff);

    if (diff.next.pruned)
      return;

    setProps(node, diff);
    setNodeChildren(diff, node, children);
  }

  const next = (diff)/*: RenderResult<Node>[]*/ => {
    const { type } = diff.next.element;
    const subrenderer = typeof type === 'string' && nodeSubRenderers[type];
    if (subrenderer) {
      return subrenderer.render(diff);
    }
    return nodeRenderer.render(diff);
  };
  const getExternalNodes = (commit) => {
    const { type } = commit.element;
    const subrenderer = typeof type === 'string' && nodeSubRenderers[type];
    if (subrenderer) {
      return subrenderer.getNodes(commit);
    }
    return null;
  }

  const nodeRenderer = createManagedRenderer({ add, remove, update, next, getExternalNodes });

  return nodeRenderer;
};

export const createWebRenderer = (
  subRenderers/*: { [type: string]: ?Renderer<Node> }*/ = {},
)/*: Renderer<Node>*/ => {
  const svgRenderer = createDOMRenderer('http://www.w3.org/2000/svg')

  const htmlRenderer = createDOMRenderer('http://www.w3.org/1999/xhtml', {
    ...subRenderers,
    svg: svgRenderer,
  });

  return htmlRenderer;
}