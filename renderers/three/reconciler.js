// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
/*:: import type { Renderer } from '@lukekaalim/act-renderer-core'; */

import { createTree } from "@lukekaalim/act-reconciler";
import { createWebRenderer, setNodeChildren } from "@lukekaalim/act-web";

import { createSceneRenderer } from "./renderer";

export const render = (element/*: Element*/, node/*: HTMLElement*/) => {

  const scene = createSceneRenderer();
  const web = createWebRenderer(diff => {
    switch (diff.next.element.type) {
      case 'scene':
        return scene.render(diff);
      default:
        return web.render(diff);
    }
  });
  const onDiff = diff => {
    const children = web.render(diff);
    setNodeChildren(diff, node, children)
  };

  const options = {
    onDiff,
    scheduleWork: (c) => requestAnimationFrame(() => void c()),
    cancelWork: (t) => cancelAnimationFrame(t),
  };
  const tree = createTree(element, options);
};