// @flow strict
/*:: import type { Page } from "@lukekaalim/act-rehersal"; */
import { h } from "@lukekaalim/act";
import { Document, Markdown } from "@lukekaalim/act-rehersal";

import webText from './renderers/web.md?raw';
import text from './renderers/index.md?raw';
import { customRendererPage } from "./renderers/custom";

export const webRendererPage/*: Page*/ = {
  link: { name: 'Web', href: '/renderers/web', children: [] },
  content: h(Document, {}, h(Markdown, { text: webText }))
};

export const rendererPage/*: Page*/ = {
  link: { name: 'Renderers', href: '/renderers', children: [
    webRendererPage.link,
    customRendererPage.link,
  ] },
  content: h(Document, {}, h(Markdown, { text }))
};


export const rendererPages = [
  rendererPage,
  webRendererPage,
  customRendererPage,
];