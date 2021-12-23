// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */

import { h } from "@lukekaalim/act";

const GridSVGDiagram/*: Component<{}>*/ = () => {
  return h('svg', {}, [
    h('defs', {}, [
      h('pattern', {}, [

      ]),
    ]),
  ]);
}

const GridSquare/*: Component<{ width: number, height: number }>*/ = ({ width, height }) => {
  return [
    h('rect', { width, height, x: 0, y: 0, strikeWidth: '2px', fill: 'none' })
  ];
};
