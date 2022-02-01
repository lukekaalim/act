// @flow strict

/*:: import type { Page } from "@lukekaalim/act-rehersal"; */

import { h } from "@lukekaalim/act";
import { Document, Markdown } from "@lukekaalim/act-rehersal";

import text from './libraries.md?raw';

import { rehersalPage, rehersalPages } from './libraries/rehersal.js';
import { markdownPage, markdownPages } from "./libraries/markdown.js";
import { curvePage, curvePages } from './libraries/curve.js';

export const librariesPage/*: Page*/ = {
  content: h(Document, {}, h(Markdown, { text })),
  link: { name: 'Libraries', children: [
    rehersalPage.link, markdownPage.link, curvePage.link
  ], href: '/libraries' }
};

export const librariesPages/*: Page[]*/ = [
  librariesPage,
  ...rehersalPages,
  ...markdownPages,
  ...curvePages,
];
