import { Element } from "@lukekaalim/act";

/**
 * This type describes an implementation
 * that can be provided to a RenderSpace
 * in order to produce a fully-featured renderer.
 */
export type NodeBuilder<TNode, TRoot = string | symbol> = {
  roots: Set<TRoot>,

  create: (element: Element, root: TRoot) => null | TNode,
  destroy?: (el: TNode) => unknown, 

  linkRoot?: (child: TNode) => unknown,
  unlinkRoot?: (child: TNode) => unknown,
  link?: (child: TNode, parent: TNode) => unknown,
  unlink?: (child: TNode, parent: TNode) => unknown,

  sort?: (el: TNode, children: readonly TNode[]) => unknown,
  update?: (el: TNode, next: Element, prev: null | Element) => unknown,

  suspend?: (el: TNode, parent: TNode) => void,
  unsuspend?: (el: TNode, parent: TNode) => void,
};
