// @flow strict
/*:: import type { Object3D } from "three"; */
/*:: import type { PropDiff } from '@lukekaalim/act-reconciler'; */ 
/*:: import type { ObjectDef } from './renderer.js'; */ 
import {
  Group,
  Mesh,
  PerspectiveCamera,
  PointLight,
  Points,
  Scene,
  InstancedMesh,
} from "three";

export const createObject = (type/*: string*/)/*: null | Object3D*/ => {
  switch (type) {
    case 'scene':
      return new Scene();
    case 'group':
      return new Group();
    case 'perspectiveCamera':
      return new PerspectiveCamera();
    case 'points':
      return new Points();
    case 'mesh':
      return new Mesh();
    case 'instancedMesh':
      return new InstancedMesh();
    default:
      console.warn(`Unknown object type "${type}"`)
      return null;
  }
};
