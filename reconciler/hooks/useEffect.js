// @flow strict
/*:: import type { UseEffect } from '@lukekaalim/act'; */
/*:: import type { ComponentState } from '../state2.js'; */

/*::
export type CleanupFunc = () => mixed;
export type Deps = null | mixed[];

export type UseEffectData = Map<mixed, {|
  cleanup: ?CleanupFunc,
  deps: Deps,
|}>;
*/

export const depsAreEqual = (depsA/*: Deps*/, depsB/*: Deps*/)/*: boolean*/ => {
  if (depsA === null || depsB === null)
    return false;
  if (depsA.length !== depsB.length)
    return false;
  return depsA.every((value, index) => value === depsB[index]);
}

export const loadUseEffect = (state/*: ComponentState*/)/*: UseEffect*/ => {
  let useStateCount = 0;

  const useEffect = (newEffect, newDeps = null) => {
    const stateIndex = useStateCount++;

    const prevEffect = state.useEffectData.get(stateIndex) || { cleanup: null, deps: null };
    if (depsAreEqual(newDeps, prevEffect.deps))
      return;
    if (prevEffect.cleanup)
      prevEffect.cleanup();
    
    state.useEffectData.set(stateIndex, {
      cleanup: newEffect(),
      deps: newDeps,
    });
  }

  return useEffect;
};

export const teardownUseEffect = (state/*: ComponentState*/) => {
  for (const [_, { cleanup }] of state.useEffectData)
    cleanup && cleanup();
}
