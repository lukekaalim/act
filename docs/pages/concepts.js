// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { Page } from '../entry.js'; */
import { h } from '@lukekaalim/act';
import { Document, Markdown } from '@lukekaalim/act-rehersal';

import conceptsText from './concepts.md?raw';

export const conceptsPage/*: Page*/ = {
  link: {
    name: 'Concepts',
    href: '/concepts',
    children: [],
  },
  content: h(Document, {}, [
    h(Markdown, { text: conceptsText })
  ]),
};

export const conceptsPages = [
  conceptsPage
];
