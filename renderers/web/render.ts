import { h, Node } from "@lukekaalim/act";
import { createWebNodeBuilder, HTML } from "./space";
import { RenderSpace2 } from "@lukekaalim/act-backstage";
import { createDOMScheduler } from "./scheduler";
import { Reconciler2 } from "@lukekaalim/act-recon";

/**
 * Custom options for web.render
 */
type Options = {
  window?: Window;
}

/**
 * Render a node into the page.
 * 
 * 
 * @param node 
 * @param root 
 * @param options 
 * @returns 
 */
export const render = (node: Node, root: HTMLElement, options: Options = {}) => {
  const scheduler = createDOMScheduler();
  const reconciler = new Reconciler2(scheduler);
  const space = new RenderSpace2(reconciler.tree, createWebNodeBuilder(root, options.window));

  reconciler.bus = space.bus;
  reconciler.mount(h(HTML, {}, node));

  return {reconciler, space};
}
