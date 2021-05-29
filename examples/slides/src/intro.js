// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { Vector2, TreeNode } from './diagram'; */
import { h } from '@lukekaalim/act';
import { DiagramRoot, TreeDiagram } from './diagram.js';
import { SlideControls, SlideShow, loadUseSlideState, BorderlessSlide } from './slides.js';
import { CodeBlock, EditableCodeBlock } from './code.js';

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
const Why = ({ active }, __, { hooks }) => {
  const useSlideState = loadUseSlideState(hooks);
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
  h(CodeBlock, {}, `import React from 'react';\nimport ReactDOM from 'react-dom';`),
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

const HowToUse = ({ active }, __, { useState, hooks }) => {
  const [name, setName] = useState('luke');
  const useSlide = loadUseSlideState(hooks);
  const state = useSlide(active, 1);
  return [
    state,
    h('h2', {}, 'How to use react'),
    h('p', {}, 'Define component functions, create elements inside them, and render them.'),
    h(CodeBlock, {}, [
  `const `, h('em', {}, `Component`), ` = (props) =>
    <h1>\`Hello \${${state === 0 ? 'props.name' : name}}\`</h1>
  
  render(
    <Component>,
    document.body
  );`]
    ),
    h('div', { style: { opacity: state === 1 ? 1 : 0, transition: 'opacity 0.2s' } }, [
      h(CodeBlock, {}, [
        `props = { name: '`,
        h('input', { style: propEntryStyle, value: name, onInput: e => setName(e.currentTarget.value) }), 
        `' }`]),
      h('section', { style: componentPreviewStyle },
        h('h1', {}, `Hello ${name}`))
    ])
  ]
};

const ReactAndTheDOM = () => {
  return [
    h('h2', {}, `React and the DOM`),
    h('p', {}, [
      `The elements that we create have a "type", which is the name of the `,
      h('strong', {}, `DOM Node`),
      ` they represent`
    ]),
    h('p', {}, `DOM Nodes may have an internal state, have special attributes
    that govern interactivity or appearance, and have semantic meaning
    in the document.`),
    h('p', {}, `DOM Nodes are also hierarchical; They can sometimes have
    children of varying types nested inside them.`),
    h('form', { width: '50%', onSubmit: e => e.preventDefault() }, [
      h('button', { style: { background: 'initial' } }, 'A Button'),
      h('input', { type: 'text' }),
      h('input', { type: 'date' }),
      h('input', { type: 'time' }),
      h('h2', {}, 'Heading'),
      h('p', {}, 'Paragraph text'),
      h('pre', {}, 'Preformatted text'),
    ]),
  ]
}

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
        h('summary', {}, activeTermIndex === index ? h('strong', {}, summary) : summary),
        h('p', {}, details)]))
  ));
};

export const FirstTerms/*: Component<{ active: boolean }>*/ = ({ active }, __, { hooks }) => {
  const useSlideState = loadUseSlideState(hooks);
  const state = useSlideState(active, reactTerms.length);

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

const graphTerms = [
  ['Tree',
    `A type of Graph, which is composed of a root Node,
    which itself has Child nodes that are also trees.`],
  ['Node', 
    `A Node is an element of a tree. A node may have zero or more child
    nodes. If a node has zero children, sometimes it is called a Leaf.`],
  ['Vertices and Edges',
    `Sometimes when talking about Graphs, the Terms Vertex and Edge are used.
    A Vertex is just a Node, and an Edge is the connecting line between nodes.
    In our case, every child node has a Edge to it's parent Vertex.`],
  ['Digraph',
    `A Digraph is a Graph with edges have a "direction". That is, they only point one way.
    Our tree is a Digraph, in that only the parent has a reference to the child.`]
]

const AboutGraphs = ({ active }, __, { hooks }) => {
  const useSlideState = loadUseSlideState(hooks);
  const state = useSlideState(active, graphTerms.length);

  return [
    h('h2', {}, 'Graph Terms'),
    h('p', {},
      `Since any Element may have zero or more children, you can represent
      an Element as a Tree, which is a type of Graph.`),
    h(Terms, { activeTermIndex: state - 1, terms: graphTerms })
  ]
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
      ` as it's more concise.`
    ]),
    h('p', {},
      [`And we'll be renaming `, h('strong', {}, `"elements"`), ` to `, h('strong', {}, `"node"`), ` for
      this purpose, since were be talking about the in the context
      of graphs for a bit.`]),
  ];
};

const initialGraphCode = 
`h('body', {}, [
  h('header', {}, h('h1', {}, 'Hello')),
  h('p', {}, 'World'),
])`;
const pragma = (content, _, leaves) => {
  if (Array.isArray(leaves))
    return { content, leaves };
  else if (!leaves)
    return { content, leaves: [] };
  else if (typeof leaves === 'string')
    return { content, leaves: [{ content: `"${leaves}"`, leaves: [] }] };
  else if (typeof leaves === 'object')
    return { content, leaves: [leaves] };
  else
    throw new Error('Unexpected child value');
};
const isValidTree = (tree) => {
  const isValidContent = typeof tree.content === 'string';
  const isValidLeaves = Array.isArray(tree.leaves) && tree.leaves.every(isValidTree);

  return isValidContent && isValidLeaves;
};

const getTreeNodeFromExpression = (treeExpression/*: string*/)/*: ?TreeNode*/ => {
  try {
    const codeFunction = new Function('h', `return ${treeExpression}`);
    return ((codeFunction/*: Function*/)/*: (h: typeof pragma) => TreeNode*/)(pragma);
  } catch (error) {
    return null;
  }
};

const initialTree = getTreeNodeFromExpression(initialGraphCode) || { content: 'bad code', leaves: [] };

const NodesAsGraphs = (_, __, { useState }) => {
  const diagramSize = { x: 1024, y: 324 };
  const [tree, setTree] = useState/*:: <TreeNode>*/(initialTree);
  const onTextInput = newExpression => {
    const newTree = getTreeNodeFromExpression(newExpression)
    if (newTree && isValidTree(newTree) && newTree)
      setTree(newTree)
  }
  return [
    h('div', { style: { padding: '64px 64px 0 64px' } }, [
      h('h2', {}, 'Component + Props == Tree'),
      h('p', {}, 'A component renders an element, which may have more elements itself as children.'),
      h(EditableCodeBlock, { text: initialGraphCode, onTextInput }, )
    ]),
    h(DiagramRoot, { size: diagramSize }, [
      h(TreeDiagram, { position: { x: diagramSize.x/2, y: diagramSize.y - 64 }, tree, offset: { x: 256, y: 64 } })
    ])
  ];
};

const BuildingElementDataStructure = ({ active }, __, { hooks }) => {
  const useSlideState = loadUseSlideState(hooks);
  const state = useSlideState(active, 2);
  return [
    h('h2', {}, 'Building Element Data Structure'),
    h('p', {},
      `We\'ve invoked the createElement function, but if we were
      to build it ourselves, what would it look like?`),
    
    state === 0 && [
      h('h4', { style: { margin: 0 } }, 'Type Declaration'),
      h('p', {}, 'We need to encode the \'type\' of node it will be, any props it has, and it\'s children (which should also be nodes).'),
      h(CodeBlock, {}, [
        `type `,
        h('strong', {}, 'Element'),
        ` = {\n  type: string,\n  props: { [string]: mixed },\n  children: string | Element[]\n}`
      ])
    ],
    state === 1 && [
      h('h4', { style: { margin: 0 } }, 'Constructor'),
      h('p', {}, 'Props and Children should be optional, so you can call them with only the type, which is mandatory.'),
      h(CodeBlock, {}, [
        `const `,
        h('strong', {}, 'createElement'),
        ` = (\n  type: string,\n  props: { [string]: mixed } = {},\n  children: string | Element[] = []\n): Element => ({\n  type,\n  props,\n  children\n})`
      ]),
    ],
    state === 2 && [
      h('h4', { style: { margin: 0 } }, 'Example Invocation'),
      h('p', {},
        `...`),
      h(CodeBlock, {}, [
        `const `,
        h('strong', {}, 'element'),
        ` = `,
        h('strong', {}, 'createElement'), `(\n  'button',\n  { onClick: myOnClick },\n  'Press this button!'\n)`
      ]),
    ],
  ]
};

const rendererCode =
`const createDOMElement = (node: Element): HTMLElement => {

  const element = document.createElement(node.type);

  for (const [prop, value] of Object.entries(node.props))
    element[prop] = value;

  if (typeof node.children === 'string') {
    const child = document.createTextNode(node.children);
    
    element.appendChild(child);
  } else {
    const childElements = node
      .children
      .map(createDOMElement)
    
    for (const childElement of childElements)
      element.appendChild(childElement);
  }

  return element;
}`;

const SoWeHaveATree = () => {
  return [
    h('h2', {}, 'So we have a Tree'),
    h('p', {}, 'Now what?'),
    h('p', {}, 'We\'ll, we can "walk" that tree, visiting each node, and create a DOM element that represents it.'),
    h('p', {}, 'Lets write a recursive function that can create a DOM node of the right type for each traversal.'),
  ]
}

const SimpleRenderer = () => {
  return [
    h(CodeBlock, {}, rendererCode)
  ]
}

/*::
export type ExampleNode = {
  type: string,
  props: { [string]: mixed },
  children: ExampleNode[] | string,
};
*/

const createDOMElement = (node/*: ExampleNode*/)/*: HTMLElement*/ => {
  const element = document.createElement(node.type);
  for (const [prop, value] of Object.entries(node.props))
    (element/*: Object*/)[prop] = value;
  if (typeof node.children === 'string')
    element.appendChild(document.createTextNode(node.children));
  else
    for (const childElement of node.children.map(createDOMElement))
      element.appendChild(childElement);
  return element;
}

const initialComponent = 
`h('p', {}, 'hello!')`;

const nodePragma = (type, props = {}, children = []) => ({
  type,
  props,
  children,
});

const exampleNodeToTree = (node) => ({
  content: node.type,
  leaves: typeof node.children === 'string' ? [{ content: `"${node.children}"`, leaves: [] }] : node.children.map(exampleNodeToTree),
})

const createExampleNodesFromExpression = (nodeExpression/*: string*/)/*: ExampleNode*/ => {
  try {
    const codeFunction = new Function('h', `return ${nodeExpression}`);
    return ((codeFunction/*: Function*/)/*: (h: typeof nodePragma) => ExampleNode*/)(nodePragma);
  } catch (error) {
    return { type: 'pre', props: {}, children: 'error in code!' };
  }
};

const initialExampleTree = exampleNodeToTree(createExampleNodesFromExpression(initialComponent));

const rendererSectionStyle = {
  border: '1px solid black',
  height: '128px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  overflowY: 'scroll',
  backgroundColor: 'white'
};

const SimpleRendererTest = (_, __, { useState }) => {
  const diagramSize = { x: 1024 - 128, y: 209 };
  const [expressionCode, setExpressionCode] = useState/*:: <string>*/(initialComponent);
  const [rootElement, setElement] = useState/*:: <?HTMLElement>*/(null);
  const [tree, setTree] = useState/*:: <TreeNode>*/(initialExampleTree);

  const onRenderClick = () => {
    if (!rootElement)
      return;
    if (rootElement.children[0])
      rootElement.removeChild(rootElement.children[0]);
    try {
      const node = createExampleNodesFromExpression(expressionCode);
      setTree(exampleNodeToTree(node));
      const element = createDOMElement(node)
      rootElement.appendChild(element);
    } catch (error) {}
  };

  return [
    h('h2', {}, 'Try out the simple renderer!'),
    h(EditableCodeBlock, { text: expressionCode, onTextChange: setExpressionCode }),
    h('button', { onClick: onRenderClick, style: { fontSize: '24px', maring: '12px', width: '256px' } }, 'Render'),
    h('section', { style: rendererSectionStyle, onDOMRef: setElement }),
    h(DiagramRoot, { size: diagramSize }, [
      h(TreeDiagram, { position: { x: diagramSize.x/2, y: diagramSize.y - 32 }, tree, offset: { x: 256, y: 64 } })
    ])
  ]
};

const Downsides = ({ active }, _, { hooks }) => {
  const useSlideState = loadUseSlideState(hooks);
  const state = useSlideState(active, 2);
  
  return [
    h('h2', {}, 'Downsides to Simple Renderer'),
    h('p', {}, 'There are some downtimes to this super simple renderer, unfortunatley'),
    h('ul', {}, [
      h('details', { open: state > 0 }, [
        h('summary', {}, h('h3', { style: { display: 'inline' } }, 'Performance')),
        h('li', {}, 'As we generate a "new" tree each time, we need to remove all the previous nodes and "remount" a new tree.'),
        h('li', {}, `This is inefficient, as inserting and removing DOM Elements is expensive. And we do this to every element, every re-render.`),
      ]),
      h('details', { open: state > 1 }, [
        h('summary', {}, h('h3', { style: { display: 'inline' } }, 'State')),
        h('li', {}, 'Deleting and Re-creating elements destroys their internal state.'),
        h('li', {}, 'Text fields, checkboxes, forms, they\'ll all lose whatever internal data they were tracking.'),
        h('li', {}, 'We cant build components that can keep state if we destroy it every change.'),
      ]),
    ]),
  ]
}

const Reconciler = () => {
  const diagramSize = { x: 512, y: 256 };

  const oldTree = {
    content: 'body',
    leaves: [{
      content: 'h1',
      leaves: [{
        content: '"my title"',
        leaves: [],
      }],
    },{
      content: 'p',
      leaves: [{
        content: '"my text"',
        leaves: [],
      }],
    }],
  };
  const newTree = {
    content: { text: 'body', color: 'yellow' },
    leaves: [{
      content: 'h1',
      leaves: [{
        content: '"my title"',
        leaves: [],
      }],
    },{
      content: { text: 'p', color: 'yellow' },
      leaves: [{
        content: { text: '"my new text!"', color: 'orange' },
        leaves: [],
      }],
    }],
  };

  return [
    h('div', { style: { padding: '64px 64px 0 64px' } }, [
      h('h2', {}, 'Reconciler'),
      h('p', {}, `We have to reconcile the "old tree" with the "new tree"
        to figure out what specifically changed, and then update only the elements that changed.`),
      h('p', {}, `In the diagram below, you can yellow nodes are marked as having a child
      changed, and orange nodes being the ones that actually changed.`)
    ]),
    h('div', { style: { display: 'flex' } }, [
      h('div', { style: { display: 'flex', flexGrow: 1, flexDirection: 'column' } }, [
        h('h4', { style: { textAlign: 'center' } }, 'Old'),
        h(DiagramRoot, { size: diagramSize }, [
          h(TreeDiagram, { position: { x: diagramSize.x/2, y: diagramSize.y - 32 }, tree: oldTree, offset: { x: 256, y: 64 } })
        ]),
      ]),
      h('div', { style: { display: 'flex', flexGrow: 1, flexDirection: 'column' } }, [
        h('h4', { style: { textAlign: 'center' } }, 'New'),
        h(DiagramRoot, { size: diagramSize }, [
          h(TreeDiagram, { position: { x: diagramSize.x/2, y: diagramSize.y - 32 }, tree: newTree, offset: { x: 256, y: 64 } })
        ])
      ]),
    ]),
  ]
}

const StateList = ({ state, list }) => {

};

const reconcilerAlgorithmRequirementsList = [
  `Types is the same`,
  `Prop "key" is different`,
  `Children`
];

const ReconcilerAlgorithmRequirements = () => {
  return [
    h('h2', {}, 'Reconciler Algorithm Requirements'),
    h('p', {}, `To build a function that:`),
    h('p', {}, `Find nodes that might be the same nodes as last time`),
    h('p', {}, ``),
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

export const Intro/*: Component<{}>*/ = (_, __, { useState }) => {
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
    ['plain', ReactAndTheDOM],
    ['plain', JSXUnderTheHood],
    ['plain', AboutGraphs],
    ['plain', RenameElements],
    ['borderless', NodesAsGraphs],
    ['plain', BuildingElementDataStructure],
    ['plain', SoWeHaveATree],
    ['plain', SimpleRenderer],
    ['plain', SimpleRendererTest],
    ['plain', Downsides],
    ['borderless', Reconciler],
    ['plain', ReconcilerAlgorithmRequirements],
  ];

  return h('section', { style: { ...introStyle, backgroundColor: calculateBackgroundColor(index) } }, [
    h(SlideControls, { count: slides.length, index, onIndexChange: changeIndex, visible: false }),
    h(SlideShow, { slides, index }),
  ]);
};
