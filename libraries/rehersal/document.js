// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { DirectiveComponentMap } from '@lukekaalim/act-markdown'; */
import { h } from '@lukekaalim/act';
import { MarkdownRenderer } from "@lukekaalim/act-markdown";

import styles from './document.module.css';

export const Document/*: Component<{}>*/ = ({ children }) => {
  return h('article', { className: styles.document }, [
    children,
  ]);
};

export const Markdown/*: Component<{ text: string, directives?: DirectiveComponentMap }>*/ = ({ text, directives }) => {
  return h(MarkdownRenderer, { markdownText: text, directiveComponents: directives });
}