// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
import { createBoundaryService, createEffectService, createReconciler, createSchedule2, createTree, createTreeService2 } from '@lukekaalim/act-reconciler';
import { createWebRenderer } from './renderer.js';
import { setNodeChildren2 } from "./node.js";

export const render = (element/*: Element*/, node/*: HTMLElement*/) => {
  const web = createWebRenderer();

  const onScheduleRequest = (callback) => {
    const id = requestAnimationFrame(() => callback(5));
    return () => cancelAnimationFrame(id);
  };
  const scheduler = createSchedule2(onScheduleRequest)
  const effect = createEffectService(scheduler);
  const boundary = createBoundaryService();
  const reconciler = createReconciler(scheduler);

  reconciler.diff.subscribeDiff((set) => {
    performance.mark('act:web:nodes:start')
    setNodeChildren2(node, web.render(set, set.root));
    performance.mark('act:web:nodes:end')
    performance.measure('act:web:nodes', 'act:web:nodes:start', 'act:web:nodes:end')
    performance.mark('act:web:effects:start')
    reconciler.tree.live.registry = effect.runEffectRegistry(set.registry);
    performance.mark('act:web:effects:end')
    performance.measure('act:web:effects', 'act:web:effects:start', 'act:web:effects:end')

    performance.mark('act:web:suspense:start')
    const map = boundary.calcBoundaryMap(set);
    boundary.getRootBoundaryValue(set.suspensions, set, map);
    performance.mark('act:web:suspense:end')
    performance.measure('act:web:suspense', 'act:web:suspense:start', 'act:web:suspense:end')
  });
  reconciler.tree.mount(element);
};