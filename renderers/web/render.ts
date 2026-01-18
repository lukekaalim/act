import { h, Node } from "@lukekaalim/act";
import { createWebNodeBuilder, HTML } from "./space";
import { RenderSpace2 } from "@lukekaalim/act-backstage";
import { createDOMScheduler } from "./scheduler";
import { Reconciler2 } from "@lukekaalim/act-recon";

type Options = {
  window?: Window;
}

export const render = (node: Node, root: HTMLElement, options: Options = {}) => {
  const scheduler = createDOMScheduler();
  const reconciler = new Reconciler2(scheduler);
  const space = new RenderSpace2(reconciler.tree, createWebNodeBuilder(root, options.window));

  reconciler.bus = {
    render(delta) {
      console.log({ delta })
      space.create(delta);
      space.update(delta);
    },
  };
  reconciler.mount(h(HTML, {}, node));

  return {reconciler, space};
}
