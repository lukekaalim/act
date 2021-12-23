// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import { h, useEffect, useRef } from '@lukekaalim/act';

import styles from './documentation.module.css';
import linkIconSrc from './icons8-link-30.png';

export const FragmentAnchorHeading/*: Component<{ fragment: string }>*/ = ({ fragment, children }) => {
  return (
    h('h3', { className: styles.fragmentAnchor, id: fragment },
      h('a', { href: `#${fragment}` }, [
        children,
        h('img', { src: linkIconSrc })
      ]))
  );
}