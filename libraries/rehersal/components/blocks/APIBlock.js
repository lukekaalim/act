// @flow strict

import { h } from "@lukekaalim/act";
import { TextBlock } from "../TextBlock";
import styles from './APIBlock.module.css';

/*::
import type { Component } from "@lukekaalim/act";
*/
export const APIBlock/*: Component<>*/ = ({ children }) => {
  return h('div', { classList: [styles.apiBlock] },
    h(TextBlock, {}, children));
}