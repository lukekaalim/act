// @flow strict
/*:: import type { Element, ElementID } from '@lukekaalim/act'; */
/*:: import type { Commit } from './commit2.js'; */

/*::
export type PersistDiff = {| prev: Element, next: Element |};
export type RemoveDiff = {| prev: Element, next: null |};
export type CreateDiff = {| prev: null, next: Element |};

export type ElementDiff =
  | PersistDiff
  | RemoveDiff
  | CreateDiff
*/

export const calculatePersisted = (
  prevEls/*: $ReadOnlyArray<Commit>*/,
  nextEls/*: $ReadOnlyArray<Element>*/
)/*:  Map<ElementID, {| commit: Commit, prev: Element, next: Element |}>*/ => {
  const nextByKey = new Map(nextEls.map(e => [e.props.key, e]));
  const nextByIndex = new Map(nextEls.map((e, i) => [i, e]));

  const diffs = new Map();

  for (let i = 0; i < prevEls.length; i++) {
    const commit = prevEls[i];
    const prev = commit.element;
    if (prev.props.key) {
      const next = nextByKey.get(prev.props.key);
      nextByKey.delete(prev.props.key);
      if (next && next.type === prev.type) {
        diffs.set(prev.id, ({ next, prev, commit }));
        diffs.set(next.id, ({ next, prev, commit }));
      }
    } else {
      const next = nextByIndex.get(i);
      nextByIndex.delete(prev.props.key);
      if (next && !next.props.key && next.type === prev.type) {
        diffs.set(prev.id, ({ next, prev, commit }));
        diffs.set(next.id, ({ next, prev, commit }));
      }
    }
  }

  return diffs;
}
