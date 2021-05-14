// @flow strict
/*:: import type { ActGraph } from '../graph'; */
/*:: import type { StatePath, CommitState } from '../state'; */

/*::
export type Updater<T> = (old: T) => T;
export type SetState<T> = (newValue: T | Updater<T>) => void
export type UseState = <T>(initialValue: T) => [T, SetState<T>];
*/

const setupUseState = (graph/*: ActGraph*/, path/*: StatePath*/, initialState/*: CommitState*/)/*: UseState*/ => {
  let useStateCount = 0;

  const useState = (initialValue/*: mixed*/) => {
    const stateIndex = ++useStateCount;

    const setValue = (newValue) => {
      const currentState = graph.states.get(path[path.length - 1]);
      if (!currentState)
        throw new Error(`Attempting to set state on non-existing hook`);
      const usedStates = new Map(currentState.usedStates);

      const getUpdatedValue = (value) => {
        if (typeof value === 'function') {
          const state = usedStates.get(stateIndex)
          const previousValue = state && state.value || initialValue;
          return (value/*: Function*/)(previousValue)
        }
        return value;
      }

      usedStates.set(stateIndex, {
        updater: setValue,
        value: getUpdatedValue(newValue),
      });
      return graph.update({
        path,
        newState: {
          ...currentState,
          usedStates,
        },
      });
    };
    initialState.usedStates.set(stateIndex, {
      updater: setValue,
      value: initialValue,
    });
    return [initialValue, setValue];
  };

  return ((useState/*: any*/)/*: UseState*/);
};

const loadUseState = (graph/*: ActGraph*/, path/*: StatePath*/, state/*: CommitState*/)/*: UseState*/ => {
  let useStateCount = 0;

  const useState = () => {
    const stateIndex = ++useStateCount;

    const cachedHook = state.usedStates.get(stateIndex);
    if (!cachedHook)
      throw new Error(`Attempting to use Hook that was not setup`);
    const { updater, value } = cachedHook;
    return [value, updater];
  };

  // $FlowFixMe
  return useState;
}

const teardownUseState = (graph/*: ActGraph*/, path/*: StatePath*/, state/*: CommitState*/) => {
  
}

module.exports = {
  setupUseState,
  loadUseState,
  teardownUseState,
};