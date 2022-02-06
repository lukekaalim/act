// @flow strict
/*:: import type { Element, FunctionComponent, Props, UseState, Context } from '@lukekaalim/act'; */
/*:: import type { SetValue, Updater, Deps, Hooks, ContextID } from '@lukekaalim/act'; */

/*:: import type { BranchState, Commit, Change, CommitRef, CommitID, CommitPath, Suspension } from './commit2.js'; */
/*:: import type { Scheduler, EffectID } from './schedule.js'; */
/*:: import type { ContextState, ContextService } from './context.js'; */

import { createId, normalizeElement, setRegistry } from '@lukekaalim/act';

/*::
export type ComponentState = {
  ref: CommitRef,
  values: Map<mixed, {|
    value: any,
    setValue: SetValue<any>,
  |}>,
  effects: Map<mixed, {|
    id: EffectID,
    cleanup: ?(() => mixed),
    deps: Deps,
  |}>,
  contexts: Set<CommitRef>,
};

export type ComponentService = {
  calculateNextChildren: (commit: Commit, element: Element, branch: BranchState) => [Element[], ?Suspension],
  teardownComponent: (commit: Commit) => void,
};
*/


export const depsAreEqual = (depsA/*: Deps*/, depsB/*: Deps*/)/*: boolean*/ => {
  if (depsA === null || depsB === null)
    return false;
  if (depsA.length !== depsB.length)
    return false;
  return depsA.every((value, index) => value === depsB[index]);
}

export const createComponentService = (
  scheduler/*: Scheduler*/,
  contextService/*: ContextService*/
)/*: ComponentService*/ => {
  const componentStates = new Map();
  
  const loadHooks = (state/*: ComponentState*/, branch)/*: Hooks*/ => {
    let key = 0;

    const createUseStateHook = /*:: <T>*/(initialValue/*: T*/) => {
      // $FlowFixMe[incompatible-use]
      const getValue = v => typeof v === 'function' ? v(hook.value) : v;

      const setValue = (newValue) => {
        const nextHookValue = getValue(newValue);
        if (nextHookValue === hook.value)
          return;
        hook.value = nextHookValue;
        scheduler.scheduleChange(state.ref);
        scheduler.scheduleFlush();
      };
    
      const hook = {
        // $FlowFixMe[incompatible-use]
        value: typeof initialValue === 'function' ? initialValue() : initialValue,
        setValue,
      };
      state.values.set(key, hook);
      return hook;
    };
  
    const useState/*: UseState*/ = /*:: <T>*/(initialValue) => {
      const hook = state.values.get(key) || createUseStateHook(initialValue);
      key++;
      return [hook.value, hook.setValue];
    };
    const useEffect = (newEffect, newDeps = null) => {
      const effect = state.effects.get(key) || { id: createId(), deps: null, cleanup: null };
      state.effects.set(key, effect);
      if (depsAreEqual(newDeps, effect.deps)) {
        key++;
        return;
      }
      const run = () => {
        if (effect.cleanup)
          effect.cleanup();
        effect.cleanup = newEffect();
      };
      effect.deps = newDeps;
      scheduler.scheduleEffect({ id: effect.id, priority: 'sync', run });
      scheduler.scheduleFlush();
      key++;
      return;
    }
    const useContext = /*:: <T>*/(context/*: Context<T>*/)/*: T*/ => {
      const contextState = branch.context[context.contextId];

      if (!contextState)
        return context.defaultValue;

      if (!state.contexts.has(contextState.ref)) {
        contextService.attachSubscriber(contextState.ref, state.ref);
        state.contexts.add(contextState.ref);
      }

      return contextState.value;
    };
  
    // $FlowFixMe[prop-missing]
    return { useState, useEffect, useContext };
  }
  const teardownHooks = (state) => {
    for (const [, { id, cleanup }] of state.effects)
      if (cleanup) {
        scheduler.scheduleEffect({ id, priority: 'sync', run: () => void cleanup() });
      }
    if (state.effects.size > 0)
      scheduler.scheduleFlush();
    
    componentStates.delete(state.ref.id);
  }

  const createNewComponentState = (ref)/*: ComponentState*/ => {
    const state = {
      ref,
      values: new Map(),
      effects: new Map(),
      contexts: new Set(),
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
      return [normalizeElement(elementNode), null];
    } catch (error) {
      return [null, error];
    }
  };

  const calculateNextChildren = (commit, element, branch) => {
    const state = componentStates.get(commit.id) || createNewComponentState(commit);
    if (element.type === 'act:dead') {
      teardownHooks(state);
      return [[], null];
    }
    const [children, error] = renderComponent(state, element, branch);

    return [children || [], { ref: commit, value: error }];
  }
  const teardownComponent = (commit) => {
    const state = componentStates.get(commit.id);
    if (state)
      teardownHooks(state);
  }

  return {
    calculateNextChildren,
    teardownComponent,
  };
};