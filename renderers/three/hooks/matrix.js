// @flow strict
/*:: import type { Component, Ref } from '@lukekaalim/act'; */
/*:: import type { Euler, Group, Object3D } from "three"; */
/*:: import type { GroupProps, RefProp } from '../components'; */

import { h, useEffect, useRef, useState } from '@lukekaalim/act';
import { Matrix4, Vector3 } from "three";
import { group } from '../components.js';

export const defaultUp/*: Vector3*/ = new Vector3(0, 1, 0);

export const useLookAt = /*:: <T: Object3D>*/(
  objectRef/*: Ref<?T>*/,
  target/*: Vector3*/,
  deps/*: mixed[]*/ = [],
  up/*: Vector3*/ = defaultUp,
) => {

  useEffect(() => {
    const { current: object } = objectRef;
    if (!object)
      return;
      
    object.setRotationFromMatrix(new Matrix4().lookAt(object.position, target, up));
    object.updateMatrix();

  }, [target.x, target.y, target.z, ...deps]);
}