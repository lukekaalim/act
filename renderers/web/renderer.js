// @flow strict
/*::
import type { ElementType } from '@lukekaalim/act'; 
import type { CommitDiff, Commit } from '@lukekaalim/act-reconciler'; 
*/
/*:: import type { Renderer, RenderResult } from '@lukekaalim/act-renderer-core'; */
import { createManagedRenderer } from '@lukekaalim/act-renderer-core';
import { setProps, setRef } from './prop.js';
import { createNode, removeNode, setNodeChildren } from './node.js';

export const createDOMRenderer = (
  namespace/*: string*/,
  nextDOMNode/*: ?((diff: CommitDiff) => RenderResult<Node>[])*/ = null,
  getExternalDOMNode/*: ?((diff: Commit) => null | RenderResult<Node>[])*/ = null,
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

  const getExternalNodes = (commit) => {
    if (getExternalDOMNode) {
      return getExternalDOMNode(commit);
    }
    return null;
  }

  const next = (diff) => {
    if (nextDOMNode) {
      return nextDOMNode(diff)
    }
    return nodeRenderer.render(diff);
  }

  const nodeRenderer = createManagedRenderer({ add, remove, update, next, getExternalNodes });

  return nodeRenderer;
};

export const createWebRenderer = (
  nextDOMNode/*: ?((diff: CommitDiff) => RenderResult<Node>[])*/ = null,
  getExternalDOMNode/*: ?((diff: Commit) => null | RenderResult<Node>[])*/ = null,
)/*: Renderer<Node>*/ => {
  const svgRenderer = createDOMRenderer('http://www.w3.org/2000/svg')

  const htmlRenderer = createDOMRenderer('http://www.w3.org/1999/xhtml', diff => {
    switch (diff.next.element.type) {
      case 'svg':
        return svgRenderer.render(diff);
      default:
        if (nextDOMNode)
          return nextDOMNode(diff);
        return htmlRenderer.render(diff)
    }
  }, commit => {
    switch (commit.element.type) {
      case 'svg':
        return svgRenderer.getNodes(commit);
      default:
        if (getExternalDOMNode)
          return getExternalDOMNode(commit);
        return null;
    }
  });

  return htmlRenderer;
}