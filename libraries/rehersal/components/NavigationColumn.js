// @flow strict

import { h, useState } from "@lukekaalim/act";
import { calculatePageSelection } from "../pages";
import { useSearchService } from "../search";
import styles from './NavigationColumn.module.css';
import { SearchBar } from "./SearchBar";

/*::
import type { Component } from "@lukekaalim/act";
import type { RehersalPage, RehersalPageID } from "../pages";
import type { SearchService } from "../search";

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
    h(SearchBar, { pages }),
    h(PageList, { pages, selectedPageId, subsections: [] })
  ])
};

const PageList = ({ pages, selectedPageId, subsections = [] }) => {
  return [
    subsections.length > 0 && h('ol', { class: styles.sectionList }, [
      subsections.map(section => h('li', {},
        h('a', { href: `#${section}`, class: styles.sectionLink }, section))),
    ]),
    h('ol', { class: styles.pageList }, [
      pages.map(page => h('li', {},
        h(PageEntry, { page, selectedPageId })))
    ])
  ]
}

const PageRow = ({ page, selectedPageId }) => {
  return h('div', { class: styles.pageListRow }, [
    h(LeafPageEntry, { page, selectedPageId }),
  ])
};

const PageEntry = ({ page, selectedPageId }) => {
  const hasChildren = page.children && page.children.length > 0;
  const hasSubsections = page.subsections.length > 0 && page.id === selectedPageId;

  if (hasChildren || hasSubsections)
    return h(BranchPageEntry, {
      page,
      selectedPageId,
      pages: page.children,
      subsections: page.subsections
    });
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
  return h('span', { class: styles.pageEntry },
    h(PageTag, { page, selectedPageId, onClick }))
}

const BranchPageEntry = ({ page, pages = [], selectedPageId, subsections }) => {
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
    h(PageList, { pages, selectedPageId, subsections }),
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