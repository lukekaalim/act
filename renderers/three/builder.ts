import { NodeBuilder } from "@lukekaalim/act-backstage";
import { Object3D } from "three";
import { registry } from "./elements";
import { Component, h, specialNodeTypes, WriteOnlyRef } from "@lukekaalim/act";

export const ThreeJSRoot: Component<{
  parent?: Object3D,
}> = ({ children, parent = null }) => h(specialNodeTypes.render, { type: 'threejs', parent }, children);

export const createThreeJSBuilder = (): NodeBuilder<Object3D, { type: 'threejs', parent: Object3D | null }> => ({
  roots: new Set(['threejs']),

  create(element) {
    if (typeof element.type === 'string')
      return registry.create(element);
    return null;
  },
  update(el, next, prev) {
    registry.update(el, next, prev);
  },
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