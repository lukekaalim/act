// @flow strict

import { h, useEffect, useRef } from "@lukekaalim/act";
import { navigationContext, useRootNavigation } from "@lukekaalim/act-navigation";
import { findPageByPath } from "./pages";
import styles from './RehersalApp.module.css';
import { NavigationColumn } from "./components/NavigationColumn";
import { SlideTransition } from "./components/SlideTransition";

/*::
import type { Component } from "@lukekaalim/act";
import type { RehersalPage } from "./pages";
import type { Navigation } from "@lukekaalim/act-navigation";

export type RehersalStyle = {
  accentColor: string,
  lightAccentColor: string,
  secondaryColor: string,
}

export type RehersalAppProps = {
  pages: RehersalPage[],

  style?: RehersalStyle,
  overrideNavigation?: null | Navigation,
};
*/

export const defaultRehersalStyle/*: RehersalStyle*/ = {
  accentColor: '#009fff',
  lightAccentColor: '#bae5ff',
  secondaryColor: '#ffebeb'
};

export const RehersalApp/*: Component<RehersalAppProps>*/ = ({
  pages,

  style = defaultRehersalStyle,
  overrideNavigation = null,
}) => {

  const internalNavigation = useRootNavigation(document.location.href, window.history)
  const navigation = overrideNavigation || internalNavigation;

  const selectedPage = findPageByPath(navigation.location.pathname, pages);
  const selectedPageId = selectedPage && selectedPage.id;

  const ref = useRef/*::<?HTMLElement>*/();
  useEffect(() => {
    const { current: section } = ref;
    if (!section)
      return;

    const onClick = (e/*: MouseEvent*/) => {
      const findAnchorParent = (target) => {
        if (target instanceof HTMLAnchorElement)
          return target;
        if (!target.parentElement)
          return null;
        
        return findAnchorParent(target.parentElement);
      }
      if (!(e.target instanceof Element))
        return;
      const anchor = findAnchorParent(e.target)

      if (!anchor)
        return;
      const url = new URL(anchor.href);
      console.log({url});
      if (url.origin !== document.location.origin)
        return;
      console.log('hash time!')
      
      e.preventDefault();
      navigation.navigate(url);
      const hash = url.hash.slice(1);
      if (!hash)
        return;
      console.log(hash)
      const element = document.getElementById(url.hash.slice(1));

      if (!element)
        return;

      element.scrollIntoView({ behavior: 'smooth' });
    }
    section.addEventListener('click', onClick);
    return () => section.removeEventListener('click', onClick);
  }, [navigation]);

  useEffect(() => {
    const hash = navigation.location.hash.slice(1);
    if (!hash)
      return;
    const element = document.getElementById(hash);
    if (!element)
      return;
    element.scrollIntoView({ behavior: 'smooth' });
  }, [navigation.location.pathname])

  const rehersalStyleVariables = {
    ['--accent-color']: style.accentColor,
    ['--light-accent-color']: style.lightAccentColor,
    ['--secondary-color']: style.secondaryColor
  }

  return h(navigationContext.Provider, { value: navigation }, [
    h('section', { class: styles.rehersal, ref, style: { ...rehersalStyleVariables  } }, [
      h('div', { class: styles.accentBar }),
      h('div', { class: styles.mainRow }, [
        h(NavigationColumn, { pages, selectedPageId }),
        h('div', { class: styles.transitionContainer }, [
          h(SlideTransition, {
            content: selectedPage ? h('div', { class: styles.pageContent }, selectedPage.content) : '404',
            contentKey: selectedPage ? selectedPage.id : '404'
          }),
        ]),
      ]),
    ])
  ]);
};

const RehersalNavigationColumnEntry = ({ depth, page, selectedPath }) => {

  const anchor = h('a', { href: page.path }, page.title)

  if (page.children.length === 0)
    return h('div', { class: styles.navigationColumnEntry, style: { ['--navigation-depth']: `${depth * 16}px` } },
    anchor)

  return h('details', { class: styles.navigationColumnEntry, style: { ['--navigation-depth']: `${depth * 16}px` }}, [
    h('summary', {}, anchor),
    page.children.map(childPage =>
      h(RehersalNavigationColumnEntry, { depth: depth + 1, page: childPage, selectedPath }))
  ])
}
