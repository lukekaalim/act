// @flow strict
/*:: import type { Mesh } from 'three'; */
/*:: import type { Component } from '@lukekaalim/act'; */

import { h } from "@lukekaalim/act";

/*::
export type SharedProps<T> = {|
  ref: { current: ?T }
|}


export type Props = {|
  width: number,
  height: number,
  updateStyle?: boolean,
|};
*/

export const Three/*: Component<Props>*/ = (props) => {
  return h('Three', props, props.children);
};

export const Cube/*: Component<{ ...SharedProps<Mesh> }>*/ = () => {
  return h('Cube');
};