// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import { h } from '@lukekaalim/act';
import { MarkdownRenderer } from "@lukekaalim/act-markdown";

import styles from './document.module.css';

export const Document/*: Component<{ text?: string }>*/ = ({ text, children }) => {
  return h('div', { className: styles.document }, [
    text ? h(MarkdownRenderer, { markdownText: text }) : null,
    children,
  ]);
};