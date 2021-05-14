// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { Vector2, TreeNode } from './diagram'; */
import { h } from '@lukekaalim/act/html';
import { DiagramRoot, TreeDiagram } from './diagram.js';
import { SlideControls, SlideShow, loadUseSlideState, BorderlessSlide } from './slides.js';
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

const inlineCodeStyle = {
  backgroundColor: '#714e9b',
  color: 'white',
  padding: '1px 4px 1px 4px',
  borderRadius: '4px'
};

const WhatIsReact = () => [
  h('h2', {}, 'What is react?'),
  h(CodeBlock, null, `import React from 'react';\nimport ReactDOM from 'react-dom';`),
  h('p', {}, 'What specifically is in the family of "react" tools?'),
  h('p', {}, 'What can you actually do with them?'),
  h('ul', {}, [
    h('li', {}, [h('code', { style: inlineCodeStyle }, 'react'), ' is a general use library for creating Components (createElement, useState, ...)']),
    h('li', {}, [h('code', { style: inlineCodeStyle }, 'react-dom'), ' is the specific code for turning components into HTML elements']),
    h('li', {}, [h('code', { style: inlineCodeStyle }, 'react-native'), ' is the specific code for iOS and Android (and a bunch of other stuff)']),
    h('li', {}, 'Etc, etc...')
  ])
];

const componentPreviewStyle = {
  backgroundColor: 'white',
  padding: '32px',
  fontSize: '32px'
};
const propEntryStyle = {
  fontSize: 'inherit',
  padding: '0 8px 0 8px'
};

const HowToUse = ({ active }, __, { useState, useHooks }) => {
  const [name, setName] = useState('luke');
  const useSlide = useHooks(loadUseSlideState);
  const state = useSlide(active, 1);
  return [
    h('h2', {}, 'How to use react'),
    h('p', {}, 'Define component functions, create elements inside them, and render them.'),
    h(CodeBlock, null, [
  `const `, h('em', {}, `Component`), ` = (props) =>
    <h1>\`Hello \${${state === 0 ? 'props.name' : name}}\`</h1>
  
  render(
    <Component>,
    document.body
  );`]
    ),
    h('div', { style: { opacity: state === 1 ? 1 : 0, transition: 'opacity 0.2s' } }, [
      h(CodeBlock, null, [
        `props = { name: '`,
        h('input', { style: propEntryStyle, value: name, onInput: e => setName(e.currentTarget.value) }), 
        `' }`]),
      h('section', { style: componentPreviewStyle },
        h('h1', {}, `Hello ${name}`))
    ])
  ]
};

const reactTerms = [
  ['Element',
    `An element represents a DOM Node to be part of the document. It has a type,
    props, and potentially children`],
  ['Props',
    'Props is a map of values assigned to a name, typically mapped to Attributes in the DOM.'],
  ['Components',
    'A Component is a function that accepts Props, and returns an Element'],
  ['Reconciler',
    `A Reconciler is a program that can determine what Elements changed between
    two renders of a component, instructing a Renderer to update efficiently`],
  ['Renderer',
    `A Renderer consumes a reconcilers commands, and updates the DOM Node
    with the attributes they should have, creating or removing elements
    when nessicarry`]
];

const termsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  listStyle: 'none',
  margin: 0,
  padding: 0,
}

const Terms = ({ activeTermIndex, terms }) => {
  return h('ul', { style: termsListStyle }, terms.map(([summary, details], index) =>
    h('li', {},
      h('details', { open: activeTermIndex === index }, [
        h('summary', {}, activeTermIndex === index ? h('strong', null, summary) : summary),
        h('p', {}, details)]))
  ));
};

export const FirstTerms/*: Component<{ active: boolean }>*/ = ({ active }, __, { useHooks }) => {
  const useSlideState = useHooks(loadUseSlideState);
  const state = useSlideState(active, reactTerms.length + 1);

  return [
    h('h2', {}, 'Basic React Terms'),
    h('p', {}, `Looking at how react is practically used, in terms of writing HTML pages.`),
    h('p', {},
      `(This definitions is similar, but not technically identical to when
        writing react for other platforms, like React Native. Just pretend
        for now pls.)`
    ),
    h(Terms, { activeTermIndex: state - 1, terms: reactTerms }),
  ];
};

const JSXUnderTheHood = (_, __) => {
  return [
    h('h2', {}, 'JSX under the hood'),
    h('p', {},
      `JSX is a special variant of javascript that lets you embed XML like
      syntax into your code. Under the hood, it's translated into calls to
      a function called the "Pragma".`),
    h('p', {}, ['The default pragma is ', h('code', { style: inlineCodeStyle }, 'React.createElement()')]), 
    h(CodeBlock, {}, '<input type="text" value="hello"></input>'),
    h('p', {}, 'becomes'),
    h(CodeBlock, {}, `React.createElement(\n  'input',\n  { type: 'text', value: 'hello' }\n)`),
  ];
};

const RenameElements = () => {
  return [
    h('h2', {}, 'Term clarification'),
    h('p', {}, `For simplicity, we\'ll be using the plain javascript syntax (as in, we'll use the raw pragma) instead of the JSX syntax.`),
    h('p', {}, [
      `We'll be renaming the pragma to `,
      h('code', { style: inlineCodeStyle }, 'h()'),
      ` instead of `,
      h('code', { style: inlineCodeStyle }, 'React.createElement()'),
      `.`
    ]),
    h('p', {},
      [`And we'll be renaming `, h('strong', {}, `"elements"`), ` to `, h('strong', {}, `"node"`), ` for
      this purpose, since were be talking about the in the context
      of graphs for a bit.`]),
  ];
};

const NodesAsGraphs = () => {
  const diagramSize = { x: 1024, y: (512 + 256) / 2 };
  const tree = {
    content: '<body>',
    leaves: [
      {
        content: '<header>',
        leaves: [
          {
            content: '<h1>',
            leaves: [
              {
                content: 'Hello Luke',
                leaves: []
              },
            ]
          },
        ]
      },
      {
        content: '<p>',
        leaves: [
          {
            content: 'Other Content',
            leaves: []
          }
        ]
      }
    ]
  };
  return [
    h('div', { style: { padding: '64px' } }, [
      h('h2', {}, 'Nodes represented by Graphs'),
      h('p', {}, ['Nodes can be represented as an ', h('em', {}, `Tree Graph`), '.']),
      h('p', {}, [`Nodes may have children, which themselves may have more children`]),
    ]),
    h('div', { style: { flexGrow: 1 } }),
    h(DiagramRoot, { size: diagramSize }, [
      h(TreeDiagram, { position: { x: diagramSize.x/2, y: diagramSize.y - 64 }, tree, offset: { x: 512, y: 64 } })
    ])
  ];
};

// lincoln
// weight - branches + 1;

const commitToTree = (commit, length)/*: TreeNode*/ => ({
  content: typeof commit.node.type === 'function' ? commit.node.type.name : commit.node.type.toString(),
  leaves: length > 0 ? commit.childCommits.map(commit => commitToTree(commit, length - 1)) : [],
});

const Diagram/*: Component<{ active: boolean }>*/ = (_, __, { useState }) => {
  const [tree, setTree] = useState({ content: 'none', leaves: [] });

  const buttonHeight = 32;
  const diagramHeight = 512 + 256 - buttonHeight;
  const diagramWidth = 1024;

  const treePosition = { x: diagramWidth/2, y: diagramHeight - 64 };

  return [
    h(DiagramRoot, { size: { y: diagramHeight, x: diagramWidth } }, [
      h(TreeDiagram, { position: treePosition, tree, offset: { x: 130, y: 75 } })
    ])
  ];
};

const storedIndex = window.localStorage.getItem('slide_index');

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

export const Intro/*: Component<mixed>*/ = (_, __, { useState }) => {
  const [index, setIndex] = useState(storedIndex ? parseInt(storedIndex) : 0);
  const changeIndex = (newIndex) => {
    window.localStorage.setItem('slide_index', newIndex);
    setIndex(newIndex);
  };

  const slides = [
    ['title', FromScratchTitle],
    ['plain', Topic],
    ['title', () => h('h2', {}, 'Part One: The Reconciler')],
    ['plain', Why],
    ['plain', WhatIsReact],
    ['plain', FirstTerms],
    ['plain', HowToUse],
    ['plain', JSXUnderTheHood],
    ['plain', RenameElements],
    ['borderless', NodesAsGraphs],
    ['title', () => h('h2', {}, 'The DOM')],
    ['title', () => h('h2', {}, 'The Virtual Tree')],
    ['plain', () => h('p', {}, 'The virtual tree is a representation of what we want the dom to look like')],
    ['plain', () => h('p', {}, 'Leaf components are driven by inputs from lower components')],
    ['title', () => h('h2', {}, 'Starting Simple')],
    ['borderless', Diagram],
  ];

  return h('section', { style: { ...introStyle, backgroundColor: calculateBackgroundColor(index) } }, [
    h(SlideControls, { count: slides.length, index, onIndexChange: changeIndex, visible: false }),
    h(SlideShow, { slides, index }),
  ]);
};
