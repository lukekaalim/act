// @flow strict
/*:: import type { Object3D, WebGLRenderer } from "three"; */
/*:: import type { Props, PropDiff, CommitDiff } from '@lukekaalim/act-reconciler'; */
/*:: import type { Frame, Root } from "./renderer.js"; */

import { calculatePropsDiff } from "@lukekaalim/act-reconciler";
import { setHTMLProp } from "@lukekaalim/act-web";
import { Group, PerspectiveCamera } from "three";

export const setCanvasProps = ({ prev, next }/*: PropDiff*/, canvas/*: HTMLCanvasElement*/) => {
  const validPrev = typeof prev === 'object' && prev ? prev : {};
  const validNext = typeof next === 'object' && next ? next : {};
  const diffs = calculatePropsDiff(validPrev, validNext)
  for (const [key, prop] of diffs)
    setHTMLProp(canvas, prop);
};

export const setWebGLRendererProp = ({ key, prev, next }/*: PropDiff*/,renderer/*: WebGLRenderer*/) => {
  switch (key) {
    case 'size':
      if (typeof next !== 'object' || !next)
        return;
      const { width, height, updateStyle } = next;
      // $FlowFixMe
      renderer.setSize(width, height, updateStyle);
      return;
    case 'clearAlpha':
      // $FlowFixMe
      renderer.setClearAlpha(next);
    case 'clearColor':
      if (typeof next !== 'object' || !next)
        return;
      const { color, alpha } = next;
      // $FlowFixMe
      renderer.setClearColor(color, alpha);
  }
};

export const setWebGLRendererProps = ({ prev, next }/*: PropDiff*/, renderer/*: WebGLRenderer*/) => {
  const validPrev = typeof prev === 'object' && prev ? prev : {};
  const validNext = typeof next === 'object' && next ? next : {};
  const diffs = calculatePropsDiff(validPrev, validNext)

  for (const [key, prop] of diffs)
    setWebGLRendererProp(prop, renderer);
};

const defaultRootProps/*: Props*/ = {
  camera: null,
  onRender: _ => {},
};

export const setRootProps = (diff/*: CommitDiff*/, { frame, renderer, canvas }/*: Root*/, children/*: Object3D[]*/) => {
  const validPrev = { ...defaultRootProps, ...diff.prev.element.props };
  const validNext = { ...defaultRootProps, ...diff.next.element.props };
  const diffs = calculatePropsDiff(validPrev, validNext);

  if (diffs.has('camera') || diffs.has('onRender')) {
    const { onRender, camera } = (validNext/*: any*/);
    if (frame.id)
      cancelAnimationFrame(frame.id);
    if (!camera)
      renderer.clear(true, true, true);
    if (onRender && camera && children[0]) {
      const updateFunction = (timestamp) => {
        onRender(timestamp, renderer, children[0]);
        renderer.render(children[0], camera);
        frame.id = requestAnimationFrame(updateFunction);
      };
      frame.id = requestAnimationFrame(updateFunction);
    }
  }
  const canvasProps = diffs.get('canvas');
  const rendererProps = diffs.get('renderer');
  if (canvasProps)
    setCanvasProps(canvasProps, canvas);
  if (rendererProps)
    setWebGLRendererProps(rendererProps, renderer);
};

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
    default:
      (object/*: any*/)[key] = next; break;
  }
};

export const setRef = (
  object/*: ?Object3D*/,
  diff/*: CommitDiff*/
) => {;
  const ref/*: any*/ = diff.next.element.props['ref'];
  if (typeof ref === 'function') {
    if (diff.prev.pruned)
      (ref/*: Function*/)(object);
    else if (diff.next.pruned)
      (ref/*: Function*/)(null);
  } else if (ref && typeof ref === 'object') {
    if (diff.prev.pruned)
      ref['current'] = object;
    else if (diff.next.pruned)
      ref['current'] = null;
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

export const setObjectProps = (diff/*: CommitDiff*/, object/*: ?Object3D*/)/*: void*/ => {
  setRef(object, diff);
  if (diff.next.pruned || !object)
    return;
  if (object instanceof Group)
    return setGroupProps(diff, object);
  else {
    const diffs = calculatePropsDiff(diff.prev.element.props, diff.next.element.props);
    for (const [key, diff] of diffs)
      setObjectProp(diff, object);
  }
};