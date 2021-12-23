// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
import { createTree } from '@lukekaalim/act-reconciler';
import { createWebRenderer } from './renderer.js';
import { setNodeChildren } from "./node.js";

export const render = (element/*: Element*/, node/*: HTMLElement*/) => {
  const web = createWebRenderer();
  const onDiff = diff => setNodeChildren(diff, node, web.render(diff));
  const options = {
    onDiff,
    scheduleWork: (c) => requestAnimationFrame(() => void c()),
  };
  createTree(element, options);
};