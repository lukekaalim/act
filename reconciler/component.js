// @flow strict
/*:: import type { Element, Component, Props } from '@lukekaalim/act'; */

/*:: import type { Commit } from './commit2.js'; */
/*:: import type { StateID, StatePath } from './state2.js'; */
/*:: import type { Tree } from './tree.js'; */

import { normalizeElement, setRegistry } from '@lukekaalim/act'

import { getStateId } from './commit2.js';
import { loadHooks, teardownHooks } from './hooks.js';

/*::
export type ComponentService = {|
  traverseComponent: (
    path: StatePath,
    component: Component<Props>,
    props: Props,
    children: $ReadOnlyArray<Element>
  ) => Element[],
  teardownComponent: (path: StatePath) => void,
|};
*/

export const createComponentService = (tree/*: Tree*/)/*: ComponentService*/ => {
  const createNewComponentState = (id, path) => {
    const state = {
      path,
      id,
      useStateData: new Map(),
      useEffectData: new Map(),
      useContextData: new Map(),
    };
    tree.states.set(id, state);
    return state;
  };
  const traverseComponent = (path, component, props, children) => {
    const id = getStateId(path);
    const state = tree.states.get(id) || createNewComponentState(id, path);
    const hooks = loadHooks(tree, state);
    setRegistry(hooks);
    const elementNode = component({ ...props, children });
    return normalizeElement(elementNode);
  };
  const teardownComponent = (path) => {
    const id = getStateId(path);
    const state = tree.states.get(id);

    if (state)
      teardownHooks(tree, state);

    tree.states.delete(id);
  };

  return {
    traverseComponent,
    teardownComponent,
  };
};