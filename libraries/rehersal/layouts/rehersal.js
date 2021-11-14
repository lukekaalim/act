// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { NavigationLink } from "../navigation.js"; */
import { h } from '@lukekaalim/act';
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

export const Rehersal/*: Component<RehersalProps>*/ = ({ children, rootLink, selectedLink, onLinkClick }) => {
  return h('div', { className: style.rehersal }, [
    h(Header),
    h('div', { className: style.rehersalHorizontalContainer  }, [
      h(NavigationColumn, { rootLink, selectedLink, onLinkClick }),
      h('div', { className: style.rehersalContent }, children)
    ])
  ]);
}