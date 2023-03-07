// @flow strict
/*::
import type { RehersalPage } from "../pages";
import type { SearchMessage } from "./searchMessages";
import type { SearchResult } from "./searchIndexer";
*/

import { castSearchMessage } from "./searchMessages";
import { useEffect, useMemo, useState } from '@lukekaalim/act';
import { createSearchIndexer } from "./searchIndexer";

/*::
export type SearchService = {
  search(query: string): Promise<$ReadOnlyArray<SearchResult>>,
};
*/

const createLocalIndexService = (content) => {
  const localIndex = createSearchIndexer();
  localIndex.setContent(content);
  const search = async (query) => {
    return localIndex.search(query)
  };
  const service = { search }
  return service;
}

export const useSearchService = (
  pages/*: RehersalPage[]*/,
  enableSearchWorker/*: boolean*/ = false,
)/*: null | SearchService*/ => {
  const [service, setService] = useState/*:: <SearchService | null>*/(null);

  useEffect(() => {
    if (!enableSearchWorker)
      return;
      
    const contentPromise = Promise.all(pages.map(async page => {
      return {
        id: page.id,
        title: page.title,
        body: page.searchableText ? await page.searchableText() : ''
      }
    }));

    if (typeof Worker === undefined) {
      contentPromise.then(content => {
        setService(createLocalIndexService(content))
      });
      return () => setService(null);
    }

    const worker = new Worker(
      new URL('./searchWorker.js', import.meta.url).href,
      { type: 'module' }
    );

    const onError = async (error/*: ErrorEvent*/) => {
      setService(createLocalIndexService(await contentPromise))
    }
    const onReady = async () => {
      worker.postMessage({ type: 'content', content: await contentPromise })

      const search = async (query) => {
        sendWorkerMessage({ type: 'query-request', id: '', query });
        return new Promise(resolve => {
          const onMessage = (event/*: MessageEvent*/) => {
            const searchMessage = castSearchMessage(event.data);
            switch (searchMessage.type) {
              case 'query-response': {
                resolve(searchMessage.matches);
                worker.removeEventListener('message', onMessage);
              }
            }
          };
          worker.addEventListener('message', onMessage);
        })
      };
      const service = { search }
      setService(service)
    }
    const sendWorkerMessage = (event/*: SearchMessage*/) => {
      worker.postMessage(event);
    }

    const onMessage = (event/*: MessageEvent*/) => {
      const searchMessage = castSearchMessage(event.data);
      switch (searchMessage.type) {
        case 'ready':
          return onReady();
      }
    }
    worker.addEventListener('message', onMessage);
    // $FlowFixMe
    worker.addEventListener('error', onError);

    return () => {
      // $FlowFixMe
      worker.removeEventListener('error', onError);
      worker.removeEventListener('message', onMessage);
      worker.terminate();
      setService(null);
    }
  }, [enableSearchWorker, pages]);
  
  return service;
};
