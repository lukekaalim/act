import { createId, Element, OpaqueID, specialNodeTypes, SuspendProps } from "@lukekaalim/act";

/**
 * A single consistent id representing a commit in the act tree.
 * Does not change.
 */
export type CommitID = OpaqueID<"CommitID">;

export class Commit {
  parent: null | Commit = null;
  children: null | Commit[] = null;
  version: number = 0;

  element: Element;

  constructor(element: Element) {
    this.element = element;
  }

  update(element: null | Element = null, children: null | Commit[] = null) {
    this.version++;
    
    if (element)
      this.element = element;
    if (children)
      this.children = children;
  }

}
