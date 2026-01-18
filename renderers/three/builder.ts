import { NodeBuilder } from "@lukekaalim/act-backstage";
import { Object3D } from "three";
import { getElementHandler } from "./elements";
import { Component, h, specialNodeTypes } from "@lukekaalim/act";

export const ThreeJSRoot: Component = ({ children }) => h(specialNodeTypes.render, { type: 'threejs' }, children);

export const createThreeJSBuilder = (rootObject: Object3D | null = null): NodeBuilder<Object3D, 'threejs'> => ({
  roots: new Set(['threejs']),

  create(element) {
    const handler = getElementHandler(element.type);
    if (handler)
      return handler.create(element.props);
    return null;
  },
  update(el, next, prev) {
    const handler = getElementHandler(next.type);
    if (handler)
      handler.setProps(el, prev && prev.props, next.props);
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