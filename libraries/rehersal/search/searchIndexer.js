// @flow strict
import * as lunr from 'lunr';

/*::
export type SearchContent = {
  id: string,
  title: string,
  body: string
};
export type SearchResult = {
  id: string
}

export type SearchIndexer = {
  setContent(content: $ReadOnlyArray<SearchContent>): void,
  search(query: string): $ReadOnlyArray<SearchResult>,
};
*/

export const createSearchIndexer = ()/*: SearchIndexer*/ => {
  let index = new lunr.Builder().build();

  const setContent = (content) => {
    const builder = new lunr.Builder();
    builder.field('title')
    builder.field('body')
    for (const { body, id, title } of content)
      builder.add({ body, id, title });
    index = builder.build();
  };
  const search = (query) => {
    return index
      .search(query)
      .map(result => ({ id: result.ref }))
  };
  return { search, setContent };
};