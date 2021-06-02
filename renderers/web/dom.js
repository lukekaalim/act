// @flow strict
/*:: import type { ElementType } from '@lukekaalim/act'; */
/*:: import type { CommitDiff, StateID } from '@lukekaalim/act-reconciler'; */
/*:: import type { RenderService } from './main.js'; */
import { setProps, setRef } from './prop.js';
import { createNode, attachNodes, removeNode } from './node.js';

export const createDOMRenderer = (
  namespace/*: string*/,
  subRenderers/*: Map<ElementType, RenderService>*/ = new Map(),
)/*: RenderService*/ => {
  const nodeByStateId = new Map/*:: <StateID, Node>*/();

  const getNodeForDiff = (diff) => {
    if (diff.type === 'create')
      return createNode(diff.next.element, namespace);
    return nodeByStateId.get(diff.stateId);
  };

  const findNodesByStateId = (commit)/*: Node[]*/ => {
    const node = nodeByStateId.get(commit.stateId);
    if (node)
      return [node];
    return commit.children.map(findNodesByStateId).flat(1);
  };

  const renderDiffToNodes = (diff/*: CommitDiff*/)/*: Node[]*/ => {
    if (diff.type === 'persist')
      return findNodesByStateId(diff.curr);
    const node = getNodeForDiff(diff);

    const children = diff.children.map(render).flat(1);

    if (!node)
      return children;

    setRef(node, diff);
    if (diff.type === 'remove')
      return (removeNode(node), []);
  
    setProps(node, diff);
    attachNodes(node, children);
    nodeByStateId.set(diff.stateId, node);
  
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
