// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import hljs from 'highlight.js';
import { h, useEffect, useRef } from '@lukekaalim/act';

import styles from './documentation.module.css';
import 'highlight.js/styles/github.css';

export const SyntaxCode/*: Component<{ code: string }>*/ = ({ code }) => {
  const ref = useRef/*:: <?HTMLElement>*/();
  useEffect(() => {
    const parent = ref.current;
    if (!parent)
      return;
    
    const element = document.createElement('code');
    element.textContent = code;

    if (window.requestIdleCallback)
      window.requestIdleCallback(() => hljs.highlightElement(element));
    else
      hljs.highlightElement(element);
    
    parent.appendChild(element);
    return () => {
      parent.removeChild(element);
    };
  }, [code]);
  return h('pre', { className: styles.syntaxHighlighted, ref });
}