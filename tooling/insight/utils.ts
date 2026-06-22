
import { h, Node } from "@lukekaalim/act";
import { NodeBuilder, RenderSpace2 } from "@lukekaalim/act-backstage";
import { DebugReconciler, ElementReport, ElementTypeReport, ValueReport } from "@lukekaalim/act-debug";
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
          return `"${value.value}"`
        case 'boolean':
        case 'number':
          return value.value.toString();
      }
    case 'complex':
      return value.name;
    case 'undefined':
      return `undefined`;
    case 'function':
      return `function`;
    case 'array':
      return `array[${value.length}]`
    case 'object':
      return `{ ${value.keys.join(', ')} }`
    case 'ref':
      return `Ref<${getTextForValue(value.current)}>`;
    default:
      return  value;
  }
}

export const getTextForElementType = (element: ElementReport): string => {
  switch (element.type.type) {
    case 'component':
      return `<${element.type.name || 'Anonymous'}>`
    case 'string':
      return `<${element.type.name}>`
    case 'symbol':
      return `<symbol(${element.type.name || 'Anonymous'})>`
    case 'array':
      return `<array>`;
    case 'render':
      return `<render(${element.type.render})>`;
    
    case 'primitive':
      switch (typeof element.type.value) {
        case 'object':
          return 'null';
        case 'string':
          return `"${element.type.value}"`;
        default:
          return `${element.type.value.toString()}`;
      }
    case 'special':
      return `<special(${element.type.special})>`
  }
}