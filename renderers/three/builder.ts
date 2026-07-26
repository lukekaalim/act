import { NodeBuilder } from "@lukekaalim/act-backstage";
import { Object3D } from "three";
import { registry } from "./elements";
import { Component, h, specialNodeTypes, WriteOnlyRef } from "@lukekaalim/act";

export const ThreeJSRoot: Component = ({ children }) => h(specialNodeTypes.render, { type: 'threejs' }, children);

export const createThreeJSBuilder = (rootObject: Object3D | null = null): NodeBuilder<Object3D, 'threejs'> => ({
  roots: new Set(['threejs']),

  create(element) {
    if (typeof element.type === 'string')
      return registry.create(element);
    return null;
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
  destroy(obj, el) {
    if (obj.parent)
      obj.removeFromParent()
    if (el.props.ref) {
      (el.props.ref as WriteOnlyRef<null>).set(null);
    }
  },
})