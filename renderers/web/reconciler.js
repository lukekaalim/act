// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
import { createTree } from '@lukekaalim/act-reconciler';
import { attachNodes } from './node.js';
import { createWebRenderer } from './renderer.js';

export const render = (element/*: Element*/, node/*: HTMLElement*/) => {
  const web = createWebRenderer();
  const onDiff = diff => attachNodes(node, web.render(diff));
  const options = {
    onDiff,
    scheduleWork: (c) => requestAnimationFrame(() => void c()),
  };
  createTree(element, options);
};