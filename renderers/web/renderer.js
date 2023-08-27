// @flow strict
/*::
import type { ElementType } from '@lukekaalim/act'; 
import type { CommitDiff, Commit } from '@lukekaalim/act-reconciler'; 
import type { Renderer2 } from "../core/renderer2";
*/
/*:: import type { Renderer, RenderResult } from '@lukekaalim/act-renderer-core'; */
import { setProps, setRef, setWebProps2 } from './prop.js';
import { createNode, removeNode, setNodeChildren, setNodeChildren2 } from './node.js';
import { createRenderer2, setRef2 } from '@lukekaalim/act-renderer-core';

export const createDOMRenderer = (
  namespace/*: string*/,
  getNextRenderer/*: null | (ElementType => null | Renderer2<Node>)*/ = null,
)/*: Renderer2<Node>*/ => {
  const create = (type) => {
    return createNode(type, namespace);
  }
  const remove = (node, children, diff) => {
    setRef2(node, diff.commit, diff.change);
    removeNode(node);
  };
  const update = (node, set, diff) => {
    if (diff.change.type === 'create')
      setRef2(node, diff.commit, diff.change);

    setWebProps2(node, set, diff);
  }
  const attach = (node, set, diff, children) => {
    if (diff.commit.element.props["ignoreChildren"])
      return;
    setNodeChildren2(node, children);
  }

  const getRenderer = (set, commitId) => {
    const commit = set.nexts.map.get(commitId) || set.prevs.get(commitId);
    return getNextRenderer && getNextRenderer(commit.element.type) || nodeRenderer;
  }

  const getNodes = (set, commitId) => {
    const renderer = getRenderer(set, commitId)
    return renderer.getNodes(set, commitId);
  }

  const render = (set, commitId) => {
    const renderer = getRenderer(set, commitId)
    return renderer.render(set, commitId);
  }

  const nodeRenderer = createRenderer2({
    create,
    update,
    remove,
    attach,
  }, {
    getNodes,
    render,
  });

  return nodeRenderer;
};

export const createWebRenderer = (
  getNextRenderer/*: null | (ElementType => null | Renderer2<Node>)*/ = null,
)/*: Renderer2<Node>*/ => {
  const svgRenderer = createDOMRenderer('http://www.w3.org/2000/svg', type => {
    switch (type) {
      case 'div':
        return htmlRenderer;
      default:
        return getNextRenderer && getNextRenderer(type);
    }
  })

  const htmlRenderer = createDOMRenderer('http://www.w3.org/1999/xhtml', type => {
    switch (type) {
      case 'svg':
        return svgRenderer;
      default:
        return getNextRenderer && getNextRenderer(type);
    }
  });

  return htmlRenderer;
}