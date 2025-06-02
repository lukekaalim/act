import { h } from "@lukekaalim/act";
import { createWebSpace, HTML } from "./space";
import { createRenderFunction, RenderFunction } from "@lukekaalim/act-backstage";
import { createDOMScheduler } from "./scheduler";


export const render: RenderFunction<HTMLElement> = (node, root) => 
  createRenderFunction(createDOMScheduler(), createWebSpace)(h(HTML, {}, node), root);
