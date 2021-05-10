// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import { h } from '@lukekaalim/act/html';
import { Circle, SVG, Text } from './diagram.js';
import { SlideControls, Slide, TitleSlide } from './slides.js';

const FromScratchTitle = () => [
  h('h2', {}, 'React from Scratch!'),
  h('p', {}, 'with Luke Kaalim')
];
const Why = () => [
  h('h2', {}, 'Why?'),
  h('ol', {}, [
    h('li', {}, 'For fun and profit!'),
    h('li', {}, 'Taking a look at the guts of react help us understand how to use react better.'),
    h('li', {}, 'Building different renders for different things'),
    h('li', {}, 'Preact doesn\'t support alternative reconcilers')
  ]),
];
const WhatIsReact = () => [
  h('h2', {}, 'What is react?'),
  h('ul', {}, [
    h('li', {}, 'A rendering tool from facebook'),
    h('li', {}, 'A declarative rendering tool'),
    h('li', {}, 'A generic tree differ (reconciler)'),
    h('li', {}, 'A DOM manipulator (renderer)'),
  ])
];

const HowToUse = () => [
  h('h2', {}, 'How to use react'),
  h('p', {}, 'Create components, render them, observe html.'),
  h('pre', { style: { 'white-space': 'break-spaces' }},
`const Component = (props) =>
  <h1>\`Hello \${props.name}\`</h1>

render(
  <Component>,
  document.body
);`
  ),
];

const Terms = () => [
  h('h2', {}, 'Terms'),
  h('ul', {}, [
    h('li', {}, 'Node'),
    h('li', {}, 'Props'),
    h('li', {}, 'Component'),
    h('li', {}, 'Resolve'),
    h('li', {}, 'Commit'),
    h('li', {}, 'Diff'),
    h('li', {}, 'Graph'),
    h('li', {}, 'Event'),
  ]),
];

const Diagram = () => [
  h(SVG, { height: 100, width: 100 }, [
    h(Circle, { position: { x: 50, y: 50 }, radius: 25, fill: 'red' }, [
      h(Text, { position: { x: 50, y: 50 } }, 'Hello There!')
    ])
  ]),
];

const storedIndex = window.localStorage.getItem('slide_index');

export const Intro/*: Component<{}>*/ = (_, __, { useState }) => {
  const slides = [
    h(TitleSlide, null, h(FromScratchTitle)),
    h(Slide, null, h(Why)),
    h(Slide, null, h(WhatIsReact)),
    h(Slide, null, h(HowToUse)),
    h(TitleSlide, null, h('h2', {}, 'The DOM')),
    h(TitleSlide, null, h('h2', {}, 'The Virtual Tree')),
    h(Slide, null, h(Terms)),
    h(Slide, null, h('p', {}, 'The virtual tree is a representation of what we want the dom to look like')),
    h(Slide, null, h('p', {}, 'Leaf components are driven by inputs from lower components')),
    h(TitleSlide, null, h('h2', {}, 'Starting Simple')),
    h(Slide, null, h(Diagram)),
  ];
  const [index, setIndex] = useState(storedIndex ? parseInt(storedIndex) : 0);
  const changeIndex = (newIndex) => {
    window.localStorage.setItem('slide_index', newIndex);
    setIndex(newIndex);
  };
  return [
    h(SlideControls, { count: slides.length, index, onIndexChange: changeIndex }),
    slides[index] || null,
  ];
};