// @flow strict
/*:: import type { ElementType } from '@lukekaalim/act'; */
/*:: import type { CommitDiff, CommitID } from '@lukekaalim/act-reconciler'; */
/*:: import type { RenderService } from './main.js'; */
import { setProps, setRef } from './prop.js';
import { createNode, attachNodes, removeNode } from './node.js';

export const createDOMRenderer = (
  namespace/*: string*/,
  subRenderers/*: Map<ElementType, RenderService>*/ = new Map(),
)/*: RenderService*/ => {
  const nodeByCommit = new Map/*:: <CommitID, Node>*/();

  const getNodeForDiff = (diff) => {
    if (diff.prev.pruned)
      return createNode(diff.next.element, namespace);
    return nodeByCommit.get(diff.next.id);
  };

  const findNodesById = (commit)/*: Node[]*/ => {
    const node = nodeByCommit.get(commit.id);
    if (node)
      return [node];
    return commit.children.map(findNodesById).flat(1);
  };

  const renderDiffToNodes = (diff/*: CommitDiff*/)/*: Node[]*/ => {
    if (diff.prev.version === diff.next.version)
      return findNodesById(diff.next);
    const node = getNodeForDiff(diff);

    const children = diff.diffs.map(render).flat(1);

    if (!node)
      return children;

    setRef(node, diff);
    if (diff.next.pruned)
      return (removeNode(node), []);
  
    setProps(node, diff);
    attachNodes(node, children);
    nodeByCommit.set(diff.next.id, node);
  
    return [node];
  }

  const render = (diff/*: CommitDiff*/)/*: Node[]*/ => {
    const element = (diff.next || diff.prev || diff.curr).element;

    const subRenderer = subRenderers.get(element.type);
    if (subRenderer)
      return subRenderer.render(diff);
    return renderDiffToNodes(diff);
  };

  return {
    render
  };
};
