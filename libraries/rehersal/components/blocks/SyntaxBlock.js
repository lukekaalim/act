// @flow strict

import { h, useContext, useEffect, useRef } from "@lukekaalim/act";
import { rehersalContext } from "../../context";
import { useSyntax } from "../../syntax/useSyntax";
import styles from './SyntaxBlock.module.css';
import 'highlight.js/styles/nord.css'
/*::
import type { Component } from "@lukekaalim/act";
*/

/*::
export type SyntaxBlockProps = {
  code: string,
  language?: string | null,
}
*/

export const SyntaxBlock/*: Component<SyntaxBlockProps>*/ = ({
  code,
  language = null
}) => {
  const { search, syntax } = useContext(rehersalContext);

  const html = useSyntax(syntax, code, language || 'plaintext');
  const ref = useRef()
  useEffect(() => {
    if (!ref.current || !html)
      return;
    ref.current.innerHTML = html;
  }, [html]);

  return h('pre', { class: styles.syntaxBlock },
    h('code', { class: 'hljs', ref, ignoreChildren: true }));
};