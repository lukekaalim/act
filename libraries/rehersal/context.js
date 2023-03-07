// @flow strict
/*::
import type { Context } from "@lukekaalim/act";
import type { SearchService } from "./search/useSearchService";
import type { SyntaxService } from "./syntax/useSyntaxService";
*/
import { createContext } from "@lukekaalim/act";

/*::
export type RehersalContext = {
  search: null | SearchService,
  syntax: null | SyntaxService,
};
*/

export const rehersalContext/*: Context<RehersalContext>*/ = createContext({
  search: null,
  syntax: null,
});