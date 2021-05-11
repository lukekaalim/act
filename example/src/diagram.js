// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import { h } from '@lukekaalim/act/html';

const svgDefaultProps = {
  version: "1.1",
  baseProfile: "full",
  xmlns: "http://www.w3.org/2000/svg"
};

export const SVG/*: Component<{| width: number, height: number |}>*/ = ({ width, height }, children) => {
  return h('svg:svg', { ...svgDefaultProps, width, height }, children);
};

/*::
export type Vector2 = {| x: number, y: number |};
*/

export const Circle/*: Component<{| position: Vector2, radius: number, fill: string |}>*/ = ({ fill, position, radius }, children) => {
  return h('svg:circle', { cx: position.x, cy: position.y, r: radius, fill }, children);
};

export const Text/*: Component<{| position: Vector2 |}>*/ = ({ position }, children) => {
  return h('svg:text', { x: position.x + 'px', y: position.y + 'px' }, children);
};

export const Rect/*: Component<{| position: Vector2 |}>*/ = ({ position }, children) => {
  return h('svg:rect', { width: position.x + 'px', height: position.y + 'px' }, children);
};