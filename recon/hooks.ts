import {
  hookImplementation, Context,
  ValueOrCalculator, calculateValue, StateSetter,
  runUpdater,
  createId,
  calculateDepsChange,
  EffectConstructor,
  Deps,
  HookImplementation
} from "@lukekaalim/act";
import { ComponentState, EffectID, EffectTask } from "./state";
import { CommitRef2 } from "./commit";
import { Reconciler2 } from "./reconciler";
import { last } from "./algorithms";

/**
 * A fresh set of hook functions is created per component run.
 */
export const loadHooks2 = (
  reconciler: Reconciler2,

  state: ComponentState,
  ref: CommitRef2
): HookImplementation => {

  function useContext<T>(context: Context<T>): T {
    const stateIndex = state.hookIndex++;

    if (!state.providers.has(stateIndex)) {
      const provider = ref.find(ref => {
        const provider = reconciler.tree.contexts.get(ref.id)
        if (provider && provider.contextId === context.id)
          return provider;
      })
      if (provider) {
        provider.consumers.set(ref.id, ref);
      }
      state.providers.set(stateIndex, provider);
    }
    const provider = state.providers.get(stateIndex);
    if (provider)
      return provider.value as T;
    return context.defaultValue;
  }

  function useState<T>(initialValue: ValueOrCalculator<T>): [T, StateSetter<T>] {
    const stateIndex = state.hookIndex++;
    if (!state.values.has(stateIndex))
      state.values.set(stateIndex, calculateValue(initialValue));

    const value = state.values.get(stateIndex) as T;
    const setValue: StateSetter<T> = (updater) => {
      if (state.unmounted)
        return;
      const prevValue = state.values.get(stateIndex) as T;
      const nextValue = runUpdater(prevValue, updater);
      if (prevValue === nextValue)
        return;
      
      state.values.set(stateIndex, nextValue);
      reconciler.render(ref);
    };
    return [value, setValue];
  }
  
  function useEffect(effect: EffectConstructor, deps: Deps = null) {
    const effectIndex = state.hookIndex++;
    if (!state.effects.has(effectIndex))
      state.effects.set(effectIndex, createId("EffectID"));
    
    const prevDeps = state.deps.get(effectIndex) || null;
    const effectId = state.effects.get(effectIndex) as EffectID;
    state.deps.set(effectIndex, deps);
    const depsChanges = calculateDepsChange(prevDeps, deps)
    
    if (depsChanges) {
      if (!state.effectTasks)
        state.effectTasks = [];
      
      state.effectTasks.push({
        id: effectId,
        ref,
        func() {
          const prevCleanup = state.cleanups.get(effectId);
          if (prevCleanup) {
            state.cleanups.delete(effectId);
            prevCleanup();
          }
          state.cleanups.set(effectId, effect());
        }
      });
    }
  }

  return { useContext, useState, useEffect };
};