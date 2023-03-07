// @flow strict
/*::
import type { SearchMessage } from "./searchMessages";
*/
import { castSearchMessage } from "./searchMessages.js";
import * as lunr from 'lunr';
import { createSearchIndexer } from "./searchIndexer.js";

let index/*: any*/ = null;

const indexer = createSearchIndexer();

const postSearchMessage = (message/*: SearchMessage*/) => {
  // $FlowFixMe
  postMessage(message)
}
const subscribeSearchMessage = (handler/*: (message: SearchMessage) => mixed*/) => {
  // $FlowFixMe
  addEventListener('message', (event/*: MessageEvent*/) => {
    try {
      const searchMessage = castSearchMessage(event.data);
      handler(searchMessage);
    } catch (error) {
      console.warn(error);
    }
  });
};

const onMessage = (searchMessage/*: SearchMessage*/) => {
  switch (searchMessage.type) {
    case 'content': {
      return indexer.setContent(searchMessage.content);
    }
    case 'query-request': {
      const matches = indexer.search(searchMessage.query);
      postSearchMessage({ type: 'query-response', id: searchMessage.id, matches })
      return null;
    }
  }
};

subscribeSearchMessage(onMessage)
postSearchMessage({ type: 'ready' })