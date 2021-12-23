// @flow strict
/*:: import type { Object3D, WebGLRenderer } from "three"; */
/*:: import type { Props, PropDiff, CommitDiff } from '@lukekaalim/act-reconciler'; */

import { calculatePropsDiff } from "@lukekaalim/act-reconciler";
import { setHTMLProp } from "@lukekaalim/act-web";
import { DirectionalLight, Group, Light, OrthographicCamera } from "three";
import { setRef } from "@lukekaalim/act-renderer-core";

export const setObjectProp = ({ key, prev, next }/*: PropDiff*/, object/*: Object3D*/)/*: void*/ => {
  switch (key) {
    case 'position':
      return object.position.copy((next/*: any*/));
    case 'quaternion':
      return void object.quaternion.copy((next/*: any*/));
    case 'rotation':
      return object.rotation.copy((next/*: any*/));
    case 'scale':
      return object.scale.copy((next/*: any*/));
    case 'matrix':
      return void object.matrix.copy((next/*: any*/));
    default:
      (object/*: any*/)[key] = next; break;
  }
};

export const setGroupProps = (diff/*: CommitDiff*/, group/*: Group*/) => {
  const diffs = calculatePropsDiff(diff.prev.element.props, diff.next.element.props);
  for (const [key, diff] of diffs) {
    switch (key) {
      case 'group':
        if (diff.prev && diff.prev !== diff.next)
          group.remove((diff.prev/*: any*/));
        if (diff.next)
          group.add((diff.next/*: any*/));
        break;
      default:
        setObjectProp(diff, group); break;
    }
  }
};

export const setDirectionalLightProps = (diff/*: CommitDiff*/, light/*: DirectionalLight*/) => {
  const diffs = calculatePropsDiff(diff.prev.element.props, diff.next.element.props);
  for (const [key, diff] of diffs) {
    switch (key) {
      case 'shadow': {
        const diffs = calculatePropsDiff((diff.prev/*: any*/) || {}, (diff.next/*: any*/) || {});
        for (const [key, diff] of diffs)
          (light/*: any*/).shadow[key] = diff.next;
        break;
      }
      default:
        setObjectProp(diff, light); break;
    }
  }
}

export const setObjectProps = (diff/*: CommitDiff*/, object/*: ?Object3D*/)/*: void*/ => {
  setRef(object, diff);
  if (diff.next.pruned || !object)
    return;
  if (object instanceof Group)
    return setGroupProps(diff, object);
  if (object instanceof DirectionalLight)
    return setDirectionalLightProps(diff, object);
  if (object instanceof OrthographicCamera) {
    const diffs = calculatePropsDiff(diff.prev.element.props, diff.next.element.props);
    for (const [key, diff] of diffs)
      setObjectProp(diff, object);
    object.updateProjectionMatrix();
  }
  else {
    const diffs = calculatePropsDiff(diff.prev.element.props, diff.next.element.props);
    for (const [key, diff] of diffs)
      setObjectProp(diff, object);
  }
};