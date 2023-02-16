// @flow strict
/*:: import type { PropDiff } from '@lukekaalim/act-renderer-core'; */ 
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
  Skeleton,
  LineSegments,
  Line,
  LineLoop,
  Bone,
  Sprite,
  LOD,
  Object3D,
} from "three";

export const threeObjectClasses/*: { [string]: Class<Object3D> }*/ = Object.fromEntries(Object.entries({
  // grouping
  Scene,
  Group,
  Object3D,

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
  LineSegments,
  Line,
  LineLoop,

  // skinning
  Skeleton,
  Bone,

  Sprite,

  // mesh
  Mesh,
  InstancedMesh,
  LOD,
}).map(([key, value]) => [key.toLowerCase(), (value/*: any*/)]));

class UnsupportedObjectTypeError extends Error {}

export const createObject = (type/*: string*/)/*: Object3D*/ => {
  const objectClass = threeObjectClasses[type.toLowerCase()];

  if (!objectClass) {
    throw new UnsupportedObjectTypeError()
  }

  return new objectClass(); 
};
