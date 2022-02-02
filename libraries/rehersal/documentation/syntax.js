// @flow strict
/*:: import type { Component, Ref } from '@lukekaalim/act'; */
import hljs from 'highlight.js/lib/core';
import { h, useEffect, useRef } from '@lukekaalim/act';

import styles from './documentation.module.css';
import 'highlight.js/styles/atom-one-dark-reasonable.css';

hljs.registerAliases(['js'], { languageName: 'javascript' });
hljs.registerAliases(['ts'], { languageName: 'typescript' });
hljs.registerAliases(['html'], { languageName: 'xml' });
const getLanguageName = (languageKey) => {
  switch (languageKey) {
    case 'js':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'html':
      return 'xml';
    default:
      return languageKey;
  }
}

const registerAndHighlight = async (element, languageName) => {
  const id = Math.floor(Math.random() * 1000).toString();
  performance.mark(`${id} - ${languageName} - start`);
  if (languageName && languageName !== '' && !hljs.getLanguage(languageName)) {
    try {
      // $FlowFixMe
      const language = await import(/* @vite-ignore */` https://unpkg.com/@highlightjs/cdn-assets@11.4.0/es/languages/${getLanguageName(languageName)}.min.js`);
      hljs.registerLanguage(languageName, language.default);
    } catch (error) {
      console.error(`Failed to load language: ${languageName}`);
      console.error(error);
    }
  }
  try {
    hljs.highlightElement(element);
  } catch (error) {
    console.error(error);
  }
  performance.mark(`${id} - ${languageName} - end`);
  performance.measure(id, `${id} - ${languageName} - start`, `${id} - ${languageName} - end`);
};

export const useSyntaxHighlight = (ref/*: Ref<?HTMLElement>*/, code/*: string*/, language/*: string*/ = '') => {
  useEffect(() => {
    const parent = ref.current;
    if (!parent)
      return;
    
    const element = document.createElement('pre');
    element.textContent = code;
    element.className = language;

    let idleCallbackId = null;

    if (window.requestIdleCallback)
      idleCallbackId = window.requestIdleCallback(() => registerAndHighlight(element, language));
    else
      registerAndHighlight(element, language)
    
    parent.appendChild(element);

    return () => {
      parent.removeChild(element);
      if (idleCallbackId !== null && window.cancelIdleCallback)
        window.cancelIdleCallback(idleCallbackId);
    };
  }, [code]);
};

export const SyntaxCode/*: Component<{ code: string, language: string }>*/ = ({ code, language }) => {
  const ref = useRef/*:: <?HTMLElement>*/();
  useSyntaxHighlight(ref, code, language);

  return h('code', { className: [styles.syntaxHighlighted].join(' '), ref });
}