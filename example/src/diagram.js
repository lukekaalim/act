// @flow strict
/*:: import type { Component, Context, HookLoader, SetState } from '@lukekaalim/act'; */
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

const loadDragHooks/*: HookLoader<{ useDrag: (ref: ?HTMLElement) => [Vector2, SetState<Vector2>] }>*/ = ({ useEffect, useState }) => {
  const useDrag = (ref) => {
    const [drag, setDrag] = useState/*:: <Vector2>*/({ x: 0, y: 0 });

    useEffect(() => {
      if (!ref)
        return;
      const onMouseDown = (e/*: PointerEvent*/) => {
        ref.addEventListener('pointermove', onPointerMove);
        if (e.currentTarget instanceof Element)
          e.currentTarget.setPointerCapture(e.pointerId)
      };
      const onMouseUp = (e/*: PointerEvent*/) => {
        ref.removeEventListener('pointermove', onPointerMove)
        if (e.currentTarget instanceof Element)
          e.currentTarget.releasePointerCapture(e.pointerId)
      };
      const onPointerMove = (e/*: MouseEvent*/) => {
        e.preventDefault();
        const updateDrag = p => ({ x: p.x + e.movementX, y: p.y + e.movementY });
        setDrag(updateDrag)
      };
      ref.addEventListener('pointerdown', onMouseDown);
      ref.addEventListener('pointerup', onMouseUp);
      return () => {
        ref.removeEventListener('pointerdown', onMouseDown);
        ref.removeEventListener('pointerup', onMouseUp);
        ref.removeEventListener('pointermove', onPointerMove);
      };
    }, [ref])
    
    return [drag, setDrag];
  };
  return { useDrag };
};

export const DiagramRoot/*: Component<{| size: Vector2 |}>*/ = ({ size }, children, { useHooks, useState }) => {
  const [svg, setSVG] = useState(null);
  const { useDrag } = useHooks(loadDragHooks);

  const [position] = useDrag(svg);
  const svgProps = {
    width: size.x,
    height: size.y,
    onDOMRef: setSVG,
    viewBox: [-position.x, -position.y, size.x, size.y].join(' '),
    style: { userSelect: 'none' }
  };
  
  return h('svg:svg', svgProps, children);
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


const sum = (a, b) => a + b;

const getTreeWeight = tree =>
  tree.leaves.length ? tree.leaves.map(getTreeWeight).reduce(sum) : 1;

/*::
export type TreeNode = {|
  content: string,
  leaves: TreeNode[],
|};

export type TreeDiagramProps = {|
  position: Vector2,
  tree: TreeNode,
  offset?: Vector2,
|}
*/

export const TreeDiagram/*: Component<TreeDiagramProps>*/ = ({ tree, position, offset = { x: 100, y: 100 } }) => {
  const totalLeaves = getTreeWeight(tree)
  const totalWidth = totalLeaves * offset.x;
  
  return [
    tree.leaves.map((leaf, index) => {
      const left = tree.leaves.slice(0, index);
      const width = getTreeWeight(leaf) * offset.x;
      const leafPosition = {
        y: position.y - offset.y,
        x: position.x - (totalWidth / 2) + (width / 2) + (left.map(getTreeWeight).reduce(sum, 0) * offset.x)
      };
      return [
        h(DiagramEdge, { start: position, end: leafPosition }),
        h(TreeDiagram, { tree: leaf, position: leafPosition, offset }),
      ];
    }),
    h(DiagramVertex, { position, label: tree.content }),
  ];
};
