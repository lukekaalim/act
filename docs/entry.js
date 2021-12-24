// @flow strict
/*:: import type { NavigationLink } from "@lukekaalim/act-rehersal"; */
/*:: import type { ElementNode } from "@lukekaalim/act"; */
import { h, useEffect, useState } from '@lukekaalim/act';

import rootReadme from '../README.md?raw';

import { render } from '@lukekaalim/act-three';
import { useRootNavigation, navigationContext } from '@lukekaalim/act-navigation';

import { Document, Rehersal, GridBench, Markdown } from '@lukekaalim/act-rehersal';
import { componentPage } from './pages/components.js';
import { TabbedToolbox } from "../libraries/rehersal/tools/tabs";
import { Workspace } from '../libraries/rehersal/layouts/workspace.js';
import { rehersalPage, rehersalPages } from './pages/libraries/rehersal.js';
import { markdownPage, markdownRendererPage } from "./pages/libraries/markdown";
import { elementsPage } from './pages/elements.js';
import { quickstartPage } from './pages/quickstart.js';
import { curvePage, curvePages } from './pages/libraries/curve.js';
import { SuspensionTest } from './examples/suspension.js';
import { conceptsPage, conceptsPages } from './pages/concepts';
import { CurveCubeDemo } from './pages/libraries/rehersal/demos';


/*::
export type Page = {
  link: NavigationLink,
  content: ElementNode
};
*/

const directives = {
  demos: () => {
    return [
      h(CurveCubeDemo)
    ];
  }
};

const rootPage = {
  link: { name: '@lukekaalim/act', href: '/', children: [
    quickstartPage.link,
    conceptsPage.link,
    { name: 'Renderers', children: [], href: null },
    { name: 'Libraries', children: [rehersalPage.link, markdownPage.link, curvePage.link], href: null },
    { name: 'Internals', children: [], href: null },
  ] },
  content: h(Document, {}, h(Markdown, { text: rootReadme, directives }))
};


const pages = [
  rootPage,
  quickstartPage,
  ...conceptsPages,
  ...rehersalPages,
  ...curvePages,
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

  return h('act:boundary', { fallback: ErrorFallback },
    h(Rehersal, { rootLink: rootPage.link, selectedLink: page.link, onLinkClick }, page.content)
  );
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

const main = () => {
  const { body } = document;
  if (body)
    render(h(DocsApp), body);
};

main();