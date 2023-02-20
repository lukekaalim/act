// @flow strict

import { h, useState } from "@lukekaalim/act";
import { calculatePageSelection } from "../pages";
import styles from './NavigationColumn.module.css';

/*::
import type { Component } from "@lukekaalim/act";
import type { RehersalPage, RehersalPageID } from "../pages";

export type NavigationColumnProps = {
  pages: RehersalPage[],
  selectedPageId: ?RehersalPageID,
}
*/

export const NavigationColumn/*: Component<NavigationColumnProps>*/ = ({
  pages,
  selectedPageId,
}) => {
  return h('nav', { class: styles.navigationColumn }, [
    h(PageList, { pages, selectedPageId })
  ])
};

const PageList = ({ pages, selectedPageId }) => {
  return h('ol', { class: styles.pageList },
    pages.map(page => h('li', {}, h(PageEntry, { page, selectedPageId })))
  )
}

const PageRow = ({ page, selectedPageId }) => {
  return h('div', { class: styles.pageListRow }, [
    h(LeafPageEntry, { page, selectedPageId })
  ])
};

const PageEntry = ({ page, selectedPageId }) => {
  if (page.children && page.children.length > 0)
    return h(BranchPageEntry, { page, selectedPageId, pages: page.children });
  else
    return h(PageRow, { page, selectedPageId });
}

/*::
type LeafPageEntryProps = {
  page: RehersalPage,
  selectedPageId: ?RehersalPageID,
  onClick?: MouseEvent => mixed,
}
*/

const LeafPageEntry/*: Component<LeafPageEntryProps>*/ = ({ page, selectedPageId, onClick = _ => {} }) => {
  return h('span', { class: styles.pageEntry }, h(PageTag, { page, selectedPageId, onClick }))
}

const BranchPageEntry = ({ page, pages = [], selectedPageId }) => {
  const pageSelection = selectedPageId ? calculatePageSelection(selectedPageId, page) : 'unselected';
  const initialIsOpen = pageSelection === 'selected' || pageSelection === 'included'
  const [open, setOpen] = useState(initialIsOpen);

  const onClick = () => {
    setOpen(true);
  }

  return h('details', { class: styles.branchPageEntry, open: open || "", onToggle: e => setOpen(!!e.target.open) }, [
    h('summary', { class: styles.pageListRow }, [
      h(VisibilityToggle, { open, setOpen }),
      h(LeafPageEntry, { page, selectedPageId, onClick })
    ]),
    h(PageList, { pages, selectedPageId }),
  ])
}

const VisibilityToggle = ({ open, setOpen }) => {
  return h('label', { classList: [styles.visibilityToggle, open && styles.open] }, [
    h('input', {
      type: 'checkbox',
      checked: open,
      onInput: e => setOpen(e.currentTarget.checked)
    }),
  ])
}

const PageTag = ({ page, selectedPageId, onClick = _ => {} }) => {
  const isSelected = page.id === selectedPageId;
  return h('a', {
    onClick,
    classList: [
      styles.pageTag,
      isSelected && styles.selected
    ], href: page.path
  }, page.title);
}