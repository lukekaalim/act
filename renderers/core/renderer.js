// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
/*:: import type { CommitID, CommitDiff } from '@lukekaalim/act-reconciler'; */

/*::
export type Renderer<TNode> = {
  render: (diff: CommitDiff) => TNode[],
}
export type RendererOptions<TNode> = {
  add: (diff: CommitDiff) => null | TNode,
  update: (node: TNode, diff: CommitDiff, children: TNode[]) => void,
  remove: (node: TNode) => void,
  next?: (diff: CommitDiff) => TNode[],
};
*/

const parent = () => {
  child();
};
const child = () => {
  parent();
}

export const createManagedRenderer = /*:: <TNode>*/(options/*: RendererOptions<TNode>*/)/*: Renderer<TNode>*/ => {
  const { add, remove, update, next } = options;
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
  const render = (diff)/*: TNode[]*/ => {
    const node = nodesByCommitID.get(diff.next.id) || createNode(diff);
    const children = diff.diffs.map(next || render).flat(1);
  
    if (!node)
      return children;

    update(node, diff, children);
    
    if (!diff.next.pruned)
      return [node];
    
    removeNode(diff, node);
    return [];
  };

  return { render };
};
