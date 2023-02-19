// @flow strict

import { h, useMemo, useRef } from "@lukekaalim/act";
import { calculateCubicBezierAnimationPoint, maxSpan, useAnimatedNumber, useBezierAnimation, useTimeSpan } from "@lukekaalim/act-curve";
import { useFadeTransition } from "./fadeTransition";

/*::
import type { ElementNode, Component } from "@lukekaalim/act";
import type { GraphNode, GraphEdge } from "../graphs/basicGraph";

export type GraphPictureProps = {
  nodes: GraphNode[],
  edges: GraphEdge[],
};
*/
export const GraphPicture/*: Component<GraphPictureProps>*/ = ({
  nodes,
  edges
}) => {
  const nodePositions = new Map(nodes.map(node => [node.id, node.position]));

  const edgePoints = useMemo(() => edges.map(edge => {
    const start = nodePositions.get(edge.start);
    const end = nodePositions.get(edge.end);
  
    if (!start || !end)
      return null;
    return { start, end, edge }
  }).filter(Boolean), [edges, nodes])

  const nodeAnimations = useFadeTransition(nodes, n => n.id)
  const edgeAnimations = useFadeTransition(edgePoints, e => e.edge.id);

  return h('svg', {
    viewBox: `-500 -500 1000 1000`,
    height: `1000px`, width: `1000px`,
    style: { 'pointer-events': 'none' }
  }, [
    edgeAnimations.map(animState => h(GraphEdgePicture, {
      key: animState.id, edge: animState.value.edge, animState, start: animState.value.start, end: animState.value.end })),
    nodeAnimations.map(animState => h(GraphNodePicture, { key: animState.id, node: animState.value, animState })),
  ]);
}

const usePositionAnim = (x, y, onAnimatePosition) => {
  const [xAnim] = useAnimatedNumber(x, x);
  const [yAnim] = useAnimatedNumber(y, y);
  useTimeSpan(maxSpan([xAnim.span, yAnim.span]), (now) => {
    const x = calculateCubicBezierAnimationPoint(xAnim, now);
    const y = calculateCubicBezierAnimationPoint(yAnim, now);
    onAnimatePosition(x, y);
  }, [xAnim, yAnim]);
}

const GraphNodePicture = ({ node, animState }) => {
  const x = node.position.x - ((node.size?.width || 100)/2);
  const y = -node.position.y - ((node.size?.height || 100)/2);

  usePositionAnim(x, y, (x, y) => {
    if (ref.current)
      ref.current.setAttribute('transform', `translate(${x.position}, ${y.position})`);
  })
  useBezierAnimation(animState.animation, point => {
    const { current: g } = ref;
    if (g) {
      g.style.opacity = `${1 - Math.abs(point.position)}`;
      g.style.display = point.position >= 1 ? 'none' : 'inherit'
    }
  })

  const ref = useRef/*::<?SVGElement>*/();

  return [
    h('g', {
      ref,
      'stroke-width': "2",
      stroke: 'black',
      fill: "white"
    }, [
      h('rect', {
        width: node.size?.width || 100,
        height: node.size?.height || 100,
        rx: "4",
      }),
      h('foreignObject', {
        width: node.size?.width || 100,
        height: node.size?.height || 100,
        style: { 'pointer-events': 'all' }
      }, h('div', {
        xmlns: "http://www.w3.org/1999/xhtml",
        style: { padding: '4px', height: '100%', width: '100%', boxSizing: 'border-box', display: 'flex' }
      }, h('div', { style: { margin: 'auto' } }, node.content)))
    ]),
  ];
};

const GraphEdgePicture = ({ edge, start, end, animState }) => {

  usePositionAnim(start.x, start.y, (x, y) => {
    const { current: line } = ref;
    if (line) {
      line.setAttribute('x1', x.position.toString());
      line.setAttribute('y1', (-y.position).toString());
    }
  })
  usePositionAnim(end.x, end.y, (x, y) => {
    const { current: line } = ref;
    if (line) {
      line.setAttribute('x2', x.position.toString());
      line.setAttribute('y2', (-y.position).toString());
    }
  })
  useBezierAnimation(animState.animation, point => {
    const { current: line } = ref;
    if (line) {
      line.style.opacity = `${1 - Math.abs(point.position)}`;
      line.style.display = point.position >= 1 ? 'none' : 'inherit'
    }
  })

  const ref = useRef/*::<?SVGElement>*/();

  return h('line', {
    ref,
    'stroke': "black",
    'stroke-dasharray': edge.style === 'dotted' ? '4' : '0',
    'stroke-width': "2",
  })
}