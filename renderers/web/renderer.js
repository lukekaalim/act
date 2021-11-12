// @flow strict
/*:: import type { ElementType } from '@lukekaalim/act'; */
/*:: import type { Renderer } from '@lukekaalim/act-renderer-core'; */
import { createManagedRenderer } from '@lukekaalim/act-renderer-core';
import { setProps, setRef } from './prop.js';
import { createNode, attachNodes, removeNode } from './node.js';

export const createDOMRenderer = (
  namespace/*: string*/,
  nodeSubRenderers/*: { [type: string]: ?Renderer<Node> }*/ = {},
)/*: Renderer<Node>*/ => {
  const add = (diff)/*: null | Node*/ => {
    return createNode(diff.next.element, namespace);
  }
  const remove = (node) => {
    removeNode(node);
  };
  const update = (node, diff, children) => {
    setRef(node, diff);

    if (diff.next.pruned)
      return;

    setProps(node, diff);
    attachNodes(node, children);
  }

  const next = (diff)/*: Node[]*/ => {
    const { element: { type } } = (diff.next || diff.prev);
    return ((typeof type === 'string' && nodeSubRenderers[type]) || node).render(diff);
  };

  const node = createManagedRenderer({ add, remove, update, next });

  return node;
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