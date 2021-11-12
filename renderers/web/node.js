// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
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
  return document.createElementNS(namespace, element.type);
};
export const removeNode = (node/*: Node*/) => {
  const parent = node.parentNode;
  if (parent)
    parent.removeChild(node);
}
export const attachNodes = (parent/*: Node*/, children/*: Node[]*/) => {
  // iterate backwards through the children
  for (let i = children.length; i > 0; i--) {
    const child = children[i - 1];
    const rightSibling = children[i];
    if (parent !== child.parentNode || (rightSibling && child.nextSibling !== rightSibling)) {
      parent.insertBefore(child, rightSibling);
    }
  }
};