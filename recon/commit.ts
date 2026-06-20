import { createId, Element, OpaqueID, specialNodeTypes, SuspendProps } from "@lukekaalim/act";

/**
 * A single consistent id representing a commit in the act tree.
 * Does not change.
 */
export type CommitID = OpaqueID<"CommitID">;
/**
 * A ID for a particular _state_ a **Commit** is in - every time it or its
 * children change, a commit with the same Id but a new CommitVersion
 * is added to the tree, replacing the previous.
 */
export type CommitVersion = OpaqueID<"CommitVersion">;

export class CommitRef2 {
  id: CommitID;
  parent: null | CommitRef2;
  length: number;

  private constructor(id: CommitID, parent: CommitRef2 | null) {
    this.id = id;
    this.parent = parent;
    if (parent)
      this.length = parent.length + 1;
    else
      this.length = 1;
  }

  /*
  [Symbol.iterator]() {
    return this.ancestors();
  }
    */
  
  /**
   * Iterate though all "parent" commit refs,
   * including itself as the first entry.
   * 
   * @returns Iterator<CommitRef2>
   */
  *ancestors() {
    let ref: CommitRef2 | null = this;

    while (ref) {
      yield ref;
      ref = ref.parent;
    }
  }

  /**
   * 
   * @param climber A function that receives every ancestor commit ref,
   * including this one. Return "true" to stop climbing early.
   */
  climb(climber: (ref: CommitRef2) => boolean | void) {
    let ref: CommitRef2 | null = this;
    while (ref) {
      if (climber(ref))
        return;

      ref = ref.parent;
    }
  }

  find<T>(test: (id: CommitRef2) => T | null | undefined | false): T | null {
    let result: T | null = null;
    this.climb(ref => {
      const currentResult = test(ref);
      if (currentResult) {
        result = currentResult
        return true;
      }
    })
    return result;
  }

  static fresh(parent: CommitRef2 | null) {
    return new CommitRef2(createId('CommitID'), parent);
  }
  static rehydrate(id: CommitID, length: number) {
    const ref = new CommitRef2(id, null);
    ref.length = length;
    return ref;
  }
}

export class Commit2 {
  ref: CommitRef2;

  element: Element;
  children: CommitRef2[];

  version: CommitVersion = createId('CommitVersion');

  constructor(ref: CommitRef2, element: Element, children: CommitRef2[]) {
    this.ref = ref;
    this.element = element;
    this.children = children;
  }

  update(element: null | Element = null, children: null | CommitRef2[] = null) {
    this.version = createId('CommitVersion');
    
    if (element)
      this.element = element;
    if (children)
      this.children = children;
  }

  isSuspended() {
    return (
      this.element.type === specialNodeTypes.suspend
      && (this.element.props as SuspendProps).suspended
    );
  }
}
