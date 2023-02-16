// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
/*:: import type { Renderer } from '@lukekaalim/act-renderer-core'; */

import { createBoundaryService, createEffectService, createReconciler, createSchedule2, createTree, createTreeService2 } from "@lukekaalim/act-reconciler";
import { createNullRenderer2 } from "@lukekaalim/act-renderer-core";
import { createWebRenderer, setNodeChildren } from "@lukekaalim/act-web";
import { setNodeChildren2 } from "@lukekaalim/act-web/node";

import { createObjectRenderer } from "./renderer.js";

export const render = (element/*: Element*/, node/*: HTMLElement*/) => {
  const webToThree = createNullRenderer2(() => object, ['three']);
  const threeToWeb = createNullRenderer2(() => web, ['web']);

  const object = createObjectRenderer((type) => {
    switch (type) {
      case 'web':
        return threeToWeb;
      default:
        return null;
    }
  });
  const web = createWebRenderer(type => {
    switch (type) {
      case 'scene':
      case 'three':
        return webToThree;
      default:
        return null;
    }
  });

  const scheduler = createSchedule2((callback) => {
    const id = requestAnimationFrame(() => callback(16));
    return () => cancelAnimationFrame(id);
  })
  const effect = createEffectService(scheduler);
  const boundary = createBoundaryService();

  const reconciler = createReconciler(scheduler);
  
  reconciler.diff.subscribeDiff(set => {
    const children = web.render(set, set.root);
    setNodeChildren2(node, children);

    reconciler.tree.live.registry = effect.runEffectRegistry(set.registry);


    const map = boundary.calcBoundaryMap(set);
    boundary.getRootBoundaryValue(set.suspensions, set, map);
  })
  reconciler.tree.mount(element);
};