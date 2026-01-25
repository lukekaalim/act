
import { h, Node } from "@lukekaalim/act";
import { NodeBuilder, RenderSpace2 } from "@lukekaalim/act-backstage";
import { createDebugScheduler, DebugReconciler } from "@lukekaalim/act-debug";
import { createWebNodeBuilder, HTML, render } from "@lukekaalim/act-web";
import { InsightApp } from "./InsightApp";
import { Reconciler2 } from "@lukekaalim/act-recon";

export type DevOptions = {
  mode?: 'extension' | 'popup' | 'none'
};

export const renderDEV = (node: Node, builders: NodeBuilder<any, any>[], { mode = 'none' }: DevOptions = {}) => {
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

  const ref = reconciler.mount(node);
  return {ref, reconciler}
}


export const createDebugPopup = async (reconciler: DebugReconciler) => {
  const newWindow = window.open('', "DevTools", "popup");
  if (!newWindow)
    throw new Error(`Unable to make/find new window!`);

  const body = newWindow.document.body;
  for (const child of [...body.childNodes, ...newWindow.document.head.childNodes])
    child.remove();

  for (const headElement of [...window.document.head.childNodes])
    if (headElement instanceof HTMLStyleElement)
        newWindow.document.head.appendChild(headElement.cloneNode(true))
    else if (headElement instanceof HTMLLinkElement) {
      const element = headElement.cloneNode(true) as HTMLLinkElement;
      const src = new URL(element.href, document.location.href);
      element.href = src.href;
      newWindow.document.head.appendChild(element)
    }
    
  return new Promise<void>(onReady => {
    render(
      h(InsightApp, { controller: reconciler.controller, bus: reconciler.debugBus, document: newWindow.document, onReady }),
      body,
      { window: newWindow }
    );
  })

}