// @flow strict
/*:: import type { Component, Context } from '@lukekaalim/act'; */
import { h } from '@lukekaalim/act/html';
import { createContext } from '@lukekaalim/act';

/*::
export type Vector2 = {| x: number, y: number |};
*/
/*::
export type Box = {|
  position: Vector2,
  size: Vector2
|};
*/

export const rootSVGNodeContext/*: Context<?SVGSVGElement>*/ = createContext(null);

export const DiagramRoot/*: Component<{| size: Vector2 |}>*/ = ({ size }, children, { useState }) => {
  return h('svg:svg', { width: size.x, height: size.y }, children);
};

/*::
export type DiagramVertexProps = {|
  position: Vector2,
  label: string,
  charSize?: Vector2,
  fontFamily?: string
|};
*/

export const DiagramVertex/*: Component<DiagramVertexProps>*/ = ({
  position,
  label,
  charSize = { x: 16, y: 26 },
  fontFamily = 'monospace'
}) => {
  const charWidth = charSize.x;
  const charHeight = charSize.y;

  const rectHeight = charHeight + 20;
  const rectWidth = (label.length * charWidth) + 20;

  const rectProps = {
    width: rectWidth,
    height: rectHeight,
    x: position.x - (rectWidth/2),
    y: position.y - (rectHeight/2),
    rx: 8,
    stroke: 'black',
    fill: 'white',
    'stroke-width': '2px',
    style: { boxShadow: '0 0 10px 10px black'}
  };
  const textProps = {
    'font-size': `${charHeight}px`,
    x: `${position.x - (rectWidth/2) + 10}px`,
    y: `${position.y + (charHeight/4)}px`,
    textLength: `${rectWidth - 20}px`,
    'font-family': fontFamily,
    lengthAdjust: "spacingAndGlyphs"
  };
  return [
    h('svg:rect', rectProps),
    h('svg:text', textProps, label),
    // h('svg:circle', { cx: position.x, cy: position.y, fill: 'red', r: 5 }), // just for marking the origin
  ];
};

/*::
export type DiagramEdgeProps = {|
  start: Vector2,
  end: Vector2
|};
*/

const createPoint = (vector) => [vector.x, vector.y].join(',');

export const DiagramEdge/*: Component<DiagramEdgeProps>*/ = ({ start, end }) => {
  const polyLineProps = {
    stroke: 'black',
    'stroke-width': '2px',
    points: [createPoint(start), createPoint(end)].join(' '),
  };
  return [
    h('svg:polyline', polyLineProps)
  ]
};