// @flow strict
/*:: import type { ElementNode } from "@lukekaalim/act"; */
import { h, useEffect, useMemo, useState } from '@lukekaalim/act';

import actReadmeText from '@lukekaalim/act/README.md?raw';
import styles from './entry.module.css';


import { render } from '@lukekaalim/act-three';
import { useRootNavigation, navigationContext } from '@lukekaalim/act-navigation';
import { quickstartPage } from './pages/quickstart.js';
import { conceptsPage } from './pages/concepts';
import { CurveCubeDemo } from './examples/demos.js';
import { TodoManager } from './examples/todo.js';
import { RehersalApp, TextBlock, DiagramBlock, GraphPicture, MarkdownBlock, calculateTreeNodesEdges } from '@lukekaalim/act-rehersal';
import { libraryPage } from './pages/libraries';


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

const DocsApp2 = () => {
  const homePage = {
    id: 'home',
    title: '@lukekaalim/act',
    path: '/',
    content: h(MarkdownBlock, { input: { type: 'text', text: actReadmeText }, directives }),
    searchableText: async () => actReadmeText,
    subsections: [],
    children: [
      quickstartPage,
      conceptsPage,
      libraryPage,
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