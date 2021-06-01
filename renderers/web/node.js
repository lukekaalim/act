// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
/*:: import type { CommitDiff, StateID } from '@lukekaalim/act-reconciler'; */
/*:: import type { RenderService } from './main.js'; */

export const createNode = (element/*: Element*/, namespace/*: string*/)/*: ?Node*/ => {
  if (typeof element.type !== 'string')
    return null;
  if (element.type === 'act:null')
    return null;
  if (element.type === 'act:string')
    return document.createTextNode('');
  return document.createElementNS(namespace, element.type);
};
export const removeNode = (node/*: Node*/) => {
  const parent = node.parentNode;
  if (parent)
    parent.removeChild(node);
}
export const attachNodes = (parent/*: Node*/, children/*: Node[]*/) => {
  for (let i = 0; i < children.length; i++) {
    const child = children[children.length - i - 1];
    const prevChild = children[children.length - i];
    if (parent !== child.parentNode || (prevChild && child.nextSibling !== prevChild))
      parent.insertBefore(child, prevChild);
  }
};