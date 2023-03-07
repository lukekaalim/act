// @flow strict

import { h, useState, useEffect, useRef, createContext } from "@lukekaalim/act";
import styles from './DiagramBlock.module.css';
import { nanoid } from 'nanoid/non-secure';

/*::
import type { Component, Context } from "@lukekaalim/act";

export type DiagramBlockProps = {
  landmarks?: { x: number, y: number, title: string }[],
  bounding?: { x: number, y: number },
  showControls?: boolean,
  style?: { height?: string }
}
*/

export const diagramContext/*: Context<{ position: { x: number, y: number }}>*/ = createContext({
  position: { x: 0, y: 0 }
})

export const DiagramBlock/*: Component<DiagramBlockProps>*/ = ({
  children,
  bounding = { x: 100, y: 100 },
  showControls = true,
  style: { height = null } = {}
}) => {
  const [dragging, setDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const ref = useRef();

  useEffect(() => {
    const { current: element } = ref;
    if (!(element instanceof HTMLElement))
      return;
    const onResize = () => {
      const rect = element.getBoundingClientRect();
      setOffset({ x: rect.width/2, y: rect.height/2 });
    }
    onResize();
    const observer = new ResizeObserver(onResize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  

  const offsetPosition = {
    x: position.x + offset.x,
    y: position.y + offset.y,
  };
  return h('div', {
    class: styles.diagramBlock,
    ref,
    style: { height }
  }, [
    h(DiagramBackground, { position: offsetPosition, dragging, setPosition, setDragging, bounding }),
    h(diagramContext.Provider, { value: { position }}, [
      h('div', {
        class: styles.diagramContainer,
        style: {
          transform: `translate(calc(${offsetPosition.x}px - 50%), calc(${offsetPosition.y}px - 50%))`
        }
      }, children),
    ]),
    showControls && h(DiagramControls, { position })
  ]);
}

const DiagramControls = ({ position }) => {
  return [
    h('pre', { class: styles.positionReadout }, JSON.stringify(position))
  ];
}

const DiagramBackground = ({ position, dragging, setPosition, setDragging, bounding }) => {
  const [id] = useState(nanoid());

  const onPointerDown = (e/*: PointerEvent*/) => {
    setDragging(true);
    if (e.currentTarget instanceof Element) {
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    e.pointerId
  };
  const onPointerMove = (e/*: PointerEvent*/) => {
    if (dragging) {
      setPosition(p => ({
        x: Math.max(Math.min(p.x + e.movementX, bounding.x), -bounding.x),
        y: Math.max(Math.min(p.y + e.movementY, bounding.y), -bounding.y)
      }));
    }
  }
  const onPointerUp = (e/*: PointerEvent*/) => {
    if (e.currentTarget instanceof Element) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setDragging(false);
  };
  
  const [lightAccentColor, setLightAccentColor] = useState('#74808880');
  const ref = useRef();
  useEffect(() => {
    if (ref.current instanceof SVGElement) {
      setLightAccentColor(getComputedStyle(ref.current)
        .getPropertyValue('--accent-color'))
    }
  }, [])

  return h('svg', {
    ref,
    class: styles.background,
    style: { cursor: dragging ? `grabbing` : `grab` },
    onPointerDown, onPointerUp, onPointerMove,
    dragging: false,
  }, [
    h('defs', {}, [
      h('pattern', {
        id: `${id}:small-line`, viewBox: "0,0,20,20",
        patternUnits: 'userSpaceOnUse',
        width: "20", height: "20",
        x: position.x/1, y: position.y/1,
        //patternContentUnits: 'userSpaceOnUse'
      }, [
        h('line', { x1: "0", y1: "0", x2: "20", y2: "0", stroke: lightAccentColor }),
        h('line', { x1: "0", y1: "0", x2: "0", y2: "20", stroke: lightAccentColor }),
        //h('line', { points: "0,0 2,5 0,10 5,8 10,10 8,5 10,0 5,2" }),
      ]),
      h('pattern', {
        id: `${id}:big-line`,
        viewBox: "0,0,100,100",
        patternUnits: 'userSpaceOnUse',
        width: "100", height: "100",
        x: position.x/1, y: position.y/1,
        //patternContentUnits: 'userSpaceOnUse'
      }, [
        h('line', { x1: "0", y1: "0", x2: "100", y2: "0", stroke: lightAccentColor, 'stroke-width': '4' }),
        h('line', { x1: "0", y1: "0", x2: "0", y2: "100", stroke: lightAccentColor, 'stroke-width': '4' }),
        //h('line', { points: "0,0 2,5 0,10 5,8 10,10 8,5 10,0 5,2" }),
      ]),
    ]),
    h('rect', { height: "100%", width: "100%", fill: `url(#${id}:small-line)` }),
    h('rect', { height: "100%", width: "100%", fill: `url(#${id}:big-line)` }),
  ]);
}