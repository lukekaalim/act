// @flow strict
/*::
import type { MarkdownASTNode } from "./entry";
*/

export const getOwnMarkdownText = (node/*: MarkdownASTNode*/)/*: null | string*/ => {
  switch (node.type) {
    default:
      return null;
    case 'text':
      return node.value;
  }
}

export const getMarkdownText = (node/*: MarkdownASTNode*/)/*: string*/ => {
  return [
    [getOwnMarkdownText(node)],
    node.children && node.children.map(getMarkdownText) || null
  ].filter(Boolean).flat(1).join(' ')
};