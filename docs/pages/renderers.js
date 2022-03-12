// @flow strict
/*:: import type { Page } from "@lukekaalim/act-rehersal"; */
import { h } from "@lukekaalim/act";
import { Document, Markdown } from "@lukekaalim/act-rehersal";

import webText from './renderers/web.md?raw';

export const webRendererPage/*: Page*/ = {
  link: { name: 'web', href: '/renderers/web', children: [] },
  content: h(Document, {}, h(Markdown, { text: webText }))
};

export const rendererPages = [
  webRendererPage,
];