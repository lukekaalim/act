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


/*::
export type Page = {
  link: NavigationLink,
  content: ElementNode
};
*/

const text = `
# @lukekaalim/act

![npm (scoped)](https://img.shields.io/npm/v/@lukekaalim/act)

A generic rendering library for heiarchical elements.

Use it like react!

Render to HTML with \`@lukekaalim/act-web\`
or even use 3D capabilites with \`three\` using \`@lukekaalim/act-three\`

## Install
${'```'}
npm install @lukekaalim-act
${'```'}
`;

const testPage = {
  link: { name: 'test', href: '/test', children: [] },
  content: h(() => {
    return h(Workspace, {
      bench: h(GridBench),
      tools: h(TabbedToolbox, { tabs: {
        readme: h(Document, { text })
      } })
    });
  })
}

const linkC = { name: 'longer even than root level hahahahaha', href: '/', children: [] };
const linkB = { name: 'a', href: '/', children: [linkC] };
const linkA = { name: 'a', href: '/', children: [linkB] };
const link = { name: 'root level and reall long', href: '/', children: [linkA, linkB, linkC] };

const page = {
  link: { name: 'a', href: '/', children: [] },
  content: 'AA',
};

const rootPage = {
  link: { name: 'README.md', href: '/', children: [
    componentPage.link,
    { name: 'Libraries', children: [rehersalPage.link, markdownPage.link,], href: null },
  ] },
  content: h(Document, { text })
};
const pages = [
  rootPage,
  componentPage,
  testPage,
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