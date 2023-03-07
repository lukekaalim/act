// @flow strict
import { useMemo, useState } from '@lukekaalim/act';
import hljs from 'highlight.js'; 
const { highlight } = hljs;

/*::
export type SyntaxService = {
  generate: (code: string, language: string) => Promise<{ html: string }>
};
*/

export const createSyntaxService = ()/*: SyntaxService*/ => {
  const generate = async (code, language) => {
    const { value: html } = highlight(code, { language });
    return { html };
  };

  return { generate }
}

export const useSyntaxService = ()/*: SyntaxService*/ => {
  const [] = useState();
  
  return useMemo(() => {
    return createSyntaxService();
  }, []);
};
