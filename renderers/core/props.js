// @flow strict
/*::
import type { Props, Ref } from "@lukekaalim/act";
import type { Commit3, CommitChange3 } from "@lukekaalim/act-reconciler";
*/
/*::
import type { CommitDiff } from '@lukekaalim/act-reconciler';
import * as commit3 from "../../reconciler/commit3";
*/

/*::
export type RefProp<T> = ?(
  | Ref<T | null>
  | (current: T | null) => mixed
)
*/

export const setRef = /*:: <T>*/(
  node/*: null | T*/,
  diff/*: CommitDiff*/
) => {
  const ref/*: RefProp<T>*/ = (diff.next.element.props/*: any*/)['ref'];
  if (typeof ref === 'function') {
    if (diff.prev.pruned)
      ref(node);
    else if (diff.next.pruned)
      ref(null);
  } else if (ref && typeof ref === 'object') {
    if (diff.prev.pruned)
      ref.current = node;
    else if (diff.next.pruned)
      ref.current = null;
  }
};

const invokeRefProp = /*:: <T>*/(refProp/*: RefProp<T>*/, value/*: T | null*/) => {
  if (typeof refProp === 'function')
    refProp(value);
    
  if (typeof refProp === 'object' && !!refProp)
    refProp.current = value;
};

export const setRef2 = /*:: <T>*/(
  node/*: T*/,
  commit/*: Commit3*/,
  change/*: CommitChange3*/,
) => {
  const refProp/*: ?RefProp<T>*/ = (commit.element.props/*: any*/)['ref'];
  if (!refProp)
    return;

  if (change.type === 'create') {
    invokeRefProp(refProp, node);
  }
  if (change.type === 'remove') {
    invokeRefProp(refProp, null);
  }
};

export const isPropsEqual = (propsA/*: Props*/, propsB/*: Props*/)/*: boolean*/ => {
  if (propsA === propsB)
    return true;
  const keysA = Object.keys(propsA);
  const keysB = Object.keys(propsB);

  if (keysA.length !== keysB.length)
    return false;

  for (let key of keysA)
    if (propsA[key] !== propsB[key])
      return false;

  return true;
};

/*::
export type PropDiff = {
  key: string,
  prev: mixed,
  next: mixed,
};
export type PropDiffRegistry = {
  map: Map<string, PropDiff>,
  prop: (name: string, fallback?: mixed) => PropDiff,
}
*/

export const calculatePropsDiff = (
  prevProps/*: Props*/,
  nextProps/*: Props*/,
)/*: PropDiffRegistry*/ => {
  const map = new Map();

  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  for (let i = 0; i < prevKeys.length; i++) {
    const key = prevKeys[i];

    const prev = prevProps[key];
    const next = (key in nextProps) ? nextProps[key] : null;
    if (prev !== next)
      map.set(key, { key, prev, next });
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];

    const next = nextProps[key];
    if (!(key in prevProps))
      map.set(key, { key, prev: null, next });
  }

  const prop = (key, fallback = null) => {
    return {
      key,
      prev: prevProps[key] || fallback,
      next: nextProps[key] || fallback,
    }
  };

  return {
    map,
    prop,
  }
};
