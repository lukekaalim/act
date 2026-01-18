import { h, Node } from "@lukekaalim/act";
import { RenderSpace2 } from "@lukekaalim/act-backstage";
import { Reconciler2 } from "@lukekaalim/act-recon";
import { createDOMScheduler, createWebNodeBuilder, HTML } from "@lukekaalim/act-web";
import { createThreeJSBuilder, ThreeJSRoot } from "./builder";
import { Object3D } from "three";

type Options = {
  web?: {}
};

export const render = (node: Node, root: HTMLElement, options: Options = {}) => {
  const scheduler = createDOMScheduler();
  const reconciler = new Reconciler2(scheduler);

  const webSpace = new RenderSpace2(reconciler.tree, createWebNodeBuilder(root));
  const threeSpace = new RenderSpace2(reconciler.tree, createThreeJSBuilder());

  reconciler.bus = {
    render(delta) {
      webSpace.create(delta);
      threeSpace.create(delta);

      webSpace.update(delta);
      threeSpace.update(delta);
    },
  }
  reconciler.mount(h(HTML, {}, node));
}

export const renderToObject = (node: Node, root: Object3D) => {
  const scheduler = createDOMScheduler();
  const reconciler = new Reconciler2(scheduler);
  const threeSpace = new RenderSpace2(reconciler.tree, createThreeJSBuilder(root));

  reconciler.bus = threeSpace.bus;

  reconciler.mount(h(ThreeJSRoot, {}, node));
}