// @flow strict
/*:: import type { NavigationLink } from "@lukekaalim/act-rehersal"; */
/*:: import type { ElementNode } from "@lukekaalim/act"; */
import { h, useEffect, useMemo, useState } from '@lukekaalim/act';

/*::
import type { TreeGraphNode } from "../libraries/rehersal/rehersal2/graphs/treeGraph";
*/

import actReadmeText from '@lukekaalim/act/README.md?raw';
import styles from './entry.module.css';


import { render } from '@lukekaalim/act-three';
import { useRootNavigation, navigationContext } from '@lukekaalim/act-navigation';

import { Document, Rehersal, GridBench, Markdown } from '@lukekaalim/act-rehersal';
import { componentPage } from './pages/components.js';
import { TabbedToolbox } from "../libraries/rehersal/tools/tabs";
import { rehersalPage, rehersalPages } from './pages/libraries/rehersal.js';
import { markdownPage, markdownRendererPage } from "./pages/libraries/markdown";
import { elementsPage } from './pages/elements.js';
import { quickstartPage } from './pages/quickstart.js';
import { curvePage, curvePages } from './pages/libraries/curve.js';
import { SuspensionTest } from './examples/suspension.js';
import { conceptsPage, conceptsPages } from './pages/concepts';
import { CurveCubeDemo } from './examples/demos.js';
import { TodoManager } from './examples/todo.js';
import { librariesPage, librariesPages } from './pages/libraries.js';
import { rendererPages, webRendererPage } from './pages/renderers.js';
import { rendererPage } from "./pages/renderers";
import { RehersalApp } from '@lukekaalim/act-rehersal/rehersal2/RehersalApp.js';
import { TextBlock } from '@lukekaalim/act-rehersal/rehersal2/components/TextBlock.js';
import { DiagramBlock } from '@lukekaalim/act-rehersal/rehersal2/components/DiagramBlock.js';
import { GraphPicture } from '@lukekaalim/act-rehersal/rehersal2/components/GraphPicture.js';
import { createId } from "../library/ids";
import { calculateTreeNodesEdges } from "../libraries/rehersal/rehersal2/graphs/treeGraph";
import { MarkdownBlock } from '@lukekaalim/act-rehersal/rehersal2/components/MarkdownBlock';
import { testDocPage } from '../libraries/testdoc/page';


/*::
export type Page = {
  link: NavigationLink,
  content: ElementNode
};
*/

const directives = {
  demos: () => {
    return h('div', { style: { display: 'flex', flexDirection: 'column' } }, [
      h('div', { style: { margin: 'auto', display: 'flex' }}, [
        h(CurveCubeDemo),
        h(TodoManager, { initialTasks: ['Write Documentation', 'Finish D&D Prep', 'Cook Dinner'] }),
      ])
    ]);
  }
};

const rootPage = {
  link: { name: '@lukekaalim/act', href: '/', children: [
    //quickstartPage.link,
    conceptsPage.link,
    rendererPage.link,
    librariesPage.link,
    { name: 'Internals', children: [], href: null },
  ] },
  content: h(Document, {}, h(Markdown, { text: actReadmeText, directives }))
};


const pages = [
  rootPage,
  quickstartPage,
  ...conceptsPages,
  ...librariesPages,
  ...rendererPages
];

const DocsApp = () => {
  const navigation = useRootNavigation();

  const onLinkClick = (event, link) => {
    event.preventDefault();
    if (link.href)
      navigation.navigate(new URL(link.href, navigation.location));
  }

  const page = pages.find(p => p.link.href === navigation.location.pathname)

  if (!page)
    return null;

  const onClick = (e) => {
    const anchor = e.composedPath().find(e => e.tagName === 'A');
    if (!e.defaultPrevented && anchor && anchor.href) {
      const url = new URL(anchor.href);
      if (url.origin !== document.location.origin)
        return;
      e.preventDefault();
      if (navigation.location.href === url.href) {
        if (!url.hash)
          return;
        const target = document.getElementById(url.hash.substring(1));
        if (!target)
          return;
        target.scrollIntoView({ behavior: 'smooth' });
      }
      navigation.navigate(url)
    }
  };

  useEffect(() => {
    if (!navigation.location.hash)
      return;
    const target = document.getElementById(navigation.location.hash.substring(1));
    if (!target)
      return;
    target.scrollIntoView({ behavior: 'smooth' });
  }, [navigation.location.hash])

  return h(Rehersal, { rootLink: rootPage.link, selectedLink: page.link, onLinkClick },
    h('div', { onClick }, page.content))
};

const ErrorFallback = ({ value }) => {
  useEffect(() => {
    console.error(value);
  }, [value])

  return [
    h('pre', {}, value.message),
    h('pre', {}, value.stack),
  ];
}

const Weird = () => {
  const [aOrB, setAOrB] = useState/*::<number>*/(0);

  const trees = [treeA, treeB, treeC]

  useEffect(() => {
    setInterval(() => {
      setAOrB(aOrB => (aOrB + 1) % trees.length)
    }, 2000)
  }, [])
  
  const tree = trees[aOrB];
  const result = calculateTreeNodesEdges([tree]);
  const nodes = result.flatMap(r => r.nodes);
  const edges = result.flatMap(r => r.edges);

  return [
    useMemo(() => {
      return h(GraphPicture, {
        edges,
        nodes
      })
    }, [aOrB])
  ];
}

const treeA/*: TreeGraphNode*/ = {
  id: 'root',
  content: 'root',
  children: [
    { content: 'hello', id: 'hello', children: [
      { content: 'world', id: 'world' }
    ] },
    { id: 'child', content: h('button', {}, 'A Child'), children: [
      { content: 'balance?', id: 'ba' },
      { content: 'balance?', id: 'bb' },
    ] }
  ],
}

const treeB/*: TreeGraphNode*/ = {
  id: 'root',
  content: 'root',
  children: [
    { content: 'hello', id: 'hello', children: [
      { content: 'really' },
      { content: 'really' },
      { content: 'really', children: [
        { content: 'deep' },
        { content: 'nesting' },
        { content: 'nesting' },
      ] },
      { content: 'world', id: 'world' },
    ] },
    { id: 'child', content: 'a child!' }
  ]
}

const treeC/*: TreeGraphNode*/ = {
  id: 'root',
  content: 'root',
  children: [
    { content: 'hello', id: 'hello', children: [
      { content: 'world', id: 'world' },
      { content: 'balance?' },
      { content: 'balance?' },
    ] },
    { id: 'child', content: h('button', {}, 'A Child'), children: [
      { content: 'balance?', id: 'ba' },
      { content: 'balance?', id: 'bb' },
      { content: 'balance?', children: [
        { content: 'balance?' },
        { content: 'balance?' },
      ] },
      { content: 'balance?' },
    ] }
  ],
}


const result = calculateTreeNodesEdges([treeA]);
const nodes = result.flatMap(r => r.nodes);
const edges = result.flatMap(r => r.edges);

const DocsApp2 = () => {
  const homePage = {
    id: 'home',
    title: '🌠 @lukekaalim/act',
    path: '/',
    content: h(MarkdownBlock, { input: { type: 'text', text: actReadmeText }, directives }),
    subsections: [],
    children: [
      quickstartPage,
      conceptsPage,
      testDocPage,
      {
        id: '1',
        title: 'Child Page',
        path: '/child',
        content: [
          h(DiagramBlock, { bounding: { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY }, style: { height: '40em' } }, [
            /*h('div', { style: {
              backgroundColor: 'white',
              borderRadius: '4px',
              border: '1px solid black',
              padding: '4px'
            }}, [
              h('button', {}, 'Sample Button')
            ]),
            */
            h(Weird)
          ]),
          h(TextBlock, {}, [
            h('h1', {}, 'Well, is this a nice graph'),
            h('p', {}, 'I hope you like it!')
          ])
        ],
        children: [],
        subsections: [],
      },
      {
        id: '2',
        title: 'Child Page 2',
        path: '/child2',
        content: h(TextBlock, {}, [
          h('h1', {}, 'Greetings!'),
          h('p', {}, 'This is a slightly longer paragraph!')
        ]),
        children: [],
        subsections: [],
      },
      {
        id: '3',
        title: 'Child Page 3',
        path: '/child3',
        content: h('h1', {}, 'Hello'),
        children: [
          {
            id: '4',
            title: 'Child Page 4',
            path: '/child3/4',
            content: h('h1', {}, 'World'),
            children: [],
            subsections: [],
          },
        ],
        subsections: [],
      },
    ]
  }

  return h(RehersalApp, { pages: [homePage] })
}

const main = () => {
  const { body } = document;
  if (body)
    render(h(DocsApp2), body);
};

main();