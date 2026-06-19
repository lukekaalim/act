import { CommitReport, DebugCache } from "@lukekaalim/act-debug";
import { CommitID } from "@lukekaalim/act-recon";

export type CommitTestFunction = (commit: CommitReport) => boolean;

export type CommitListEntry = {
  parent: number,
  distance: number,
  id: CommitID,
  children: number[],
}

/**
 * A CommitList is a (possibly transformed) representation
 * of a tree of commits into a linear tree, noting:
 *  - "distance" (aka how many parents from root)
 *  - "parent" (the index of the parent in this list)
 *  - "children" (the indices of the children in this list)
 *  - "id" The actual CommitID that this entry represents.
 *  
 * Due to transformation rules, commits "parents" and "children"
 * may not map to their real (as CommitReport might describe)
 * relationships.
 * 
 * @param cache
 * @param options 
 * @returns 
 */
export const createCommitList = (
  cache: DebugCache,
  transform: { skip?: CommitTestFunction, hide?: CommitTestFunction }
): CommitListEntry[] => {
  type StackEntry = [id: CommitID, parent: number];
  // We push commits into this stack
  // to pop them later in the `while` loop.
  const stack: StackEntry[] = [...cache.roots].map(id => [id, -1]);

  const all: CommitListEntry[] = [];
  
  while (stack.length > 0) {
    const stack_entry = stack.pop() as StackEntry;

    const commit = cache.getCommit(stack_entry[0])
    if (!commit)
      continue;

    const shouldSkip = transform.skip && transform.skip(commit);
    const shouldHide = transform.hide && transform.hide(commit);

    if (shouldHide)
      continue;

    let parent = all[stack_entry[1]];

    if (shouldSkip) {
      // reassign parent
      for (const childId of commit.children.toReversed()) {
        stack.push([childId, stack_entry[1]]);
      }
      continue;
    }

    const index = all.length;
    all[index] = {
      distance: parent ? parent.distance + 1 : 1,
      id: commit.id,
      parent: stack_entry[1],
      children: [],
    };

    if (parent) {
      parent.children.push(index);
    }

    for (const childId of commit.children.toReversed()) {
      stack.push([childId, index]);
    }

  }

  return all;
}