
import { h, Node } from "@lukekaalim/act";
import { NodeBuilder, RenderSpace2 } from "@lukekaalim/act-backstage";
import { DebugReconciler, ValueReport } from "@lukekaalim/act-debug";
import { createDOMScheduler, createWebNodeBuilder, HTML, render } from "@lukekaalim/act-web";
import { CommitID, Reconciler2 } from "@lukekaalim/act-recon";
import { InsightApp2 } from "./InsightApp2";
import { DirectDebugClient } from "@lukekaalim/act-debug/client";

export type DevOptions = {
  mode?: 'extension' | 'popup' | 'none'
};

export const renderDEV = (node: Node, builders: NodeBuilder<any, any>[], { mode = 'none' }: DevOptions = {}) => {
  const reconciler = new DebugReconciler(createDOMScheduler());
  const spaces = builders.map(builder => new RenderSpace2(reconciler.tree, builder));
  
  reconciler.bus = {
    render(delta) {
      console.log('Render captured')
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

  body.style.margin = '0';
  body.style.overflow = 'hidden';

  for (const headElement of [...window.document.head.childNodes])
    if (headElement instanceof HTMLStyleElement)
        newWindow.document.head.appendChild(headElement.cloneNode(true))
    else if (headElement instanceof HTMLLinkElement) {
      const element = headElement.cloneNode(true) as HTMLLinkElement;
      const src = new URL(element.href, document.location.href);
      element.href = src.href;
      newWindow.document.head.appendChild(element)
    }

  const client = new DirectDebugClient(reconciler);
    
  console.log('Lets make our new window')

  return new Promise<void>(onReady => {
    render(
      //h(InsightApp, { controller: reconciler.controller, bus: reconciler.debugBus, document: newWindow.document, onReady }),
      h(InsightApp2, { client, onReady }),
      body,
      { window: newWindow }
    );
  })

}


export const getTextForValue = (value: ValueReport): string => {
  switch (value.type) {
    case 'primitive':
      switch (typeof value.value) {
        case 'object':
          return `null`;
        case 'string':
        case 'boolean':
        case 'number':
          return value.value.toString();
      }
    case 'complex':
      return value.name;
    case 'undefined':
      return `undefined`;
    default:
      return  value;
  }
}