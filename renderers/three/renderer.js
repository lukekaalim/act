// @flow strict
/*:: import type { Renderer } from '@lukekaalim/act-renderer-core'; */
/*:: import type { CommitDiff, PropDiff, CommitID } from '@lukekaalim/act-reconciler'; */
/*:: import type { Object3D } from 'three'; */
import { createManagedRenderer, createNullRenderer } from '@lukekaalim/act-renderer-core';
import { createObject } from "./objects";
import { setObjectProps } from "./props";

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
        object.add(...children.map(c => c.node));
    },
    add(diff) {
      if (typeof diff.next.element.type === 'function')
        return null;
      if (diff.next.element.type === 'act:context')
        return null;
      return createObject(diff.next.element.type);
    }
  });
};

export const createSceneRenderer = /*:: <T>*/()/*: Renderer<T>*/ => {
  const object = createObjectRenderer();
  return createNullRenderer(object);
}
