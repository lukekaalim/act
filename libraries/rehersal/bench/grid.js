// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import { h } from '@lukekaalim/act';

import benchStyles from './bench.module.css';

export const Grid2D/*: Component<{ offset: { x: number, y: number }}>*/ = ({ offset }) => {
  return h('svg', { width: '100%', height: '100%', className: benchStyles.grid }, [
    h('defs', {}, [
      h("pattern", {
        id: 'grid-large',
        x: '0',
        y: '0',
        height: '100',
        width: '100',
        patternUnits: 'userSpaceOnUse'
      }, [
        h('line', { x1: '0', y1: '0', x2: '100', y2: '0', stroke: 'black' }),
        h('line', { x1: '0', y1: '0', x2: '0', y2: '100', stroke: 'black' }),
      ]),
      h("pattern", {
        id: 'grid-small',
        x: '0',
        y: '0',
        height: '100',
        width: '100',
        patternUnits: 'userSpaceOnUse'
      }, [
        h('line', { x1: '0', y1: '50', x2: '100', y2: '50', stroke: '#0000001f' }),
        h('line', { x1: '50', y1: '0', x2: '50', y2: '100', stroke: '#0000001f' }),
      ])
    ]),
    h('rect', { x: offset.x, y: offset.y, width: '100%', height: '100%', fill: 'url(#grid-large)'}),
    h('rect', { x: offset.x, y: offset.y, width: '100%', height: '100%', fill: 'url(#grid-small)'}),
  ]);
}

export const ResizableMount/*: Component<{ }>*/ = ({ children }) => {
  return h('div', { className: benchStyles.resizable }, children)
};

export const GridBench/*: Component<{ }>*/ = ({ children }) => {
  return h('div', { className: benchStyles.bench }, [
    h(Grid2D, { offset: { x: 0, y: 0 } }),
    h('span', { style: { position: 'relative' }}, h(ResizableMount, {}, children)),
  ]);
};
