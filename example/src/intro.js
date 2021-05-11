// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { Vector2 } from './diagram'; */
import { h } from '@lukekaalim/act/html';
import { DiagramVertex, DiagramRoot, DiagramEdge } from './diagram.js';
import { SlideControls, Slide, TitleSlide, BorderlessSlide, loadUseSlideState } from './slides.js';
import { CodeBlock } from './code.js';

const FromScratchTitle = () => [
  h('h2', {}, 'React from Scratch!'),
  h('p', {}, h('strong', {}, 'with Luke Kaalim'))
];
const Topic = () => [
  h('h2', {}, 'Topics for brownbag'),
  h('ol', {}, [
    h('h3', {}, 'Part 1'),
    h('li', {}, 'Journeying into breaking apart react'),
    h('li', {}, 'Starting piece by piece with a simple component'),
    h('li', {}, 'Building a graph diffing program'),
    h('h3', {}, 'Part 2'),
    h('li', {}, 'Storing internal state'),
    h('li', {}, 'Putting together the hooks'),
    h('li', {}, 'Emitting diff events'),
  ]),
];
const Why = ({ active }, __, { useHooks }) => {
  const useSlideState = useHooks(loadUseSlideState);
  const state = useSlideState(active, 3)
  return [
    h('h2', {}, 'Why?'),
    h('p', {}, `Why should we spend the time and effort to delve into the guts of react?`),
    h('ol', {}, [
      h('details', { open: state > 0 }, [
        h('summary', {}, h('h3', { style: { display: 'inline' } }, 'For fun')),
        h('li', {}, 'Felt accomplished to figure this out'),
        h('li', {}, 'Can experiment with different \'react-like\' api styles'),
      ]),
      h('details', { open: state > 1 }, [
        h('summary', {}, h('h3', { style: { display: 'inline' } }, 'For education')),
        h('li', {}, 'Taking a look at the guts of react help us understand how to use react better.'),
        h('li', {}, 'Can now build all kind of renders for all kind of different things!'),
      ]),
      h('details', { open: state > 2 }, [
        h('summary', {}, h('h3', { style: { display: 'inline' } }, 'For stubbornness')),
        h('li', {}, 'React feels overkill for smaller projects'),
        h('li', {}, 'Preact doesn\'t support alternative reconcilers'),
        h('li', {}, 'react-three-fiber feels weird'),
      ]),
    ]),
  ];
};
const WhatIsReact = () => [
  h('h2', {}, 'What is react?'),
  h(CodeBlock, null, `import React from 'react';\nimport ReactDOM from 'react-dom';`),
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
  h(CodeBlock, null, [
`const `, h('strong', {}, `Component`), ` = (props) =>
  <h1>\`Hello \${props.name}\`</h1>

render(
  <Component>,
  document.body
);`]
  ),
];

const StateDetails = ({ open, summary, details }) => {
  return h('details', { open }, [
    h('summary', {}, summary),
    details,
  ]);
};

const Terms = ({ active }, __, { useHooks }) => {
  const useSlideState = useHooks(loadUseSlideState);
  const state = useSlideState(active, 7)
  return [
    h('h2', {}, 'React Terms'),
    h('ul', {}, [
      h('li', {}, h(StateDetails, { open: state === 1, summary: 'Node', details: 'The return value of a Component' })),
      h('li', {}, h(StateDetails, { open: state === 2, summary: 'Props', details: 'The return value of a Component' })),
      h('li', {}, h(StateDetails, { open: state === 3, summary: 'Component', details: 'The return value of a Component' })),
    ]),
    h('div', { style: { flexGrow: 1 } }),
    h('div', {}, [
      state === 1 ? h(CodeBlock, { key: 0 }, `const node = <div>Example</div>;\nconst node = h('div', {}, 'Example')`) : null,
      state === 2 ? h(CodeBlock, { key: 1 }, `const props = { person: luke, onClick: () => changeState() }`) : null,
      null,
    ])
  ];
};

const countLeaves = leaves =>
  leaves.reduce((acc, curr) => acc + Math.max(countLeaves(curr.leaves), 1), 0);

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

const TreeDiagram/*: Component<TreeDiagramProps>*/ = ({ tree, position, offset = { x: 100, y: 100 } }) => {
  const totalLeaves = countLeaves(tree.leaves)
  
  return [
    tree.leaves.map((leaf, index) => {
      const left = tree.leaves.slice(0, index);
      const leafPosition = {
        y: position.y - offset.y,
        x: position.x - (((totalLeaves - 1) * offset.x) / 2)  + ((countLeaves(left) / 1) * offset.x)
      };
      return [
        h(DiagramEdge, { start: position, end: leafPosition }),
        h(TreeDiagram, { tree: leaf, position: leafPosition, offset }),
      ];
    }),
    h(DiagramVertex, { position, label: tree.content }),
  ];
};

const Diagram/*: Component<mixed>*/ = () => {
  const position = { x: 1024/2, y: (512 + 256) - 64};
  
  const tree = {
    content: 'root-node',
    leaves: [],
  }

  return (
    h(DiagramRoot, { size: { y: 512 + 256, x: 1024 } }, [
      h(TreeDiagram, { position, tree, offset: { x: 130, y: 75 } })
    ])
  );
};

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
  const transform = `translate3d(-${index * 1024}px, 0px, 0px)`;
  const sliderStyle = { ...sliderDefaultStyle, transform };

  return h('section', { style: presenterStyle }, h('ul', { style: sliderStyle }, slides.map((slide, slideIndex) => {
    const distance = index - slideIndex;
    const absDistance = Math.abs(distance);
    const distanceUnit = distance/absDistance;
    const clampedDistance = Math.min(absDistance, 2);
    const transform = `scale(${1 - (clampedDistance * 0.1)}) rotateY(${-(distanceUnit * clampedDistance) * 20}deg) translateZ(${-clampedDistance * 200}px)`;
    const opacity = Math.max(1 - (clampedDistance * 0.4), 0);
    const style = { ...slideShowItemDefaultType, opacity, transform, zIndex: slideIndex === index ? 1 : 0 }
    return h('li', { style }, slide)
  })))
};

const introStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'absolute',
  transition: 'background-color 2s'
};
const calculateBackgroundColor = index => {
  switch (index) {
    default:
      return '#8688e8';
    case 0:
      return '#f4e0cb';
  }
}

export const Intro/*: Component<{}>*/ = (_, __, { useState }) => {
  const [index, setIndex] = useState(storedIndex ? parseInt(storedIndex) : 0);
  const changeIndex = (newIndex) => {
    window.localStorage.setItem('slide_index', newIndex);
    setIndex(newIndex);
  };

  const slides = [
    h(TitleSlide, null, h(FromScratchTitle, { active: index === 0 })),
    h(Slide, null, h(Topic, { active: index === 1 })),
    h(TitleSlide, null, h('h2', {}, 'Part One: The Reconciler')),
    h(Slide, null, h(Why, { active: index === 3 })),
    h(Slide, null, h(WhatIsReact, { active: index === 4 })),
    h(Slide, null, h(HowToUse)),
    h(TitleSlide, null, h('h2', {}, 'The DOM')),
    h(TitleSlide, null, h('h2', {}, 'The Virtual Tree')),
    h(Slide, null, h(Terms, { active: index === 8 })),
    h(Slide, null, h('p', {}, 'The virtual tree is a representation of what we want the dom to look like')),
    h(Slide, null, h('p', {}, 'Leaf components are driven by inputs from lower components')),
    h(TitleSlide, null, h('h2', {}, 'Starting Simple')),
    h(BorderlessSlide, null, h(Diagram)),
  ];

  return h('section', { style: { ...introStyle, backgroundColor: calculateBackgroundColor(index) } }, [
    h(SlideControls, { count: slides.length, index, onIndexChange: changeIndex, visible: false }),
    h(SlideShow, { slides, index }),
  ]);
};
