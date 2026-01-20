
import { h, Node } from "@lukekaalim/act";
import { NodeBuilder, RenderSpace2 } from "@lukekaalim/act-backstage";
import { createDebugScheduler, DebugReconciler } from "@lukekaalim/act-debug";
import { createWebNodeBuilder, HTML, render } from "@lukekaalim/act-web";
import { InsightApp } from "./InsightApp";
import { Reconciler2 } from "@lukekaalim/act-recon";

export type DevOptions = {
  mode?: 'extension' | 'popup'
};

export const renderDEV = (node: Node, builders: NodeBuilder<any, any>[], { mode = 'popup' }: DevOptions = {}) => {
  const reconciler = new DebugReconciler();
  const spaces = builders.map(builder => new RenderSpace2(reconciler.tree, builder));
  
  reconciler.bus = {
    render(delta) {
      for (const space of spaces)
        space.create(delta);
      for (const space of spaces)
        space.update(delta);
    },
  }
  switch (mode) {
    case 'popup':
      createDebugPopup(reconciler);
      break;
    default:
  }

  reconciler.mount(node);
}


const createDebugPopup = (reconciler: DebugReconciler) => {
  const newWindow = window.open("", "DevTools", "popup");
  if (!newWindow)
    throw new Error(`Unable to make/find new window!`);

  const body = newWindow.document.body;
  for (const child of [...body.childNodes, ...newWindow.document.head.childNodes])
    child.remove();

  for (const headElement of [...window.document.head.childNodes])
    if (headElement instanceof HTMLStyleElement)
        newWindow.document.head.appendChild(headElement.cloneNode(true))

  const internal_scheduler = createDebugScheduler({
    onAfterCallbackExecute() {},
    onInterceptEnd() {},
    onInterceptStart() {},
  }, 'DebugScheduler')
  const internal_reconciler = new Reconciler2(internal_scheduler);
  const internal_space = new RenderSpace2(internal_reconciler.tree, createWebNodeBuilder(body, newWindow));
  internal_reconciler.bus = internal_space.bus;
  internal_reconciler.mount(h(HTML, {},
    h(InsightApp, { controller: reconciler.controller, bus: reconciler.debugBus, document: newWindow.document })
  ));

}