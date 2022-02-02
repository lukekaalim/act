// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { ComponentMap } from '@lukekaalim/act-markdown'; */
import { h, useMemo } from '@lukekaalim/act';
import { MarkdownRenderer } from "@lukekaalim/act-markdown";

import styles from './document.module.css';
import { ExportDescription } from "./documentation/signature.js";
import { TypeDocumentation } from "./documentation/typedoc.js";
import JSON5 from 'json5';
import { SyntaxCode } from './entry';

export const Document/*: Component<{}>*/ = ({ children }) => {
  return h('article', { className: styles.document }, [
    children,
  ]);
};

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
  code: SyntaxMarkdownCode
}

export const Markdown/*: Component<{ text: string, directives?: ComponentMap }>*/ = ({ text, directives }) => {
  const memoDirectives = useMemo(() => ({ ...defaultDirectives, ...directives }), [directives]);

  return h(MarkdownRenderer, { markdownText: text, directiveComponents: memoDirectives, externalComponents });
}