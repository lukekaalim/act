// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
/*:: import type { CommitID, CommitDiff, Commit } from '@lukekaalim/act-reconciler'; */

/*::
export type RenderResult<TNode> = {
  commit: Commit,
  node: TNode,
};
export type Renderer<TNode> = {
  render: (diff: CommitDiff) => RenderResult<TNode>[],
  getNodes: (commit: Commit) => RenderResult<TNode>[],
}
export type RendererOptions<TNode> = {
  add: (diff: CommitDiff) => null | TNode,
  update: (node: TNode, diff: CommitDiff, children: RenderResult<TNode>[]) => void,
  remove: (node: TNode) => void,

  next?: (diff: CommitDiff) => RenderResult<TNode>[],
  getExternalNodes?: (commit: Commit) => ?RenderResult<TNode>[],
};
*/

/*
A "Sparse" tree renderer - not every commit corresponds to a "TNode".
*/
export const createManagedRenderer = /*:: <TNode>*/(options/*: RendererOptions<TNode>*/)/*: Renderer<TNode> & { nodesByCommitID: Map<CommitID, TNode> }*/ => {
  const { add, remove, update, next, getExternalNodes } = options;
  const nodesByCommitID/*: Map<CommitID, TNode>*/ = new Map();

  const createNode = (diff) => {
    const { type } = diff.next.element;
    // Components dont create nodes
    if (typeof type !== 'string')
      return null;
    // Nor do null literals
    if (type === 'act:null')
      return null;

    const node = add(diff);
    if (node)
      nodesByCommitID.set(diff.next.id, node);

    return node;
  }
  const removeNode = (diff, node) => {
    remove(node);
    nodesByCommitID.delete(diff.next.id);
  };
  const getNodes = (commit)/*: RenderResult<TNode>[]*/ => {
    const node = nodesByCommitID.get(commit.id);
    if (node)
      return [{ node, commit }];
    const external = getExternalNodes && getExternalNodes(commit);
    if (external)
      return external;
    return commit.children.map(getNodes).flat(1);
  }
  const render = (diff)/*: RenderResult<TNode>[]*/ => {
    const node = nodesByCommitID.get(diff.next.id) || createNode(diff);
    const children = diff.diffs.map(next || render).flat(1);

    const hasDiff = diff.next.id !== diff.prev.id;
  
    if (!node)
      if (!hasDiff)
        return getNodes(diff.next);
      else
        return children;

    update(node, diff, children);
    
    if (!diff.next.pruned)
      return [{ node, commit: diff.next }];
    
    removeNode(diff, node);
    return [];
  };

  return { render, getNodes, nodesByCommitID };
};

export const createNullRenderer = /*:: <TNode>*/ (internalRenderer/*: ?Renderer<any>*/ = null)/*: Renderer<TNode>*/ => {
  const getNodes = () => {
    return [];
  }
  const render = (diff) => {
    if (internalRenderer)
      internalRenderer.render(diff)
    return [];
  }
  return { getNodes, render };
}