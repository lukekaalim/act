// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import { h, useRef, useEffect, useState } from '@lukekaalim/act';
import { sequenceSpanPairs, useBezierAnimation, useAnimatedList, defaultBezierElementOptions } from '@lukekaalim/act-curve';

import * as uuid from 'uuid';

const ListElement = ({ color, status, index, done }) => {
  const ref = useRef/*:: <HTMLLIElement>*/((null/*: any*/));

  useBezierAnimation(status, status => {
    ref.current.style.opacity = `${1 - Math.abs(status)}`;
  });

  useBezierAnimation(index, index => {
    ref.current.style.transform = `translate(0, ${index * 30}px)`;
    ref.current.value = Math.round(index);
  });

  useEffect(() => {
    const now = performance.now();
    const id = setTimeout(() => {
      if (status.shape[3] === 1)
        done();
    }, status.span.start + status.span.durationMs - now);
    return () => {
      clearTimeout(id);
    }
  }, [status])

  return [
    h('li', { ref, style: { position: 'absolute', height: '30px' } }, color),
  ]
}

const sortChange = (a, b) => {
  if (a.index.shape[3] === b.index.shape[3])
    return a.status.span[3] - b.status.span[3];
  return a.index.shape[3] - b.index.shape[3]
}

export const AnimatedListDemo/*: Component<>*/ = () => {
  const [colors, setColors] = useState([]);
  const [animations, filterAnimations] = useAnimatedList(colors, []);

  const enteringChanges = animations.filter(c => c.status.shape[3] === 0);
  const exitingChanges = animations.filter(c => c.status.shape[3] === 1);

  const sequencedChanges = sequenceSpanPairs(
    enteringChanges
      .map(change => [change, change.status.span]),
    -400
  )
    .map(([change, span]) => ({ ...change, status: { ...change.status, span } }));

  const finalColors = [
    ...exitingChanges,
    ...sequencedChanges,
  ].sort(sortChange);
  
  const onRemoveClick = () => {
    const removedColors = colors
    .filter(_ => Math.random() > 0.50);

    setColors(removedColors)
  };

  const onScrambleClick = () => {
    const shuffledColors = colors
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)

      setColors(shuffledColors)
  }

  const onAddClick = () => {
    const elements = [
      ...colors,
      ...Array
        .from({ length: Math.floor(Math.random() * 4) + 1 })
        .map(() => uuid.v4())
    ];

    setColors(elements);
  }

  const onDone = (value) => () => {
    filterAnimations(anim => anim.value !== value);
  }

  return h('div', { style: { width: '50%', margin: 'auto' } }, [
    h('menu', {}, [
      h('button', { onClick: onAddClick }, 'Add'),
      h('button', { onClick: onRemoveClick }, 'Snap'),
      h('button', { onClick: onScrambleClick }, 'Scramble')
    ]),
    h('div', { style: { height: '200px', overflow: 'auto', border: '1px dotted black' }}, [
      h('ol', { style: { position: 'relative' } }, [
        ...finalColors
          .map(change => h(ListElement, { key: change.value, color: change.value, index: change.index, status: change.status, done: onDone(change.value) })),
      ])
    ])
  ]);
};