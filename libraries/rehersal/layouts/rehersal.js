// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { NavigationLink } from "../navigation.js"; */
import { Boundary, h } from '@lukekaalim/act';
import { Header } from '../header';
import { NavigationColumn } from "../navigation";

import style from './rehersal.module.css';

/*::
export type RehersalProps = {
  rootLink: NavigationLink,
  selectedLink: ?NavigationLink,
  onLinkClick: (event: MouseEvent, link: NavigationLink) => mixed,
};
*/

const PageError = ({ value }) => {
  return h('div', { style: { margin: 'auto', maxWidth: '45em' }}, [
    h('h2', {}, (value/*: any*/).message),
    h('pre', {}, (value/*: any*/).stack),
  ])
}

export const Rehersal/*: Component<RehersalProps>*/ = ({ children, rootLink, selectedLink, onLinkClick }) => {
  return h('div', { className: style.rehersal }, [
    h(Header),
    h('div', { className: style.rehersalHorizontalContainer  }, [
      h(NavigationColumn, { rootLink, selectedLink, onLinkClick }),
      h('div', { className: style.rehersalContent }, h(Boundary, { fallback: PageError }, children))
    ])
  ]);
}