// @flow strict

/*::
import type { ContextID } from "@lukekaalim/act";
import type { Commit3, CommitID3, CommitRef3 } from "./commit3";

export type ContextProvider = {
  value: mixed,
  getCurrentTargets: () => CommitRef3[],
  attach: (ref: CommitRef3) => ({ detach: () => void }),
}

export type ContextService2 = {|
  getProviderForPath: (contextId: ContextID, path: CommitID3[], defaultValue: mixed) => ContextProvider,

  updateCommit: (commit: Commit3) => { targets: CommitRef3[] },
|};

type ContextCommitPair = string;
*/
const createContextCommitPair = (contextId, commitId) => `${contextId}:${commitId}`;
const createDefaultProvider = (defaultValue) => ({
  value: defaultValue,
  attach: () => ({ detach: () => {} }),
  getCurrentTargets: () => [],
});

export const createContextService2 = ()/*: ContextService2*/ => {
  // We create a pair here for the strange assumption that a commit could hold
  // more than one type of context.
  const contextProviders = new Map/*:: <ContextCommitPair, ContextProvider>*/();

  const createProvider = (pair, value)/*: ContextProvider*/ => {
    const commitAttachments = new Set();

    const attach = (ref) => {
      const attachment = { ref };
      commitAttachments.add(attachment);
      const detach = () => {
        commitAttachments.delete(attachment);
      };
      return { detach }
    }
    const getCurrentTargets = () => {
      return [...commitAttachments].map(a => a.ref);
    }

    const provider = { value, attach, getCurrentTargets }
    contextProviders.set(pair, provider);
    return provider;
  };

  const getProviderForPath = (contextId, path, defaultValue) => {
    // We reverse the path so we search for "highest"
    //  context to the "lowest"
    const firstProvider = [...path].reverse()
      .map(commitId => contextProviders.get(createContextCommitPair(contextId, commitId)))
      .find(Boolean);

    if (!firstProvider)
      return createDefaultProvider(defaultValue);
    
    return firstProvider;
  }

  const setValueForCommit = (contextId, commitRef, value) => {
    const pair = createContextCommitPair(contextId, commitRef);
    const provider = contextProviders.get(pair) || createProvider(pair, value);
    if (provider.value === value) {
      return { targets: [] };
    }
    provider.value = value;
    const targets = provider.getCurrentTargets();
    return { targets };
  }
  const clearValueForCommit = (contextId, commitId) => {
    const pair = createContextCommitPair(contextId, commitId);
    contextProviders.delete(pair);
  }

  const updateCommit = (commit) => {
    const { contextId, value } = commit.element.props;
    if (typeof contextId !== 'string')
      throw new Error('Invalid context element');
    if (commit.state === 'pruned') {
      clearValueForCommit(contextId, commit.id);
      return { targets: [] };
    } else {
      return setValueForCommit(contextId, commit.id, value);
    }
  }

  return {
    getProviderForPath,
    updateCommit,
  }
}