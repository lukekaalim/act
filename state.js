// @flow strict
/*:: import type { Graph } from './graph'; */
/*:: import type { ContextSubscriberID, ContextID } from './context'; */

/*:: import type { UseEffect } from './state/useEffect'; */
/*:: import type { UseState } from './state/useState'; */
/*:: import type { UseContext } from './state/useContext'; */

/*:: export type * from './state/useEffect'; */
/*:: export type * from './state/useState'; */
/*:: export type * from './state/useContext'; */
const { nanoid: uuid } = require('nanoid');

const { setupUseState, loadUseState, teardownUseState } = require('./state/useState');
const { setupUseEffect, loadUseEffect, teardownUseEffect } = require('./state/useEffect');
const { setupUseContext, loadUseContext, teardownUseContext } = require('./state/useContext');

/*::
export type StateID = string;
export type StatePath = StateID[]

export type StateHooks = {
  useState: UseState,
  useEffect: UseEffect,
  useContext: UseContext,
  useMemo: <T>(calculator: () => T, deps: mixed[]) => T,
  useGraph: () => Graph,
  useStatePath: () => StatePath,
  useHooks: <T>(hookLoader: (hooks: StateHooks) => T) => T,
};

export type CommitState = {
  usedStates: Map<number, {
    value: mixed,
    updater: (value: mixed) => void,
  }>,
  usedEffects: Map<number, {
    cleanup: ?(() => void),
    deps: null | mixed[]
  }>,
  usedContexts: Map<number, {
    contextId: ContextID,
    providerId: StateID,
    subscriberId: ContextSubscriberID,
    currentValue: mixed,
  }>,
};

export type StateUpdate = {
  path: StatePath,
  newState: CommitState,
};
*/
const createStateId = ()/*: StateID*/ => uuid();

const loadUseMemo = (useState, useEffect) =>
  /*:: <T>*/(calculator/*: () => T*/, deps/*: mixed[]*/)/*: T*/ => {
  const [calculation, updateCalculation] = useState(calculator());

  useEffect(() => {
    updateCalculation(calculator());
  }, deps)

  return calculation;
};

const setupHooks = (graph/*: Graph*/, path/*: StatePath*/)/*: StateHooks*/ => {
  const state = {
    usedStates: new Map(),
    usedEffects: new Map(),
    usedContexts: new Map(),
  };
  graph.states.set(path[path.length - 1], state);

  const useState = setupUseState(graph, path, state);
  const useEffect = setupUseEffect(graph, path, state);
  const useContext = setupUseContext(graph, path, state);
  const useMemo = loadUseMemo(useState, useEffect);
  
  const hooks = {
    useState,
    useEffect,
    useContext,
    useHooks: /*::<T>*/(loader/*: StateHooks => T*/)/*: T*/ => loader(hooks),
    useGraph: () => graph,
    useStatePath: () => path,
    useMemo,
  };

  return hooks;
};

const loadHooks = (graph/*: Graph*/, path/*: StatePath*/)/*: StateHooks*/ => {
  const state = graph.states.get(path[path.length - 1]);
  if (!state)
    throw new Error(`Attempting to Load hook that was not setup`);

  const useState = loadUseState(graph, path, state);
  const useEffect = loadUseEffect(graph, path, state);
  const useContext = loadUseContext(graph, path, state);
  const useMemo = loadUseMemo(useState, useEffect);

  const hooks = {
    useState,
    useEffect,
    useContext,
    useHooks: /*::<T>*/(loader/*: StateHooks => T*/)/*: T*/ => loader(hooks),
    useGraph: () => graph,
    useStatePath: () => path,
    useMemo,
  };

  return hooks;
};

const teardownHooks = (graph/*: Graph*/, path/*: StatePath*/) => {
  const state = graph.states.get(path[path.length - 1]);
  if (!state)
    throw new Error(`Attempting to Teardown hook that was not setup`);

  teardownUseState(graph, path, state);
  teardownUseEffect(graph, path, state);
  teardownUseContext(graph, path, state);

  graph.states.delete(path[path.length - 1]);
};

const getStateId = (path/*: StatePath*/)/*: StateID*/ => path[path.length - 1];

module.exports = {
  ...require('./state/useState'),
  ...require('./state/useEffect'),
  ...require('./state/useContext'),
  setupHooks,
  loadHooks,
  teardownHooks,
  createStateId,
  getStateId,
  id: getStateId,
};
