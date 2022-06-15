// @flow strict
/*:: import type { Renderer, RenderResult} from '@lukekaalim/act-renderer-core'; */
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { CommitDiff, PropDiff, CommitID } from '@lukekaalim/act-reconciler'; */
/*:: import type { Object3D } from 'three'; */
import { createManagedRenderer, createNullRenderer } from '@lukekaalim/act-renderer-core';
import { createObject } from "./objects";
import { setObjectProps } from "./props";

export const createObjectRenderer = (
  next/*: ?((diff: CommitDiff, parent: ?Object3D) => RenderResult<Object3D>[])*/ = null,
  create/*: string => null | Object3D*/ = createObject,
  setProps/*: (CommitDiff, Object3D) => void*/ = setObjectProps,
)/*: Renderer<Object3D>*/ => {
  const objectRenderer = createManagedRenderer({
    remove(object) {
      object.removeFromParent();
    },
    update(object, diff, children) {
      if (typeof diff.next.element.type === 'function')
        return;
      setProps(diff, object);
      if (children.length > 0)
        object.add(...children.map(c => c.node));
    },
    add(diff) {
      if (typeof diff.next.element.type === 'function')
        return null;
      if (diff.next.element.type === 'act:context')
        return null;
      return create(diff.next.element.type);
    },
    next(diff, parent) {
      if (next)
        return next(diff, parent)
      return objectRenderer.render(diff);
    }
  });
  return objectRenderer;
};

export const createSceneRenderer = /*:: <T>*/()/*: Renderer<T>*/ => {
  const object = createObjectRenderer();
  return createNullRenderer(object);
}
