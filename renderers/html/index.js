// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
/*:: import type { Commit, CommitDiff, CreateDiff, StateID } from '@lukekaalim/act-reconciler'; */
import { createTree } from '@lukekaalim/act-reconciler';
import { setProps } from './prop.js';
import { createNode, attachNodes } from './lifecycle.js';

export const render = (root/*: Element*/, htmlRoot/*: HTMLElement*/) => {
  const nodeByStateId = new Map/*:: <StateID, Node>*/();

  const searchCommitForNodes = (commit/*: Commit*/)/*: Node[]*/ => {
    const node = nodeByStateId.get(commit.stateId);
    if (node)
      return [node];
    return commit.children.map(searchCommitForNodes).flat(1);
  };

  const renderComponent = (diff/*: CommitDiff*/)/*: Node[]*/ => {
    if (diff.prev && diff.next && diff.prev.commitId === diff.next.commitId)
      return searchCommitForNodes(diff.next);

    return diff.children.map(renderDiff).flat(1);
  };
  const renderNode = (diff/*: CommitDiff*/, node/*: Node*/)/*: ?Node*/ => {
    if (diff.prev && diff.next && diff.prev.commitId === diff.next.commitId)
      return node;

    const childNodes = diff.children.map(renderDiff).flat(1)

    if (!diff.next)
      return null;
  
    setProps(node, diff);
    attachNodes(node, childNodes);

    return node;
  };

  const renderDiff = (diff/*: CommitDiff*/)/*: Node[]*/ => {
    const stateId = (diff.prev || diff.next).stateId;
    const node = diff.prev ? nodeByStateId.get(stateId) : createNode(diff.next.element);
    if (!node)
      return renderComponent(diff);
    const updatedNode = renderNode(diff, node);
    if (!updatedNode) {
      if (node.parentNode)
        node.parentNode.removeChild(node)
      nodeByStateId.delete(stateId);
      return [];
    }
    nodeByStateId.set(stateId, updatedNode);
    return [updatedNode];
  };

  const options = {
    onCreate: diff => attachNodes(htmlRoot, renderDiff(diff)),
    onUpdate: diff => attachNodes(htmlRoot, renderDiff(diff)),
    scheduleWork: requestAnimationFrame,
  }
  const tree = createTree(root, options);
};
