// @flow strict
/*:: import type { Component, SetValue, ElementNode } from '@lukekaalim/act'; */
import { h, useState, useEffect } from '@lukekaalim/act';

import styles from './navigation.module.css';

/*::
export type NavigationLink = {
  href?: null | string,
  name: string,
  children: NavigationLink[]
}

export type NavigationColumnProps = {
  rootLink: NavigationLink,
  onLinkClick: (event: MouseEvent, link: NavigationLink) => mixed,
  selectedLink: ?NavigationLink,
};
export type NavigationEntryProps = {
  link: NavigationLink,
  onLinkClick: (event: MouseEvent, link: NavigationLink) => mixed,
  selectedLink: ?NavigationLink,
};
*/
const isDescendantSelected = (link, selectedLink) => {
  if (link === selectedLink)
    return true;
  return !!link.children.find(p => isDescendantSelected(p, selectedLink));
}

const NavigationText = ({ link, onLinkClick, setOpen, selectedLink }) => {
  const { href, name } = link;

  const isSelected = link === selectedLink;

  const onClick = (e) => {
    onLinkClick(e, link);
    setOpen(true);
  };

  if (!href || isSelected)
    return h('span', { className: [isSelected && styles.selected].filter(Boolean).join(' ') }, name);

  return h('a', { href, onClick }, link.name);
};

export const NavigationEntry/*: Component<NavigationEntryProps>*/ = ({ link, selectedLink, onLinkClick }) => {
  const [open, setOpen] = useState(isDescendantSelected(link, selectedLink));

  if (link.children.length === 0)
    return h('li', {}, h(NavigationText, { link, onLinkClick, setOpen, selectedLink }));

  const onToggle = (e) => {
    setOpen(!!e.target.open);
  }

 return h('li', {}, h('details', { open, onToggle }, [
    h('summary', {}, h(NavigationText, { link, onLinkClick, setOpen, selectedLink })),
    h('menu', {}, link.children.map(link => h(NavigationEntry, { link, selectedLink, onLinkClick })))
  ]));
};

export const NavigationColumn/*: Component<NavigationColumnProps>*/ = ({ rootLink, selectedLink, onLinkClick }) => {
  return (
    h('nav', { className: styles.pageNavigation },
      h('menu', {},
        h(NavigationEntry, { link: rootLink, selectedLink, onLinkClick })
      )
    )
  );
};