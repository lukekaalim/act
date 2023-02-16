// @flow strict
/*::
export type IndexChangeSet = {
  created: number[],
  persisted: number[],
  removed: number[],
  moved: [number, number][],
};
*/

/**
 * Determine how an array's elements has changed over time, specifically:
 *  - If elements have been added or removed
 *  - If elements have been moved around
 *  - If elements have stayed in the same spot
 * 
 * This function returns an "IndexChangeSet" representing the
 * indices of various elements. "created" indices are references to the
 * "next" array, while "removed" reference the prev. "persisted" indices,
 * by their nature, will be the same index in both array, and "moved" indices
 * are tuples that reference "where they were" and "where they went" for their
 * prev and next respectivly.
 * 
 * Uses a strict equality checker by default.
 */
export const calculateIndexChanges = /*:: <A, B>*/(
  prev/*: $ReadOnlyArray<A>*/,
  next/*: $ReadOnlyArray<B>*/,
  isEqual/*: (a: A, b: B) => boolean*/ = (a, b) => a === b
)/*: IndexChangeSet*/ => {
  const created = [];
  const persisted = [];
  const moved = [];
  const removed = []
  // We gotta loop through one array to start with, so lets start with
  // the "next" array, for no reason.
  for (let nextIndex = 0; nextIndex < next.length; nextIndex++) {
    const nextElement = next[nextIndex];
  
    const prevIndex = prev.findIndex(a => isEqual(a, nextElement));
    if (prevIndex === -1) {
      // There is no previous index, this element was just created
      created.push(nextIndex);
    } else {
      // there is a prev & next index, this element persisted
      if (prevIndex === nextIndex) {
        persisted.push(nextIndex)
      } else {
        moved.push([prevIndex, nextIndex])
      }
    }
  }
  for (let prevIndex = 0; prevIndex < prev.length; prevIndex++) {
    const prevElement = prev[prevIndex];
    const nextIndex = next.findIndex(b => isEqual(prevElement, b));
    if (nextIndex === -1)  {
      // there is no next index, this element has been removed
      removed.push(prevIndex);
    } else {
      // there is a prev & next index, but this case should already be handled.
    }
  }

  return {
    created,
    persisted,
    removed,
    moved,
  };
}