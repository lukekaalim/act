import { Component, h, Node, ReadonlyRef, useEffect, useRef, useState } from "@lukekaalim/act";
import { debounce } from 'lodash-es';

export type VirtualTreeItem = {
  depth: number,

}

export type VirtualTreeProps = {
  chunkSize: number,
  chunkCount: number,

  renderChunk(index: number, width: number): Node,

  viewportRef?: ReadonlyRef<HTMLElement | null>,
}

export const Virtual1D: Component<VirtualTreeProps> = ({ chunkSize, chunkCount, renderChunk, viewportRef: propViewportRef }) => {
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

      const start = Math.floor((viewport.scrollTop) / chunkSize);
      const end = Math.ceil((viewport.scrollTop + rect.height) / chunkSize)

      setStart(start)
      setEnd(end)
    };
    setViewport();

    viewport.addEventListener('scroll', setViewport)
    const resize = new ResizeObserver(setViewport);
    resize.observe(viewport);
    return () => {
      viewport.removeEventListener('scroll', setViewport)
      resize.disconnect();
    }
  }, [propViewportRef, chunkSize])

  const renderedIndices = Array
    .from({ length: end - start })
    .map((_, i) => start + i)
    .filter(x => x >= 0 && x < chunkCount);

  const [width, setWidth] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    const viewport = viewportRef.current;
    if (!list || !viewport)
      return;
    const rect = viewport.getBoundingClientRect();

    const maxWidth = [...list.children].reduce((acc, curr) => Math.max(curr.getBoundingClientRect().width, acc), rect.width)

    setWidth(prevMaxWidth => Math.max(maxWidth, prevMaxWidth));
  }, [start, end])
    

  return [
    //h('pre', {}, renderedIndices.join(', ')),
    h('div', { ref: viewportRef, style: { 'overflow': 'auto',  flex: 1 } },
      h('div', { ref: listRef, style: { height: (chunkSize * chunkCount) + 'px', position: 'relative', width: `${width}px` } },
        renderedIndices.map(index =>
          h('div', { style: { position: 'absolute', top: (index * chunkSize) + 'px', height: chunkSize }},
            renderChunk(index, width)))
    ))
  ];
};