// @flow strict

import { h } from "@lukekaalim/act";
import styles from './TextBlock.module.css';

/*::
import type { Component } from "@lukekaalim/act";
*/

export const TextBlock/*: Component<>*/ = ({ children }) => {
  return h('div', { class: styles.textBlock }, children)
};