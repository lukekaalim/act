// @flow strict

import { h, useEffect, useMemo, useState } from "@lukekaalim/act";
import {
  MarkdownASTRenderer, parseMarkdown,
  getMarkdownText, getHeadingElementType,
  MarkdownChildren
} from "@lukekaalim/act-markdown";

import styles from './MarkdownBlock.module.css';
import linkIconSrc from '../assets/link_black.png';
import { APIBlock } from "./blocks/APIBlock";
import { SyntaxBlock } from "./blocks/SyntaxBlock";

/*::
import type { Component } from "@lukekaalim/act";
import type { ComponentMap, MarkdownASTNode } from "@lukekaalim/act-markdown";

export type MarkdownBlockProps = {
  input:
    | { type: 'text', text: string }
    | { type: 'nodes', nodes: MarkdownASTNode },
  directives?: ComponentMap,
}
*/

export const MarkdownBlock/*: Component<MarkdownBlockProps>*/ = ({ input, directives }) => {
  const root = useMemo(() => {
    if (input.type === 'text')
      return parseMarkdown(input.text)
    return input.nodes;
  }, [input])

  const directiveComponents = useMemo(() => ({
    ...defaultDirectives,
    ...directives
  }), [directives])

  return h('div', { class: styles.markdownBlock }, h(MarkdownASTRenderer, {
    root,
    directiveComponents,
    externalComponents
  }));
}

const MarkdownAPI = ({
  node: { attributes: { name, source, aliases = '' } },
  children
}) => {
  return [
    h(APIBlock, {}, [
      children,
    ])
  ];
};

const SyntaxMarkdownCode = ({ node }) => {
  return h(SyntaxBlock, { language: node.lang || 'plaintext', code: node.value });
};

const HeadingComponent = ({ node }) => {  
  const id = getMarkdownText(node)
    .trim()
    .toLowerCase();

  const elementType = getHeadingElementType(node);
  return h(elementType, { class: styles.heading }, [
    h('a', { href: `#${id}`, id, class: styles.headingLink }, [
      h('span', {}, h(MarkdownChildren, { node })),
      h('img', { src: linkIconSrc, class: styles.headingLinkIcon }),
    ]),
  ]);
}

const defaultDirectives/*: ComponentMap*/ = {
  api: MarkdownAPI,
}
const externalComponents = {
  code: SyntaxMarkdownCode,
  heading: HeadingComponent
}

export const mapMarkdownASTNode = (
  node/*: MarkdownASTNode*/,
  mapFunc/*: MarkdownASTNode => MarkdownASTNode*/
)/*: MarkdownASTNode*/ => {
  const children = (node.children || []).map(c => mapMarkdownASTNode(c, mapFunc));
  return mapFunc({ ...node, children });
}