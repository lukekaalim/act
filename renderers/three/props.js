// @flow strict
/*:: import type { WebGLRenderer, LightShadow } from "three"; */
/*::
import type { Props } from '@lukekaalim/act';
import type { PropDiff, PropDiffRegistry } from '@lukekaalim/act-renderer-core';
import type { CommitDiff, Diff3, DiffSet } from '@lukekaalim/act-reconciler';
*/

import { calculatePropsDiff, setRef2 } from '@lukekaalim/act-renderer-core'
import { setHTMLProp } from "@lukekaalim/act-web";
import {
  BufferGeometry,
  Camera,
  Color,
  DirectionalLight,
  Euler,
  Group,
  Light,
  Material,
  Matrix3,
  Matrix4,
  Object3D,
  OrthographicCamera,
  Quaternion,
  Scene,
  Vector2,
  Vector3,
} from "three";
import { setRef } from "@lukekaalim/act-renderer-core";
import { scenePropSetters } from './components/scene';

export const setTransformProp = (target/*: mixed*/, diff/*: PropDiff*/)/*: boolean*/ => {
  if (target instanceof Vector2 && diff.next instanceof Vector2) {
    target.copy(diff.next);
    return true;
  }
  if (target instanceof Vector3 && diff.next instanceof Vector3) {
    target.copy(diff.next);
    return true;
  }
  if (target instanceof Matrix3 && diff.next instanceof Matrix3) {
    target.copy(diff.next);
    return true;
  }
  if (target instanceof Matrix4 && diff.next instanceof Matrix4) {
    target.copy(diff.next);
    return true;
  }
  if (target instanceof Quaternion && diff.next instanceof Quaternion) {
    target.copy(diff.next);
    return true;
  }
  if (target instanceof Euler && diff.next instanceof Euler) {
    target.copy(diff.next);
    return true;
  }
  return false;
}
export const setValueProp = (object/*: { [string]: mixed }*/, name/*: string*/, diff/*: PropDiff*/)/*: boolean*/ => {
  if (typeof object[name] !== typeof diff.next)
    return false;

  switch (typeof object[name]) {
    case 'string':
    case 'number':
    case 'boolean':
      object[name] = diff.next;
      return true;
    default:
      return false;
  }
}
export const setMeshProp = (object/*: { [string]: mixed }*/, name/*: string*/, diff/*: PropDiff*/)/*: boolean*/ => {
  if (object[name] instanceof BufferGeometry && diff.next instanceof BufferGeometry) {
    object[name] = diff.next;
    return true;
  }
  if (object[name] instanceof Material && diff.next instanceof Material) {
    object[name] = diff.next;
    return true;
  }
  return false;
}
export const setInstanceProp = (object/*: { [string]: mixed }*/, name/*: string*/, diff/*: PropDiff*/)/*: boolean*/ => {
  if (object[name] instanceof Color) {
    if (diff.next instanceof Color || typeof diff.next === 'string' || typeof diff.next === 'number') {
      object[name].set(diff.next)
      return true;
    }
  }
  return false;
}

export const setLightShadowProps = (
  diffs/*: PropDiffRegistry*/,
  lightShadow/*: LightShadow*/,
) => {
  for (const [key, propDiff] of diffs.map) {
    const target = (lightShadow/*: any*/)[key];
    if (setTransformProp(target, propDiff))
      continue;
    if (setValueProp((lightShadow/*: any*/), key, propDiff))
      continue;
    if (target instanceof Object3D) {
      if (propDiff.next instanceof Object3D) {
        (lightShadow/*: any*/)[key] = propDiff.next;
        continue;
      }
      const propRegistry = calculatePropsDiff((propDiff.prev/*: any*/) || {}, (propDiff.next/*: any*/) || {});
      setObjectProps2(propRegistry, target);
      continue;
    }

    console.warn(`Unhandled prop ${key}`, propDiff.next, target);
  }
}

const skipProps = new Set(['ref', 'key', 'children'])

export const setObjectProps2 = (
  diff/*: PropDiffRegistry*/,
  object/*: Object3D*/,
) => {
  for (const [key, propDiff] of diff.map) {
    if (skipProps.has(key))
      continue;

    const target = (object/*: any*/)[key];
    if (key === 'shadow' && object instanceof Light) {
      const propRegistry = calculatePropsDiff((propDiff.prev/*: any*/) || {}, (propDiff.next/*: any*/) || {});
      setLightShadowProps(propRegistry, target)
      continue;
    }
    if (setInstanceProp((object/*: any*/), key, propDiff))
      continue;

    if (setMeshProp((object/*: any*/), key, propDiff)) {
      continue;
    }
    if (setTransformProp(target, propDiff))
      continue;
    if (setValueProp((object/*: any*/), key, propDiff))
      continue;
    if (object instanceof Scene) {
      const setter = scenePropSetters[propDiff.key];
      if (setter) {
        setter(object, propDiff.next, propDiff.prev);
        continue;
      }
    }
      


    console.warn(`Unhandled prop ${key}`, propDiff.next, object);
  }

  if (object instanceof OrthographicCamera)
    object.updateProjectionMatrix();

}