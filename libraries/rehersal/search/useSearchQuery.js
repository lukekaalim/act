// @flow strict
/*::
import type { SearchResult } from "./searchIndexer";
import type { SearchService } from "./useSearchService";
*/

import { useEffect, useState } from "@lukekaalim/act";

export const useSearchQuery = (
  query/*: string*/,
  service/*: null | SearchService*/
)/*: $ReadOnlyArray<SearchResult>*/ => {
  const [matches, setMatches] = useState([])
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (!service || !trimmedQuery || trimmedQuery.length < 2)
      return;

    service.search(trimmedQuery + '*')
      .then(setMatches);

    return () => {
      setMatches([]);
    }
  }, [service, trimmedQuery])

  return matches;
};
