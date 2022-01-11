// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { DirectiveComponentMap } from '@lukekaalim/act-markdown'; */
import { h, useMemo } from '@lukekaalim/act';
import { MarkdownRenderer } from "@lukekaalim/act-markdown";

import styles from './document.module.css';
import { ExportDescription } from "./documentation/signature.js";
import { TypeDocumentation } from "./documentation/typedoc.js";
import JSON5 from 'json5';

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
  const expression = JSON5.parse(jsonContent);
  return h(TypeDocumentation, { expression });
};

const defaultDirectives/*: DirectiveComponentMap*/ = {
  api: MarkdownAPI,
  type: MarkdownTypeDoc,
}

export const Markdown/*: Component<{ text: string, directives?: DirectiveComponentMap }>*/ = ({ text, directives }) => {
  const memoDirectives = useMemo(() => ({ ...defaultDirectives, ...directives }), [directives]);
  return h(MarkdownRenderer, { markdownText: text, directiveComponents: memoDirectives });
}