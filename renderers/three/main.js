// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
import { createTree } from "@lukekaalim/act-reconciler";
import { createWebRenderService } from "@lukekaalim/act-web";
import { attachNodes } from "@lukekaalim/act-web/node.js";
import { createThreeRenderer } from "./render.js";

export const render = (element/*: Element*/, node/*: HTMLElement*/) => {
  const { renderRoot } = createThreeRenderer();
  const web = createWebRenderService(new Map([['Three', { render: renderRoot }]]));

  const onDiff = diff => attachNodes(node, web.render(diff));

  const options = {
    onDiff,
    scheduleWork: (c) => requestAnimationFrame(() => void c()),
  };
  const tree = createTree(element, options);
};

export * from './components.js';