// @flow strict
/*:: import type { Element, FunctionComponent, Props, UseState, Context } from '@lukekaalim/act'; */
/*:: import type { SetValue, Updater, Deps, Hooks, ContextID } from '@lukekaalim/act'; */

/*:: import type { BranchState, TraversalResult, Commit, Change, CommitRef, CommitID, CommitPath } from './commit2.js'; */
/*:: import type { Scheduler, EffectID } from './schedule.js'; */
/*:: import type { ContextState } from './context.js'; */

import { createId, normalizeElement, setRegistry } from '@lukekaalim/act';

/*::
export type ComponentState = {
  ref: CommitRef,
  values: Map<mixed, {|
    value: mixed,
    setValue: SetValue<mixed>,
  |}>,
  effects: Map<mixed, {|
    id: EffectID,
    cleanup: ?(() => mixed),
    deps: Deps,
  |}>,
  subscriptions: Map<ContextID, ContextState<mixed>>
};

export type ComponentService = {
  traverse: (ref: CommitRef, change: Change, branch: BranchState) => TraversalResult,
};
*/


export const depsAreEqual = (depsA/*: Deps*/, depsB/*: Deps*/)/*: boolean*/ => {
  if (depsA === null || depsB === null)
    return false;
  if (depsA.length !== depsB.length)
    return false;
  return depsA.every((value, index) => value === depsB[index]);
}

export const createComponentService = (scheduler/*: Scheduler*/)/*: ComponentService*/ => {
  const componentStates = new Map();
  
  const loadHooks = (state/*: ComponentState*/, branch)/*: Hooks*/ => {
    let key = 0;

    const createUseStateHook = /*:: <T>*/(initialValue/*: T*/) => {
      // $FlowFixMe[incompatible-use]
      const getValue = v => typeof v === 'function' ? v(hook.value) : v;

      const setValue = (newValue) => {
        hook.value = getValue(newValue);
        scheduler.scheduleChange(state.ref);
      };
    
      const hook = {
        value: getValue(initialValue),
        setValue,
      };
      state.values.set(key, hook);
      return hook;
    };
  
    const useState = /*:: <T>*/(initialValue) => {
      const hook = state.values.get(key) || createUseStateHook(initialValue);
      key++;
      return [hook.value, hook.setValue];
    };
    const useEffect = (newEffect, newDeps = null) => {
      const effect = state.effects.get(key) || { id: createId(), deps: null, cleanup: null };
      state.effects.set(key, effect);
      if (depsAreEqual(newDeps, effect.deps))
        return;
      const run = () => {
        if (effect.cleanup)
          effect.cleanup();
        effect.cleanup = newEffect();
      };
      effect.deps = newDeps;
      scheduler.scheduleEffect({ id: effect.id, priority: 'sync', run });
      key++;
      return;
    }
    const useContext = /*:: <T>*/(context/*: Context<T>*/)/*: T*/ => {
      const contextState = state.subscriptions.get(context.contextId) || branch.context.get(context.contextId);
      if (!contextState)
        return context.defaultValue;

      state.subscriptions.set(context.contextId, contextState);
      if (!contextState.subscribers.has(state.ref.id))
        contextState.subscribers.set(state.ref.id, state.ref);
  
      return (contextState.value/*: any*/);
    };
  
    // $FlowFixMe[prop-missing]
    return { useState, useEffect, useContext };
  }
  const teardownHooks = (state/*: ComponentState*/, branch) => {
    for (const [, { id, cleanup }] of state.effects)
      if (cleanup)
        scheduler.scheduleEffect({ id, priority: 'sync', run: () => void cleanup() })
    for (const [, s] of state.subscriptions)
      s.subscribers.delete(state.ref.id);
    
    componentStates.delete(state.ref.id);
  }

  const createNewComponentState = (ref)/*: ComponentState*/ => {
    const state = {
      ref,
      values: new Map(),
      effects: new Map(),
      subscriptions: new Map(),
    };
    componentStates.set(ref.id, state);
    return state;
  };

  const renderComponent = (state, element, branch) => {
    const hooks = loadHooks(state, branch)
    setRegistry(hooks);
    if (typeof element.type !== 'function')
      throw new Error('Components must be functions');
    try {
      const elementNode = element.type({ ...element.props, children: element.children });
      return normalizeElement(elementNode);
    } catch (error) {
      // TODO: suspension
      throw error;
    }
  };

  const traverse = (ref, change, branch) => {
    const state = componentStates.get(ref.id) || createNewComponentState(ref);
    if (change.element === null) {
      teardownHooks(state, branch);
      return { children: [], branch };
    }
    const children = renderComponent(state, change.element || change.prev.element, branch);

    return {
      children,
      branch,
    };
  };

  return {
    traverse,
  };
};