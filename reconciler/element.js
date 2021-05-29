// @flow strict
/*:: export type { Element } from '@lukekaalim/act'; */
/*:: import type { Element } from '@lukekaalim/act'; */
import { isPropsEqual } from './props.js';

export const elementsAreEqual = (elementA/*: Element*/, elementB/*: Element*/)/*: boolean*/ => {
  if (elementA.id === elementB.id)
    return true;
  if (elementA.type !== elementB.type)
    return false;
  if (!isPropsEqual(elementA.props, elementB.props))
    return false;
  if (elementA.children.length !== elementB.children.length)
    return false;
  if (!elementA.children.every((childElement, index) =>
    elementB.children[index] && elementsAreEqual(childElement, elementB.children[index])
  ))
    return false;
  return true;
};