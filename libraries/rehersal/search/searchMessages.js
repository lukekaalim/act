// @flow strict
/*::
import type { SearchContent, SearchResult } from "./searchIndexer";
import type { Cast } from "@lukekaalim/cast";
*/

import { c } from '@lukekaalim/cast';

/*::
export type SearchReadyMessage = {
  type: 'ready',
}

export type SearchContentMessage = {
  type: 'content',
  content: $ReadOnlyArray<SearchContent>,
}
export type SearchErrorMessage = {
  type: 'error',
  message: string,
}

export type SearchQueryRequestMessage = {
  type: 'query-request',
  id: string,
  query: string,
};

export type SearchQueryResponseMessage = {
  type: 'query-response',
  id: string,
  matches: $ReadOnlyArray<SearchResult>,
};

export type SearchMessage =
  | SearchReadyMessage
  | SearchContentMessage
  | SearchErrorMessage
  | SearchQueryRequestMessage
  | SearchQueryResponseMessage
*/

export const castSearchReadyMessage/*: Cast<SearchReadyMessage>*/ = c.obj({
  type: c.lit('ready'),
})
export const castSearchContentMessage/*: Cast<SearchContentMessage>*/ = c.obj({
  type: c.lit('content'),
  content: c.arr(c.obj({
    id: c.str,
    title: c.str,
    body: c.str,
  }))
})
export const castSearchQueryRequestMessage/*: Cast<SearchQueryRequestMessage>*/ = c.obj({
  type: c.lit('query-request'),
  id: c.str,
  query: c.str,
})
export const castSearchQueryResponseMessage/*: Cast<SearchQueryResponseMessage>*/ = c.obj({
  type: c.lit('query-response'),
  id: c.str,
  matches: c.arr(c.obj({ id: c.str })),
})
export const castSearchErrorMessage/*: Cast<SearchErrorMessage>*/ = c.obj({
  type: c.lit('error'),
  message: c.str,
})

export const castSearchMessage/*: Cast<SearchMessage>*/ = c.or('type', {
  'ready': castSearchReadyMessage,
  'content': castSearchContentMessage,
  'query-request': castSearchQueryRequestMessage,
  'query-response': castSearchQueryResponseMessage,
  'error': castSearchErrorMessage,
});