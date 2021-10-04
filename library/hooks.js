// @flow strict
/*:: import type { Context } from './context.js'; */
/*::
export type Updater<T> = (previousValue: T) => T;
export type SetValue<T> = (value: T | Updater<T>) => void;
export type UseState = <T>(initialValue: T | () => T) => [T, SetValue<T>];

type CleanupFunc = () => mixed;
export type Deps = null | mixed[];
type Effect = () => ?CleanupFunc;
export type UseEffect = (effect: Effect, deps?: Deps) => void;

export type UseContext = <T>(context: Context<T>) => T;

export type UseMemo = <T>(calc: () => T, deps?: Deps) => T;
export type UseRef = <T>(initial: T) => { current: T };

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

export const useRef/*: UseRef*/ = /*:: <T>*/(initialValue/*: T*/)/*: { current: T }*/ => {
  const [value] = useState/*:: <{ current: T }>*/({ current: initialValue })
  return value;
};

export const useMemo/*: UseMemo*/ = /*:: <T>*/(calc/*: () => T*/, deps/*: Deps*/ = [])/*: T*/ => {
  const { current: memoState } = useRef/*:: <{ isSet: boolean, value: T, oldDeps: Deps }>*/({
    isSet: false,
    value: (null/*: any*/),
    oldDeps: deps
  });
  if (!memoState.isSet) {
    memoState.isSet = true;
    memoState.value = calc();
    return memoState.value;
  }
  const { oldDeps } = memoState;
  if ((deps && oldDeps) && (
    deps.length !== oldDeps.length ||
    deps.every((dep, i) => dep !== oldDeps[i])
  )) {
    memoState.value = calc();
    memoState.oldDeps = deps;
  }
  return memoState.value;
};