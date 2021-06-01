// @flow strict
/*:: import type { ElementType } from '@lukekaalim/act'; */
/*:: import type { CommitDiff } from '@lukekaalim/act-reconciler'; */
/*:: import type { RenderService } from './main.js'; */

import { createDOMRenderer } from "./dom";

export const createWebRenderService = (
  subRenderers/*: Map<ElementType, RenderService>*/ = new Map(),
)/*: RenderService*/ => {
  const svgRenderer = createDOMRenderer('http://www.w3.org/2000/svg')

  const htmlRenderer = createDOMRenderer('http://www.w3.org/1999/xhtml', new Map([
    ...subRenderers,
    ['svg', svgRenderer],
  ]));

  return htmlRenderer;
}