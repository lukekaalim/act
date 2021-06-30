// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
/*:: import type { CommitDiff } from '@lukekaalim/act-reconciler'; */
import { createTree } from '@lukekaalim/act-reconciler';
import { attachNodes } from './node.js';
import { createWebRenderService } from './web.js';

/*::
export type RenderService = {
  render: CommitDiff => Node[]
};
*/

export const render = (element/*: Element*/, node/*: HTMLElement*/) => {
  const web = createWebRenderService();
  const onDiff = diff => attachNodes(node, web.render(diff));
  const options = {
    onDiff,
    scheduleWork: (c) => requestAnimationFrame(() => void c()),
  };
  const tree = createTree(element, options);
};

export * from './web';
export * from './dom';