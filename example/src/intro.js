// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import { h } from '@lukekaalim/act/html';
import { Circle, SVG, Text, Rect } from './diagram.js';
import { SlideControls, Slide, TitleSlide, BorderlessSlide } from './slides.js';

const FromScratchTitle = () => [
  h('h2', {}, 'React from Scratch!'),
  h('p', {}, 'with Luke Kaalim')
];
const Why = () => [
  h('h2', {}, 'Why?'),
  h('p', {}, `Why should we spend the time and effort to delve into the guts of react?`),
  h('ol', {}, [
    h('details', {}, [
      h('summary', {}, h('h3', { style: { display: 'inline' } }, 'For fun')),
      h('li', {}, 'Felt accomplished to figure this out'),
      h('li', {}, 'Can experiment with different \'react-like\' api styles'),
    ]),
    h('details', {}, [
      h('summary', {}, h('h3', { style: { display: 'inline' } }, 'For education')),
      h('li', {}, 'Taking a look at the guts of react help us understand how to use react better.'),
      h('li', {}, 'Can now build all kind of renders for all kind of different things!'),
    ]),
    h('details', {}, [
      h('summary', {}, h('h3', { style: { display: 'inline' } }, 'For stubbornness')),
      h('li', {}, 'Preact doesn\'t support alternative reconcilers')
    ]),
  ]),
];
const WhatIsReact = () => [
  h('h2', {}, 'What is react?'),
  h('p', {}, 'What specifically is in the family of "react" tools?'),
  h('p', {}, 'What can you actually do with them?'),
  h('ul', {}, [
    h('li', {}, 'React IS a declarative graph rendering tool'),
    h('li', {}, 'React IS a generic tree differ (reconciler)'),
    h('li', {}, 'ReactDOM IS a DOM manipulator (renderer)'),
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
  h(SVG, { height: 512 + 256, width: 1024 }, [
    h(Circle, { position: { x: 50, y: 50 }, radius: 25, fill: 'red' }),
    h('svg:rect', { x: '400px', y: '400px', width: '100px', height: '100px', stroke: 'black', fill: 'none' }),
    h('svg:text', { x: '400px', y: '400px', width: '100px', height: '100px', 'text-anchor': "start" }, 'Hello There!'),
  ]),
];

const storedIndex = window.localStorage.getItem('slide_index');

const sliderDefaultStyle = {
  display: 'flex',
  listStyle: 'none',
  width: '1024px',
  margin: 0,
  padding: 0,
  flexDirection: 'row',
  transition: 'transform 0.5s',
  transformStyle: 'preserve-3d'
};

const slideShowItemDefaultType = {
  transition: 'opacity 0.5s, transform 0.5s'
};

const presenterStyle = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  overflow: 'hidden',
  width: '100vw',
  perspective: '100vw',
};

const SlideShow = ({ slides, index }) => {
  const transform = `translate3d(-${index * 1024}px, 0, 0)`;
  const sliderStyle = { ...sliderDefaultStyle, transform };

  return h('section', { style: presenterStyle }, h('ul', { style: sliderStyle }, slides.map((slide, slideIndex) => {
    const distance = index - slideIndex;
    const absDistance = Math.abs(distance);
    const transform = `scale(${1 - (absDistance * 0.1)}) rotateY(${-distance * 20}deg) translateZ(${-absDistance * 200}px)`;
    const opacity = Math.max(1 - (absDistance * 0.4), 0);
    const style = { ...slideShowItemDefaultType, opacity, transform, zIndex: slideIndex === index ? 1 : 0 }
    return h('li', { style }, slide)
  })))
};

export const Intro/*: Component<{}>*/ = (_, __, { useState }) => {
  const [index, setIndex] = useState(storedIndex ? parseInt(storedIndex) : 0);
  const changeIndex = (newIndex) => {
    window.localStorage.setItem('slide_index', newIndex);
    setIndex(newIndex);
  };

  const slides = [
    h(TitleSlide, null, h(FromScratchTitle)),
    h(TitleSlide, null, h('h2', {}, 'Part One: The Reconciler')),
    h(Slide, null, h(Why)),
    h(Slide, null, h(WhatIsReact)),
    h(Slide, null, h(HowToUse)),
    h(TitleSlide, null, h('h2', {}, 'The DOM')),
    h(TitleSlide, null, h('h2', {}, 'The Virtual Tree')),
    h(Slide, null, h(Terms)),
    h(Slide, null, h('p', {}, 'The virtual tree is a representation of what we want the dom to look like')),
    h(Slide, null, h('p', {}, 'Leaf components are driven by inputs from lower components')),
    h(TitleSlide, null, h('h2', {}, 'Starting Simple')),
    h(BorderlessSlide, null, h(Diagram)),
  ];

  return [
    h(SlideControls, { count: slides.length, index, onIndexChange: changeIndex, visible: true }),
    h(SlideShow, { slides, index }),
  ];
};