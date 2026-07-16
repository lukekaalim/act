import { NodeBuilder } from "@lukekaalim/act-backstage";
import { Object3D } from "three";
import { registry } from "./elements";
import { Component, h, specialNodeTypes } from "@lukekaalim/act";

export const ThreeJSRoot: Component = ({ children }) => h(specialNodeTypes.render, { type: 'threejs' }, children);

export const createThreeJSBuilder = (rootObject: Object3D | null = null): NodeBuilder<Object3D, 'threejs'> => ({
  roots: new Set(['threejs']),

  create(element) {
    return registry.create(element);
  },
  update(el, next, prev) {
    registry.update(el, next, prev);
  },
  linkRoot: rootObject && ((child) => {
    rootObject.add(child);
  }) || undefined,
  link(el, parent) {
    parent && parent.add(el)
  },
  destroy(el) {
    if (el.parent)
      el.removeFromParent()
  },
})