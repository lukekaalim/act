import { Component, h, Node, ReadonlyRef, useEffect, useRef, useState } from "@lukekaalim/act";
import { debounce } from 'lodash-es';

export type VirtualTreeItem = {
  depth: number,

}

export type VirtualTreeProps = {
  chunkSize: number,
  chunkCount: number,

  windowRange: number,

  renderChunk(index: number): Node,

  viewportRef?: ReadonlyRef<HTMLElement | null>,
}

export const Virtual1D: Component<VirtualTreeProps> = ({ chunkSize, chunkCount, renderChunk, viewportRef: propViewportRef, windowRange }) => {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);

  const localViewportRef = useRef<HTMLElement | null>(null);
  const viewportRef = propViewportRef || localViewportRef;

  const listRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!viewportRef.current)
      return;

    const viewport = viewportRef.current;

    const setViewport = () => {
      const rect = viewport.getBoundingClientRect();

      setStart(Math.floor((viewport.scrollTop) / chunkSize))
      setEnd(Math.ceil((viewport.scrollTop + rect.height) / chunkSize))
    };
    setViewport();

    viewport.addEventListener('scroll', setViewport)
    return () => {
      viewport.removeEventListener('scroll', setViewport)
    }
  }, [propViewportRef])

  const renderedIndices = Array
    .from({ length: end - start })
    .map((_, i) => start + i)
    .filter(x => x >= 0 && x < chunkCount);
    

  return [
    //h('pre', {}, renderedIndices.join(', ')),
    h('div', { ref: viewportRef, style: { overflow: 'auto', height: '100%' } },
      h('div', { ref: listRef, style: { height: (chunkSize * chunkCount) + 'px', position: 'relative' } },
        renderedIndices.map(index =>
          h('div', { style: { position: 'absolute', top: (index * chunkSize) + 'px', height: chunkSize, padding: '-1', border: '1px dotted black', width: '100%' }},
            renderChunk(index)))
    ))
  ];
};