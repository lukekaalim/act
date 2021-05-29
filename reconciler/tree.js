// @flow strict
/*:: import type { ContextID, Element } from '@lukekaalim/act'; */

/*:: import type { StateID, ComponentState } from './state2.js'; */
/*:: import type { ContextState } from './context.js'; */
/*:: import type { CreateDiff, UpdateDiff } from './commit2.js'; */

import { createCommitService, getStateId } from "./commit2.js";
import { createComponentService } from "./component.js";
import { createContextService } from "./context.js";

/*::
export type Tree = {|
  update: ComponentState => void,
  states: Map<StateID, ComponentState>,
  contexts: Map<StateID, ContextState<mixed>>,
|};

export type TreeOptions = {
  onCreate?: CreateDiff => mixed,
  onUpdate?: UpdateDiff => mixed,
  scheduleWork?: (() => void) => mixed,
};
*/

export const createTree = (
  element/*: Element*/,
  options/*: TreeOptions*/ = {}
)/*: Tree*/ => {
  const {
    onCreate,
    onUpdate,
    scheduleWork = (s) => setTimeout(s, 0)
  } = options;

  const schedule = new Map();
  const update = (newState) => {
    const stateId = getStateId(newState.path);
    if (schedule.size === 0)
      scheduleWork(checkSchedule)
    states.set(stateId, newState);
    schedule.set(stateId, newState);
  };
  const checkSchedule = () => {
    const work = [...schedule];
    schedule.clear();
    for (const [stateId, newState] of work) {
      const updateDiff = commit.updateWithState(root, newState.path);
      root = updateDiff.next;
      onUpdate && onUpdate(updateDiff);
    }
  };

  const states = new Map();
  const contexts = new Map();
  const tree = {
    update,
    states,
    contexts,
  };
  const component = createComponentService(tree);
  const context = createContextService(tree);
  const commit = createCommitService(component, context);
  const createDiff = commit.create(element);
  
  let { next: root } = createDiff;
  onCreate && onCreate(createDiff);
  return tree;
};