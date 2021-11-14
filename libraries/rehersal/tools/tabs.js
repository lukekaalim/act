// @flow strict
/*:: import type { Component, Context, SetValue, ElementNode } from '@lukekaalim/act'; */
import { h, createContext, useContext, useState, useEffect } from "@lukekaalim/act";

import styles from './tools.module.css';

/*::
export type TabbedToolboxProps = {
  tabs: { [string]: ElementNode }
};
*/

const TabButton = ({ children, disabled, onClick }) => {
  return h('button', {
    className: styles.tab,
    style: {
      padding: '12px 18px 12px 18px',
      margin: '0 8px 0 8px',
      borderWidth: '2px 2px 0 2px',
      backgroundColor: disabled ? 'rgb(244, 249, 255)' : 'rgb(218, 219, 223)',
    },
    disabled,
    onClick,
  }, children)
}

export const TabbedToolbox/*: Component<TabbedToolboxProps>*/ = ({ tabs }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const tabEntries/*: [string, ElementNode][]*/ = (Object.entries(tabs)/*: any*/);

  const activeTab = activeTabIndex !== null && tabEntries[activeTabIndex];

  return [
    h('div', { className: styles.tabbedToolbox }, [
      h('menu', { key: 'menu' }, [
        ...tabEntries.map(([tabName, tabContent], i) =>
          h('li', { key: i.toString() },
            h(TabButton, { disabled: i === activeTabIndex, onClick: () => setActiveTabIndex(i) }, tabName)))
      ]),
      activeTab ? h('div', { key: activeTabIndex.toString(), className: styles.content }, activeTab[1]) : null,
    ]),
  ];
}
