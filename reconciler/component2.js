// @flow strict

import { h, setRegistry, depsAreEqual, normalizeElement } from "@lukekaalim/act";

/*::
import type { Element, Hooks, SetValue, CleanupFunc, Deps, FunctionComponent, ElementNode } from "@lukekaalim/act";
import type { CommitID3, CommitRef3 } from "./commit3";
import type { ContextService } from "./context";
import type { Updater, UseState } from "../library/hooks";
import type { Context } from "../library/context";
import type { Effect, EffectID } from "./schedule";
import type { ContextService2 } from "./context2";
import type { EffectRegistry, EffectService } from "./effect";
import type { TreeService2 } from "./tree2";

export type ComponentState = {
  ref: CommitRef3,
  run: (component: FunctionComponent<mixed>, props: any, effect: EffectRegistry) => ElementNode,
  teardown: (effect: EffectRegistry) => void,
};

export type ComponentService2 = {
  render: (ref: CommitRef3, element: Element, effect: EffectRegistry) => $ReadOnlyArray<Element>,
  remove: (ref: CommitRef3, effect: EffectRegistry) => void,
}
*/

export const createComponentService = (
  context/*: ContextService2*/,
  updateCommit/*: CommitRef3 => mixed*/,
)/*: ComponentService2*/ => {
  const componentStateMap/*: Map<CommitID3, ComponentState>*/ = new Map();

  /**
   * For neatness, an entire components state (its useState calls, useEffects,
   * context subscriptions) are all contained in a closure thats created
   * when each component mounts for the first time.
   */
  const createComponentState = (ref, initialRegistry)/*: ComponentState*/ => {
    /***
     * Hooks are kind of strange, in that the order that they are
     * executed is signifiant for a component. Becuse of that,
     * we store internal variables against a special variable
     * that we increment every time a component uses a hook.
     * 
     * Components are instructed to never conditionally call
     * a hook, as that will totally mess up the function order.
     */
    let indicies = {
      states: 0,
      effects: 0,
      contexts: 0,
    }
    let registry = initialRegistry;

    // UseState
    const states = new Map();
    const useState = (initialUpdater/*: any*/) => {
      const getValueFromUpdater = (updater, currentValue) => {
        if (typeof updater === 'function')
          return updater(currentValue);
        return updater;
      };
      const createPair = () => {
        const setState = (updater) => {
          const value = getValueFromUpdater(updater, pair[0]);
          if (value === pair[0])
            return;
          pair[0] = value;
          updateCommit(ref);
        };
        const pair/*: [any, SetValue<any>]*/ = [getValueFromUpdater(initialUpdater, undefined), setState]
        states.set(indicies.states, pair);
        return pair;
      };
      const pair = states.get(indicies.states) || createPair();
      indicies.states++;
      return pair;
    };

    // Use Effect
    const effects = new Map/*:: <number, { firstRun: boolean, deps: Deps, id: EffectID }>*/();
    const useEffect = (effectFunc, currentDeps = null) => {
      const createEffectState = () => {
        const id = registry.registerEffect(effectFunc);
        const state = { firstRun: true, deps: currentDeps, id }
        effects.set(indicies.effects, state);
        return state;
      }
      const effectState = effects.get(indicies.effects) || createEffectState();
      
      if (!depsAreEqual(effectState.deps, currentDeps) && !effectState.firstRun) {
        registry.updateEffect(effectState.id, effectFunc);
        effectState.deps = currentDeps;
      }
      if (effectState.firstRun) {
        effectState.firstRun = false;
      }

      indicies.effects++;
    };
    // Use Context
    const contexts = new Map();
    const useContext = /*:: <T>*/({ contextId, defaultValue }/*: Context<T>*/)/*: T*/ => {
      const createContextProvider = () => {
        const provider = context.getProviderForPath(contextId, ref.path, defaultValue);
        const { detach } = provider.attach(ref);
        const state = { provider, detach }
        contexts.set(indicies.contexts, state);
        return state;
      }
      const contextState = contexts.get(indicies.contexts) || createContextProvider();
      
      const value/*: any*/ = contextState.provider.value;

      indicies.contexts++;
      return value;
    };

    const hooks/*: Hooks*/ = {
      useState,
      useEffect,
      useContext,
    }

    const run = (component, props, currentRegistry) => {
      indicies.states = 0;
      indicies.effects = 0;
      indicies.contexts = 0;
      registry = currentRegistry

      const prevHooks = setRegistry(hooks);
      try {
        return component(props)
      } catch (value) {
        return h('act:suspend', { value })
      } finally {
        if (prevHooks)
          setRegistry(prevHooks)
      }
    };

    const teardown = (currentRegistry) => {
      for (const [,effectState] of effects) {
        currentRegistry.teardownEffect(effectState.id)
      }
      for (const [,contextState] of contexts)
        contextState.detach();
    };

    const state = {
      ref,
      run,
      teardown,
    };

    componentStateMap.set(ref.id, state);
    return state;
  }

  const render = (ref, element, effect) => {
    const { type, props, children } = element;
    if (typeof type === 'string')
      return element.children;

    const state = componentStateMap.get(ref.id) || createComponentState(ref, effect);
    return normalizeElement(state.run(type, { ...props, children }, effect));
  };

  const remove = (ref, effect) => {
    const state = componentStateMap.get(ref.id);
    if (!state)
      return;
    state.teardown(effect);
    componentStateMap.delete(ref.id);
    return;
  }
  return { render, remove };
}