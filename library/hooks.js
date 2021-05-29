// @flow strict
/*:: import type { Context } from './context.js'; */
/*::
type Updater<T> = (previousValue: T) => T;
type SetValue<T> = (value: T | Updater<T>) => mixed;
export type UseState = <T>(initialValue: T) => [T, SetValue<T>];

type CleanupFunc = () => mixed;
type Deps = null | mixed[];
type Effect = () => ?CleanupFunc;
export type UseEffect = (effect: Effect, deps?: Deps) => void;

export type UseContext = <T>(context: Context<T>) => T;

export type Hooks = {|
  useState: UseState,
  useEffect: UseEffect,
  useContext: UseContext,
|};
*/

export const setRegistry = (newHooks/*: Hooks*/) => {
  registry = newHooks;
};

// Global registry for hooks. This is set magically every component render by the reconciler.
let registry/*: Hooks*/ = {
  useState: () => { throw new Error(`Unset global hook`); },
  useEffect: () => { throw new Error(`Unset global hook`); },
  useContext: () => { throw new Error(`Unset global hook`); },
};

export const useState/*: UseState*/ = /*:: <T>*/(initialValue) => registry.useState(initialValue);
export const useEffect/*: UseEffect*/ = (effect, deps) => registry.useEffect(effect, deps);
export const useContext/*: UseContext*/ = /*:: <T>*/(context) => registry.useContext(context);
