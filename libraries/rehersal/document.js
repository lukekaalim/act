// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import { h } from '@lukekaalim/act';
import { MarkdownRenderer } from "@lukekaalim/act-markdown";

import styles from './document.module.css';

export const Document/*: Component<{}>*/ = ({ children }) => {
  return h('article', { className: styles.document }, [
    children,
  ]);
};

export const Markdown/*: Component<{ text: string }>*/ = ({ text }) => {
  return h(MarkdownRenderer, { markdownText: text });
}