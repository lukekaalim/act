// @flow strict
/*:: import type { ContextID, Element } from '@lukekaalim/act'; */

/*:: import type { ContextState } from './context.js'; */
/*:: import type { ComponentState } from './component.js'; */
/*:: import type { CommitID, CommitDiff } from './commit2.js'; */
/*:: import type { ScheduleFunction, CancelFunction } from './schedule.js'; */

import { createBoundaryService } from "./boundary.js";
import { createCommitService, createEmptyCommit } from "./commit2.js";
import { createComponentService } from "./component.js";
import { createContextService } from "./context.js";
import { createScheduler } from "./schedule.js";

/*::
export type TreeOptions<T> = {
  onDiff?: CommitDiff => mixed,
  scheduleWork: ScheduleFunction<T>,
  cancelWork: CancelFunction<T>,
};
*/

export const createTree = /*:: <T>*/(
  element/*: Element*/,
  options/*: TreeOptions<T>*/ = {}
) => {
  const {
    onDiff = (d) => {},
    scheduleWork,
    cancelWork,
  } = options;

  const render = (targets) => {
    const renderDiff = commit.render({ targets, prev });
    prev = renderDiff.next;
    
    if (prev.suspension)  
      throw prev.suspension.value;

    onDiff(renderDiff);
  };

  const schedule = createScheduler(render, scheduleWork, cancelWork);
  const context = createContextService();
  const component = createComponentService(schedule, context);
  const boundary = createBoundaryService();
  const commit = createCommitService(component, context, boundary);

  const initDiff = commit.render({ element, prev: createEmptyCommit(), targets: [] });
  let prev = initDiff.next;
  onDiff(initDiff);

  schedule.flushSync();
};