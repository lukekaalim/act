// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
/*:: import type { RenderResult } from '@lukekaalim/act-renderer-core'; */
/*:: import type { CommitDiff } from '@lukekaalim/act-reconciler'; */

export const createNode = (element/*: Element*/, namespace/*: string*/)/*: null | Node*/ => {
  if (typeof element.type !== 'string')
    return null;
  if (element.type === 'act:null')
    return null;
  if (element.type === 'act:string')
    return document.createTextNode('');
  if (element.type === 'act:context')
    return null;
  if (element.type === 'act:boundary')
    return null;
  return document.createElementNS(namespace, element.type);
};
export const removeNode = (node/*: Node*/) => {
  const parent = node.parentNode;
  if (parent)
    parent.removeChild(node);
}
export const setNodeChildren = (diff/*: CommitDiff*/, parent/*: Node*/, children/*: RenderResult<Node>[]*/) => {
  const childrenToAttach = children.filter(r => !r.commit.suspension).map(r => r.node);
  const childrenToRemove = children.filter(r => r.commit.suspension).map(r => r.node);
  for (let i = 0; i < childrenToRemove.length; i++)
    removeNode(childrenToRemove[i]);
  
  // iterate backwards through the children
  for (let i = childrenToAttach.length; i > 0; i--) {
    const child = childrenToAttach[i - 1];
    const rightSibling = childrenToAttach[i];
    if (parent !== child.parentNode || (rightSibling && child.nextSibling !== rightSibling)) {
      parent.insertBefore(child, rightSibling);
    }
  }
}
