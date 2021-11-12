// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
/*:: import type { Renderer } from '@lukekaalim/act-renderer-core'; */

import { createTree } from "@lukekaalim/act-reconciler";
import { createWebRenderer } from "@lukekaalim/act-web";
import { attachNodes } from "@lukekaalim/act-web/node.js";
import { createThreeRenderer } from "./renderer.js";

export const render = (element/*: Element*/, node/*: HTMLElement*/) => {
  const three = createThreeRenderer();
  const web = createWebRenderer({
    'three': three,
  });
  const onDiff = diff => attachNodes(node, web.render(diff));

  const options = {
    onDiff,
    scheduleWork: (c) => requestAnimationFrame(() => void c()),
  };
  const tree = createTree(element, options);
};