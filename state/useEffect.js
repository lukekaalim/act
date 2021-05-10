// @flow strict
/*:: import type { ActGraph } from '../graph'; */
/*:: import type { StatePath, CommitState } from '../state'; */

/*::
export type UseEffect = (effect: () => ?(() => void), deps?: null | mixed[]) => void;
*/

const setupUseEffect = (graph/*: ActGraph*/, path/*: StatePath*/, state/*: CommitState*/)/*: UseEffect*/ => {
  let useStateCount = 0;

  const useEffect = (effect, deps = null) => {
    const stateIndex = ++useStateCount;
    const cleanup = effect();
    state.usedEffects.set(stateIndex, {
      cleanup,
      deps
    });
  }

  return useEffect;
};

const depsAreEqual = (depsA, depsB) => {
  if (depsA === null || depsB === null)
    return false;
  if (depsA.length !== depsB.length)
    return false;
  return depsA.every((value, index) => value === depsB[index]);
}

const loadUseEffect = (graph/*: ActGraph*/, path/*: StatePath*/, state/*: CommitState*/)/*: UseEffect*/ => {
  let useStateCount = 0;

  const useEffect = (newEffect, newDeps = null) => {
    const stateIndex = ++useStateCount;
    const cachedHook = state.usedEffects.get(stateIndex);
    if (!cachedHook)
      throw new Error(`Attempting to use hook that has not been setup`);
    const { cleanup: oldCleanup, deps: oldDeps } = cachedHook;
    if (depsAreEqual(oldDeps, newDeps))
      return;
    oldCleanup && oldCleanup();
    const newCleanup = newEffect();
    
    state.usedEffects.set(stateIndex, {
      cleanup: newCleanup,
      deps: newDeps,
    });
  }

  return useEffect;
};

const teardownUseEffect = (graph/*: ActGraph*/, path/*: StatePath*/, state/*: CommitState*/) => {
  for (const [index, { cleanup }] of state.usedEffects)
    cleanup && cleanup();
}

module.exports = {
  setupUseEffect,
  loadUseEffect,
  teardownUseEffect,
};
