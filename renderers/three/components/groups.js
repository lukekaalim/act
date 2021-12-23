// @flow strict
/*:: import type { Component, Ref } from '@lukekaalim/act'; */
/*:: import type { Euler, Group } from "three"; */
/*:: import type { GroupProps, RefProp } from '../components'; */

import { h, useEffect, useRef, useState } from '@lukekaalim/act';
import { Matrix4, Vector3 } from "three";
import { group } from '../components.js';

export const LookAtGroup/*: Component<{ ...$Diff<GroupProps, { rotation?: Euler, ref?: RefProp<Group> }>, target: Vector3 }>*/ = ({
  target,
  children,
  position = new Vector3(0, 0, 0),
  ...groupProps
}) => {
  const [groupNode, setGroup] = useState(null);
  useEffect(() => {
    if (!groupNode)
      return;
      
    groupNode.setRotationFromMatrix(new Matrix4().lookAt(position, target, new Vector3(0, 1, 0)));
    groupNode.updateMatrix();
  }, [groupNode, target.x, target.y, target.z, position.x, position.y, position.z]);

  return h(group, { ...groupProps, position, ref: setGroup }, children);
}