// @flow strict
/*:: import type { Object3D } from "three"; */
/*:: import type { PropDiff } from '@lukekaalim/act-reconciler'; */ 
import {
  Group,
  Mesh,
  PerspectiveCamera,
  PointLight,
  Points,
  Scene,
  InstancedMesh,
  OrthographicCamera,
  DirectionalLight,
  HemisphereLight,
  AmbientLight,
} from "three";

const threeObjectClasses/*: { [string]: Class<Object3D> }*/ = Object.fromEntries(Object.entries({
  // grouping
  Scene,
  Group,

  // lights
  DirectionalLight,
  HemisphereLight,
  PointLight,
  AmbientLight,

  // camera
  PerspectiveCamera,
  OrthographicCamera,

  // lines
  Points,

  // mesh
  Mesh,
  InstancedMesh,
}).map(([key, value]) => [key.toLowerCase(), (value/*: any*/)]));

export const createObject = (type/*: string*/)/*: null | Object3D*/ => {
  const objectClass = threeObjectClasses[type.toLowerCase()];

  if (!objectClass) {
    console.warn(`Unknown object type "${type}"`)
    return null;
  }

  return new objectClass(); 
};
