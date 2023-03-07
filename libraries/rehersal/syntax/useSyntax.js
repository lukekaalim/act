// @flow strict
/*::
import type { SyntaxService } from "./useSyntaxService";
*/

import { useEffect, useState } from "@lukekaalim/act";

export const useSyntax = (
  service/*: null | SyntaxService*/,
  code/*: string*/,
  language/*: string*/,
)/*: null | string*/ => {
  const [html, setHtml] = useState/*:: <null | string>*/(null);
  useEffect(() => {
    if (!service)
      return;

    service.generate(code, language)
      .then(({ html }) => setHtml(html));

    return () => {
      setHtml(null)
    }
  }, [service, code, language]);

  return html;
};