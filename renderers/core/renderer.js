// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
/*:: import type { CommitID, CommitDiff } from '@lukekaalim/act-reconciler'; */

/*::
export type Renderer<TNode> = {
  canRenderElement: (type: string) => boolean,
  render: (diff: CommitDiff) => TNode[],
};

export type ManagedRendererOptions<TNode> = {
  types: Set<string>,
  add: (element: Element) => null | TNode,
  update: (prev: Element, next: Element, children: TNode[]) => void,
  remove: (node: TNode) => void,
};
*/

export const createRenderer = /*:: <TNode>*/(options/*: ManagedRendererOptions<TNode>*/)/*: Renderer<TNode>*/ => {
  const { types, add, remove, update } = options;
  const nodesByCommitID/*: Map<CommitID, TNode>*/ = new Map();

  const canRenderElement = (type) => {
    return types.has(type) || type === 'act:null';
  };
  const createNode = (diff) => {
    const { type } = diff.next.element;
    // Components dont create nodes
    if (typeof type !== 'string')
      return null;
    // Nor do null literals
    if (type === 'act:null')
      return null;

    const node = add(diff.next.element);
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

    const children = diff.diffs.map(render).flat(1);

    if (!node)
      return children;
    
    if (diff.next.pruned)
      return (removeNode(diff, node), []);

    if (diff.prev.element.id !== diff.next.element.id)
      update(diff.prev.element, diff.next.element, children);
    
    return [node];
  };

  return {
    canRenderElement,
    render,
  };
};