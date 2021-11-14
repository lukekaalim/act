// @flow strict
/*:: import type { Component, ElementNode } from "@lukekaalim/act";*/
import { h } from '@lukekaalim/act';

import styles from './workspace.module.css';

/*::
export type WorkspaceProps = {
  bench: ElementNode,
  tools: ElementNode,
}
*/

export const Workspace/*: Component<WorkspaceProps>*/ = ({ bench, tools }) => {
  return h('div', { className: styles.workspace }, [
    h('div', { className: styles.bench }, bench),
    h('div', { className: styles.tools }, tools),
  ]);
}