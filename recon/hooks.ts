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
import { ElementOutput2 } from "./element";

/**
 * A fresh set of hook functions is created per component run.
 */
export const loadHooks2 = (
  reconciler: Reconciler2,
  state: ComponentState,
  output: ElementOutput2
): HookImplementation => {
  function useContext<T>(context: Context<T>): T {
    const stateIndex = state.hookIndex++;

    if (!state.providers.has(stateIndex)) {
      const provider = output.ref.find(ref => {
        const provider = reconciler.tree.contexts.get(ref.id)
        if (provider && provider.contextId === context.id)
          return provider;
      })
      if (provider) {
        provider.consumers.set(output.ref.id, output.ref);
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
      reconciler.render(output.ref);
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
      const prevCleanup = reconciler.tree.cleanups.get(effectId);
      if (prevCleanup) {
        if (!output.cleanups)
          output.cleanups = [];

        output.cleanups.push({
          id: effectId,
          ref: output.ref,
          func: prevCleanup
        })
      }
      if (!output.effects)
        output.effects = [];
      
      output.effects.push({
        id: effectId,
        ref: output.ref,
        func: effect
      });
    }
  }

  return { useContext, useState, useEffect };
};