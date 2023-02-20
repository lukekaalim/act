// @flow strict

import { h, useMemo } from "@lukekaalim/act";
import { MarkdownASTRenderer, parseMarkdown, MarkdownNode, MarkdownParagraph, MarkdownHeading } from "@lukekaalim/act-markdown";
import { SyntaxCode } from "../../documentation/syntax";
import { TypeDocumentation } from "../../documentation/typedoc";
import JSON5 from 'json5';
import { TextBlock } from "./TextBlock";
import { ExportDescription } from "../../documentation/signature";
import styles from './MarkdownBlock.module.css';


/*::
import type { Component } from "../../../../library/component";
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

const MarkdownAPI = ({ node: { attributes: { name, source, aliases = '' } }, children }) => {
  return h(ExportDescription, { name, source, aliases: aliases.split(',').filter(Boolean) }, children);
};
const MarkdownTypeDoc = ({ node }) => {
  const jsonContent = node.children[0].value || node.children[0].children[0].value;
  const statement = JSON5.parse(jsonContent);
  return h(TypeDocumentation, { statement });
};

const SyntaxMarkdownCode = ({ node }) => {
  return h(SyntaxCode, { code: node.value, language: node.lang });
};

const defaultDirectives/*: ComponentMap*/ = {
  api: MarkdownAPI,
  type: MarkdownTypeDoc,
}
const externalComponents = {
  code: SyntaxMarkdownCode,
}

export const mapMarkdownASTNode = (
  node/*: MarkdownASTNode*/,
  mapFunc/*: MarkdownASTNode => MarkdownASTNode*/
)/*: MarkdownASTNode*/ => {
  const children = (node.children || []).map(c => mapMarkdownASTNode(c, mapFunc));
  return mapFunc({ ...node, children });
}