// @flow strict
/*:: import type { Component, Ref } from '@lukekaalim/act'; */
/*:: import type { Euler, Group, Object3D } from "three"; */
/*:: import type { GroupProps, RefProp } from '../components'; */

import { h, useEffect, useRef, useState } from '@lukekaalim/act';
import { Matrix4, Vector3 } from "three";
import { group } from '../components.js';

/*::
export type LookAtGroupProps = {
  ...$Diff<GroupProps, { rotation?: Euler, ref?: RefProp<Group> }>,
  target: Vector3,
  deps?: mixed[],
};
*/

export const LookAtGroup/*: Component<LookAtGroupProps>*/ = ({
  target,
  children,
  position = new Vector3(0, 0, 0),
  deps = [],
  ...groupProps
}) => {
  const groupRef = useRef(null);

  useEffect(() => {
    const { current: groupNode } = groupRef;
    if (!groupNode)
      return;
      
    groupNode.setRotationFromMatrix(new Matrix4().lookAt(position, target, new Vector3(0, 1, 0)));
    groupNode.updateMatrix();
  }, [target.x, target.y, target.z, position.x, position.y, position.z, ...deps]);

  return h(group, { ...groupProps, position, ref: groupRef }, children);
}