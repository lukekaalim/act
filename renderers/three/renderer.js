// @flow strict
/*:: import type { Renderer, RenderResult, PropDiff } from '@lukekaalim/act-renderer-core'; */
/*:: import type { Component, ElementType } from '@lukekaalim/act'; */
/*:: import type { CommitDiff, CommitID } from '@lukekaalim/act-reconciler'; */
/*::
import type { Object3D } from 'three';
import type { Renderer2 } from "../core/renderer2";
*/
import { calculatePropsDiff, createRenderer2, createNullRenderer2, setRef2 } from '@lukekaalim/act-renderer-core';
import { createObject } from "./objects";
import { setObjectProps2 } from "./props";

export const createObjectRenderer = (
  getNextRenderer/*: null | ((type: ElementType) => null | Renderer2<Object3D>)*/ = null
)/*: Renderer2<Object3D>*/ => {

  const getRenderer = (set, commitId) => {
    const commit = set.nexts.get(commitId);
    return getNextRenderer && getNextRenderer(commit.element.type) || objectRenderer;
  }

  const getNodes = (set, commitId) => {
    const renderer = getRenderer(set, commitId)
    return renderer.getNodes(set, commitId);
  }

  const render = (set, commitId) => {
    const renderer = getRenderer(set, commitId)
    return renderer.render(set, commitId);
  }

  const objectRenderer = createRenderer2({
    remove(object) {
      object.removeFromParent();
    },
    update(object, set, diff) {
      setRef2(object, diff.commit, diff.change);
      const prev = set.prevs.map.get(diff.commit.id);
      const propDiff = calculatePropsDiff(prev ? prev.element.props : {}, diff.commit.element.props)
      setObjectProps2(propDiff, object);
    },
    create(type) {
      return createObject(type);
    },
    attach(object, set, diff, children) {
      const missingChildren = children
        .filter(n => n.parent !== object);
      
      if (missingChildren.length > 0)
        object.add(...missingChildren);
    }
  }, { getNodes, render });

  return objectRenderer;
};

export const createSceneRenderer = /*:: <T>*/()/*: Renderer2<T>*/ => {
  const object = createObjectRenderer();
  return createNullRenderer2(object);
}
