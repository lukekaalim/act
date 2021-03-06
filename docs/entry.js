// @flow strict
/*:: import type { NavigationLink } from "@lukekaalim/act-rehersal"; */
/*:: import type { ElementNode } from "@lukekaalim/act"; */
import { h, useEffect, useState } from '@lukekaalim/act';

import actReadmeText from '@lukekaalim/act/README.md?raw';


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


/*::
export type Page = {
  link: NavigationLink,
  content: ElementNode
};
*/

const directives = {
  demos: () => {
    return h('div', { style: { display: 'flex' } }, [
      h(CurveCubeDemo),
      h(TodoManager, { initialTasks: ['Write Documentation', 'Finish D&D Prep', 'Cook Dinner'] })
    ]);
  }
};

const rootPage = {
  link: { name: '@lukekaalim/act', href: '/', children: [
    quickstartPage.link,
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

  return h('act:boundary', { fallback: ErrorFallback },
    h(Rehersal, { rootLink: rootPage.link, selectedLink: page.link, onLinkClick },
        h('div', { onClick }, page.content))
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