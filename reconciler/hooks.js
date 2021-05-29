// @flow strict
/*:: import type { Hooks } from '@lukekaalim/act'; */

/*:: import type { Tree } from './tree.js'; */
/*:: import type { ComponentState } from './state2.js'; */

import { loadUseState } from './hooks/useState.js';
import { loadUseContext, teardownUseContext } from './hooks/useContext.js';
import { loadUseEffect, teardownUseEffect } from './hooks/useEffect.js';

export const loadHooks = (tree/*: Tree*/, state/*: ComponentState*/)/*: Hooks*/ => {
  const hooks = {
    useState: loadUseState(tree, state),
    useContext: loadUseContext(tree, state),
    useEffect: loadUseEffect(state),
  }
  return hooks;
};

export const teardownHooks = (tree/*: Tree*/, state/*: ComponentState*/) => {
  teardownUseEffect(state);
  teardownUseContext(tree, state);
};
