// @flow strict
/*:: import type { NavigationLink } from "@lukekaalim/act-rehersal"; */
/*:: import type { ElementNode } from "@lukekaalim/act"; */
import { h, useState } from '@lukekaalim/act';
import { render } from '@lukekaalim/act-web';
import { useRootNavigation, navigationContext } from '@lukekaalim/act-navigation';

import { Document, Rehersal, GridBench } from '@lukekaalim/act-rehersal';
import { componentPage } from './pages/components.js';
import { TabbedToolbox } from "../libraries/rehersal/tools/tabs";
import { Workspace } from '../libraries/rehersal/layouts/workspace.js';
import { rehersalPage } from './pages/libraries/rehersal.js';
import { markdownPage, markdownRendererPage } from "./pages/libraries/markdown";
import { elementsPage } from './pages/elements.js';
import { quickstartPage } from './pages/quickstart.js';


/*::
export type Page = {
  link: NavigationLink,
  content: ElementNode
};
*/

const text = `
# @lukekaalim/act

[![npm (scoped)](https://img.shields.io/npm/v/@lukekaalim/act)](https://www.npmjs.com/package/@lukekaalim/act)
![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@lukekaalim/act)

A generic rendering library for heiarchical elements.

Use it like react!

Render to HTML with \`@lukekaalim/act-web\`
or even use 3D capabilites with [threejs](https://threejs.org/) using \`@lukekaalim/act-three\`

## Install
${'```'}
npm install @lukekaalim-act
${'```'}
`;

const wipLink = { name: "[TODO]", children: [] }


const rootPage = {
  link: { name: 'README.md', href: '/', children: [
    quickstartPage.link,
    elementsPage.link,
    componentPage.link,
    { name: 'Renderers', children: [wipLink], href: null },
    { name: 'Libraries', children: [rehersalPage.link, markdownPage.link,], href: null },
    { name: 'Internals', children: [wipLink], href: null },
  ] },
  content: h(Document, { text })
};
const pages = [
  rootPage,
  quickstartPage,
  componentPage,
  elementsPage,
  rehersalPage,
  markdownPage,
  markdownRendererPage
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

  return h(Rehersal, { rootLink: rootPage.link, selectedLink: page.link, onLinkClick }, page.content);
};

const main = () => {
  const { body } = document;
  if (body)
    render(h(DocsApp), body);
};

main();