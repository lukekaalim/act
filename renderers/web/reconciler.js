// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
import { createBoundaryService, createEffectService, createReconciler, createSchedule2, createTree, createTreeService2 } from '@lukekaalim/act-reconciler';
import { createWebRenderer } from './renderer.js';
import { setNodeChildren2 } from "./node.js";

export const render = (element/*: Element*/, node/*: HTMLElement*/) => {
  const web = createWebRenderer();

  const onScheduleRequest = (callback) => {
    const id = requestAnimationFrame(() => callback(16));
    return () => cancelAnimationFrame(id);
  };
  const scheduler = createSchedule2(onScheduleRequest)
  const effect = createEffectService(scheduler);
  const boundary = createBoundaryService();
  const reconciler = createReconciler(scheduler);

  reconciler.diff.subscribeDiff((set) => {
    setNodeChildren2(node, web.render(set, set.root));
    reconciler.tree.live.registry = effect.runEffectRegistry(set.registry);

    const map = boundary.calcBoundaryMap(set);
    boundary.getRootBoundaryValue(set.suspensions, set, map);
  });
  reconciler.tree.mount(element);
};