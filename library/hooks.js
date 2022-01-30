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

export type Ref<T> = { current: T };

export type UseMemo = <T>(calc: () => T, deps?: Deps) => T;
export type UseRef = <T>(initial: T) => Ref<T>;

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

export const useState/*: UseState*/ = /*:: <T>*/(initialValue)/*: [T, SetValue<T>]*/ => registry.useState(initialValue);
export const useEffect/*: UseEffect*/ = (effect, deps) => registry.useEffect(effect, deps);
export const useContext/*: UseContext*/ = /*:: <T>*/(context)/*: T*/ => registry.useContext(context);

export const useRef/*: UseRef*/ = /*:: <T>*/(initialValue/*: T*/)/*: { current: T }*/ => {
  const [value] = useState/*:: <{ current: T }>*/({ current: initialValue })
  return value;
};

export const depsAreEqual = (prev/*: null | mixed[]*/, next/*: null | mixed[]*/)/*: boolean*/ => {
  if (prev && next)
    return (
      prev.length !== next.length &&
      next.every((dep, i) => dep === prev[i])
    );

  return prev === next;
};

export const useMemo/*: UseMemo*/ = /*:: <T>*/(calc/*: () => T*/, deps/*: Deps*/ = [])/*: T*/ => {
  const { current: memoState } = useRef({
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
  if (!depsAreEqual(deps, oldDeps)) {
    memoState.value = calc();
    memoState.oldDeps = deps;
  }
  return memoState.value;
};