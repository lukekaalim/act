// @flow strict
/*:: import type { Renderer } from '@lukekaalim/act-renderer-core'; */
/*:: import type { CommitDiff, PropDiff, CommitID } from '@lukekaalim/act-reconciler'; */
/*:: import type { Object3D } from 'three'; */
import { WebGLRenderer } from 'three';
import { createManagedRenderer } from '@lukekaalim/act-renderer-core';
import { setRootProps } from "./props.js";
import { createObject } from "./objects";
import { setObjectProps } from "./props";

/*::
export type Root = {
  canvas: HTMLCanvasElement,
  renderer: WebGLRenderer,
  frame: Frame
};
export type Frame = {
  scene: ?Object3D,
  id: ?AnimationFrameID
}
export type ObjectDef = {
  update: Object3D => mixed,
  create: () => Object3D
};
export type ObjectDefMap = { [type: string]: ObjectDef };
*/

// A "root" is a combination of a canvas and a renderer
export const createRootRenderer = (objectRenderer/*: Renderer<Object3D>*/)/*: Renderer<Node>*/ => {
  const roots/*: Map<CommitID, Root>*/ = new Map();
  const createRoot = (diff) => {
    const canvas = document.createElement('canvas');
    const renderer = new WebGLRenderer({ canvas });

    const root = { canvas, renderer, frame: { id: null, scene: null } };
    roots.set(diff.next.id, root);
    return root;
  };
  const removeRoot = (diff, root) => {
    if (root.frame.id)
      cancelAnimationFrame(root.frame.id)

    root.renderer.dispose();
    root.canvas.parentNode?.removeChild(root.canvas);
    roots.delete(diff.next.id);
  };
  const render = (diff) => {
    const root = roots.get(diff.next.id) || createRoot(diff);

    if (diff.next.pruned)
      return (removeRoot(diff, root), []);

    const children = diff.diffs.map(objectRenderer.render).flat(1);
    setRootProps(diff, root, children);

    return [root.canvas];
  };
  return {
    render
  };
};
export const createObjectRenderer = ()/*: Renderer<Object3D>*/ => {
  return createManagedRenderer({
    remove(object) {
      object.removeFromParent();
    },
    update(object, diff, children) {
      if (typeof diff.next.element.type === 'function')
        return;
      setObjectProps(diff, object);
      if (children.length > 0)
        object.add(...children);
    },
    add(diff) {
      if (typeof diff.next.element.type === 'function')
        return null;
      return createObject(diff.next.element.type);
    }
  });
};

export const createThreeRenderer = ()/*: Renderer<Node>*/ => {
  const object = createObjectRenderer();
  const root = createRootRenderer(object);
  return root;
};