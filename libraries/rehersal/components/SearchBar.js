// @flow strict
/*::
import type { Component } from "@lukekaalim/act";
import type { RehersalPage } from "../pages";
*/
import { h, useMemo, useState } from "@lukekaalim/act";
import { useSearchService, useSearchQuery } from "../search";
import { flattenPages } from "../pages";
import styles from './SearchBar.module.css';

/*::
export type SearchBarProps = {
  pages: RehersalPage[],
}
*/

export const SearchBar/*: Component<SearchBarProps>*/ = ({ pages }) => {
  const flatPages = useMemo(() => flattenPages(pages), [pages]);
  const [query, setQuery] = useState('');
  const search = useSearchService(flatPages, true);

  const results = useSearchQuery(query, search);

  return h('div', { class: styles.search }, [
    h('label', { class: styles.searchLabel }, [
      h('span', { class: styles.searchLabelText }, 'Search'),
      h('input', {
        type: 'text',
        value: query,
        onInput: e => setQuery(e.target.value),
        class: styles.input,
        placeholder: 'Search Terms'
      }),
    ]),
    h('ol', { class: styles.resultList }, results.map(result => {
      const page = flatPages.find(p => p.id === result.id);
      if (!page)
        return null;
      return h('li', { class: styles.resultEntry },
        h('a', { href: page.path },
          page.title));
    })),
  ]);
};
