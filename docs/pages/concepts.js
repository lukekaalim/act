// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { Page } from '../entry.js'; */
/*::
import type { RehersalPage } from "../../libraries/rehersal/rehersal2/pages";
*/
import { h } from '@lukekaalim/act';
import { Document, ExportDescription, Markdown, SyntaxCode, TypeDocumentation } from '@lukekaalim/act-rehersal';
import { MarkdownNode } from '@lukekaalim/act-markdown';
import JSON5 from 'json5';

import conceptsText from './concepts.md?raw';
import { MarkdownBlock } from '@lukekaalim/act-rehersal/rehersal2/components/MarkdownBlock';

const HelloExample = () => {
  const greet = () => {
    alert('Hello!');
  }
  return h('button', { id: 'hello', onClick: () => greet() }, 'Hello, World!');
}

const LabeledCircle/*: Component<{ x: string, y: string, r?: number }>*/ = ({ x, y, children, r = 30 }) => {
  return [
    h('circle', { cx: x, cy: y, r: `${r}px`, stroke: 'black', fill: 'none' }),
    h('text', { x: x, y: y, 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, children),
  ]
}

const ComponentDiagram = () => {
  return h('div', { style: { width: '100%', height: '300px', display: 'flex', flexDirection: 'row' } }, [
    h('figure', { style: { height: '100%',  width: '50%', display: 'flex', flexDirection: 'column' } }, [
      h('svg', { style: { height: '100%', width: '100%' } }, [
        h(LabeledCircle, { x: '50%', y: '80%', r: 50 }, 'Application'),
        h(LabeledCircle, { x: '75%', y: '20%'  }, 'Body'),
      ]),
      h('figcaption', { style: { textAlign: 'center' }}, `Root Component`)
    ]),
    h('figure', { style: { height: '100%',  width: '50%', display: 'flex', flexDirection: 'column' } }, [
      h('svg', { style: { height: '100%', width: '100%' } }, [
        h(LabeledCircle, { x: '50%', y: '60%' }, 'Body'),
        h(LabeledCircle, { x: '25%', y: '40%' }, 'Form'),
        h(LabeledCircle, { x: '75%', y: '200px', r: 60 }, 'SubmitButton'),
      ]),
      h('figcaption', { style: { textAlign: 'center' }}, `Body`)
    ]),
  ])
}

export const conceptsPage/*: RehersalPage*/ = {
  title: '✅ Basic Concepts',
  id: 'concepts',
  path: '/concepts',
  children: [],
  subsections: [],
  content: [
    h(MarkdownBlock, { input: { type: 'text', text: conceptsText }, directives: {
      //'api': MarkdownAPI,
      //'type': MarkdownTypeDoc,
      'hello_example': HelloExample,
      //'component_diagram': ComponentDiagram,
    } }),
  ],
};

export const conceptsPages = [
  conceptsPage
];
