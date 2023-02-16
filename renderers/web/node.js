// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
/*:: import type { RenderResult, RenderResult2 } from '@lukekaalim/act-renderer-core'; */
/*:: import type { CommitDiff } from '@lukekaalim/act-reconciler'; */

import { calculateIndexChanges } from "@lukekaalim/act-reconciler/util";

export const createNode = (type/*: string*/, namespace/*: string*/)/*: Node*/ => {
  if (type === 'act:string')
    return document.createTextNode('');
  return document.createElementNS(namespace, type);
};
export const removeNode = (node/*: Node*/) => {
  const parent = node.parentNode;
  if (parent)
    parent.removeChild(node);
}
export const setNodeChildren = (parent/*: Node*/, children/*: RenderResult<Node>[]*/) => {
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

export const setNodeChildren2 = (parent/*: Node*/, children/*: Node[]*/) => {
  const parentNodeLength = parent.childNodes.length;
  const parentNodes = [...parent.childNodes];
  
  for (let i  = 0; i < parentNodeLength; i++) {
    if (!children.includes(parentNodes[i]))
      parent.removeChild(parentNodes[i]);
  }

  for (let i = 0; i < children.length; i++) {
    const prevChild = parent.childNodes[i] || null;
    const nextChild = children[i] || null;

    if (prevChild !== nextChild) {
      if (!prevChild)
        parent.appendChild(nextChild)
      else
        parent.replaceChild(nextChild, prevChild);
    }
  }
}
