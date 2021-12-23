// @flow strict
/*:: import type { ContextID, Element } from '@lukekaalim/act'; */

/*:: import type { ContextState } from './context.js'; */
/*:: import type { ComponentState } from './component.js'; */
/*:: import type { CommitID, CommitDiff, UpdateElementChange } from './commit2.js'; */
/*:: import type { ScheduleFunction } from './schedule.js'; */

import { createBoundaryService } from "./boundary.js";
import { createCommitService } from "./commit2.js";
import { createComponentService } from "./component.js";
import { createContextService } from "./context.js";
import { createScheduler } from "./schedule.js";

/*::

export type TreeOptions = {
  onDiff?: CommitDiff => mixed,
  scheduleWork?: ScheduleFunction,
};
*/

export const createTree = (
  element/*: Element*/,
  options/*: TreeOptions*/ = {}
) => {
  const {
    onDiff = (d) => {},
    scheduleWork = (s) => setTimeout(s, 0)
  } = options;

  const render = (ref) => {
    const renderDiff = commit.render({ ref, prev });
    prev = renderDiff.next;
    onDiff(renderDiff);
  };

  const schedule = createScheduler(render, scheduleWork);
  const component = createComponentService(schedule);
  const context = createContextService(schedule);
  const boundary = createBoundaryService();
  const commit = createCommitService(component, context, boundary);

  const initDiff = commit.render({ element, prev: null });
  let prev = initDiff.next;
  onDiff(initDiff);
  schedule.flushSync();
};