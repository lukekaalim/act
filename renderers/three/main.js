// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
/*:: import type { ThreeRenderer } from "./render.js"; */

import { createTree } from "@lukekaalim/act-reconciler";
import { createWebRenderService } from "@lukekaalim/act-web";
import { attachNodes } from "@lukekaalim/act-web/node.js";
import { createThreeRenderer } from "./render.js";

export const render = (element/*: Element*/, node/*: HTMLElement*/, renderer/*: ThreeRenderer*/ = createThreeRenderer()) => {
  const { renderRoot } = renderer;
  const web = createWebRenderService(new Map([['three', { render: renderRoot }]]));

  const onDiff = diff => attachNodes(node, web.render(diff));

  const options = {
    onDiff,
    scheduleWork: (c) => requestAnimationFrame(() => void c()),
  };
  const tree = createTree(element, options);
};

export * from './render.js';
export * from './node.js';
export * from './components.js';