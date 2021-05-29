// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */

export const createNode = (element/*: Element*/)/*: ?Node*/ => {
  if (typeof element.type !== 'string')
    return null;
  if (element.type === 'act:string')
    return document.createTextNode(
      typeof element.props.content === 'string' ?
        element.props.content : ''
    );
  if (element.type === 'act:null')
    return null;
  const htmlElement = document.createElementNS('http://www.w3.org/1999/xhtml', element.type);
  return (htmlElement/*: any*/);
}

export const attachNodes = (parent/*: Node*/, children/*: Node[]*/) => {
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];
    const prevChild = children[i + 1];
    if (parent !== child.parentNode || (prevChild && child.nextSibling !== prevChild))
      parent.insertBefore(child, prevChild);
  }
};