// @flow strict
/*:: import type { Ref } from '@lukekaalim/act'; */
/*:: import type { CommitDiff } from '@lukekaalim/act-reconciler'; */

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