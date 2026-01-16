import { convertNodeToElements, createId, Element, Node } from "@lukekaalim/act";
import { calculateChangedElements, ChangeEqualityTest, ChangeReport2 } from "./algorithms.ts";
import { Commit, Commit2, CommitID, CommitRef, CommitRef2 } from "./commit.ts";

/**
 * A request to transform part of a tree specified by
 * the "ref"
 */
export type Update = {
  /**
   * The commit that should evaluate this
   * update (if this commit does not exist,
   * it should use this as it's ID and Path).
   * */
  ref: CommitRef;

  /** If null, this update should cause
   * this commit to be created */
  prev: null | Commit;
  /** If null, this update should cause
   * this commit to be removed
   */
  next: null | Element;

  // TODO: maybe expose prev/next index information?
  moved: boolean,
};

/**
 * A request to transform part of a tree specified by
 * the "ref". Contains the history needed to resolve this
 * request
 */
export class WorkTask {
  /**
   * The commit that should evaluate this
   * update (if this commit does not exist,
   * it should use this as it's ID and Path).
   * */
  ref: CommitRef2;

  /** If null, this update should cause
   * this commit to be created */
  prev: null | Commit2;
  /** If null, this update should cause
   * this commit to be removed
   */
  next: null | Element;

  // TODO: maybe expose prev/next index information?
  moved: boolean;

  private constructor(ref: CommitRef2, prev: null | Commit2, next: null | Element, moved: boolean = false) {
    this.ref = ref;
    this.prev = prev;
    this.next = next;
    this.moved = moved;
  }

  static fresh(ref: CommitRef2, next: Element) {
    return new WorkTask(ref, null, next)
  }
  static existing(prev: Commit2, next: Element) {
    return new WorkTask(prev.ref, prev, next)
  }
  static move(prev: Commit2, next: Element) {
    return new WorkTask(prev.ref, prev, next, true)
  }
  static remove(prev: Commit2) {
    return new WorkTask(prev.ref, prev, null)
  }
  static visit(prev: Commit2) {
    return new WorkTask(prev.ref, prev, prev.element)
  }
}

export const Update = {
  fresh: (ref: CommitRef, next: Element): Update => ({
    ref, next, prev: null, moved: false,
  }),
  existing: (prev: Commit, next: Element, moved: boolean = false): Update => ({
    ref: prev, next, prev, moved,
  }),
  remove: (prev: Commit): Update => ({
    ref: prev, next: null, prev, moved: false,
  }),
  distant: (root: Commit): Update => ({
    ref: root, next: root.element, prev: root, moved: false,
  }),
  skip: (prev: Commit): Update => ({
    ref: prev, next: prev.element, prev, moved: false,
  }),
  target: (prev: Commit): Update => ({
    ref: prev, next: prev.element, prev, moved: false,
  }),
  suspend: (prev: Commit): Update => ({
    ref: prev, next: prev.element, prev, moved: false,
  }),
}

/** 
 * Create an update for a single commit and node pair.
 */
export const calculateFastUpdate = (
  parentRef: CommitRef,
  prevCommit: null | Commit,
  element: Element,
): [CommitRef[], Update[]] => {
  const compatible = prevCommit && prevCommit.element.type === element.type;

  const updates: Update[] = [];
  const refs: CommitRef[] = [];

  if (!compatible) {
    const id = createId<"CommitID">();
    const path = [...parentRef.path, id];
    const ref = { id, path };
    updates.push(Update.fresh(ref, element));

    refs.push(ref);
    if (prevCommit)
      updates.push(Update.remove(prevCommit));
  } else if (prevCommit) {
    refs.push(prevCommit);
    updates.push(Update.existing(prevCommit, element));
  }

  return [refs, updates];
};


const simpleElementEqualityTest: ChangeEqualityTest<Commit, Element> = (prev, next, prev_index, next_index) =>
  prev.element.type === next.type && prev_index === next_index;

const keyedElementEqualityTest:  ChangeEqualityTest<Commit, Element> = (prev, next, prev_index, next_index) => {
  const compatible = prev.element.type === next.type;
  if (!compatible)
    return false;
  const prevKey = prev.element.props.key;
  const nextKey = next.props.key;
  if (prevKey || nextKey)
    return prevKey === nextKey;

  return prev_index === next_index;
}

export const keyedElementEqualityTest2:  ChangeEqualityTest<Commit2, Element> = (prev, next, prev_index, next_index) => {
  const compatible = prev.element.type === next.type;
  if (!compatible)
    return false;
  const prevKey = prev.element.props.key;
  const nextKey = next.props.key;
  if (prevKey || nextKey)
    return prevKey === nextKey;

  return prev_index === next_index;
}

/**
 * Returns a list of all updates that should
 * occur -- given a set of commits and a
 * new node that represents the next state of
 * those commits.
 *
 * Also returns as part of it's tuple the next
 * canonical list of refs, taking into account
 * new commits and removed commits.
 */
export const calculateUpdates = (
  parentRef: CommitRef,
  commits: Commit[],
  node: Node
): [CommitRef[], Update[]] => {
  const elements = convertNodeToElements(node);

  // Fast exit if there is only one node
  if (commits.length <= 1 && elements.length == 1)
    return calculateFastUpdate(parentRef, commits[0], elements[0])

  const change_report = calculateChangedElements(commits, elements, keyedElementEqualityTest);

  const newOrPersisted = elements.map((next, index) => {
    const prevIndex = change_report.nextToPrev[index];
    const prev = prevIndex !== -1 ? commits[prevIndex] : null;

    if (!prev)
      return Update.fresh(CommitRef.new(parentRef.path), next);

    const moved = index === prevIndex;

    return Update.existing(prev, next, moved);
  });
  const removed = change_report.removed.map((index) => {
    const prev = commits[index];
    return Update.remove(prev);
  });
  const updates = [...newOrPersisted, ...removed];

  const refs = newOrPersisted.map((p) => p.ref);
  return [refs, updates];
};

export const isDescendant = (ancestor: CommitRef, descendant: CommitRef) => {
  return descendant.path.includes(ancestor.id);
}

// TODO: I think this class is redundant
export class UpdateReport {
  updates: WorkTask[];
  children: CommitRef2[];

  private constructor(updates: WorkTask[], children: CommitRef2[]) {
    this.updates = updates;
    this.children = children;
  }

  static generate2(parent: CommitRef2, prevs: Commit2[], nexts: Element[]) {
    const changes = ChangeReport2.generate(prevs, nexts, keyedElementEqualityTest2);
  }

  static generate(parent: CommitRef2, prevs: Commit2[], node: Node) {
    const elements = convertNodeToElements(node);

    const changeReport = calculateChangedElements(prevs, elements, keyedElementEqualityTest2);

    /*
    // Not implemented yet
    if (commits.length <= 1 && elements.length == 1)
      return calculateFastUpdate(parentRef, commits[0], elements[0])
    */

    const newOrPersisted = elements.map((next, index) => {
      const prevIndex = changeReport.nextToPrev[index];
      const prev = prevIndex !== -1 ? prevs[prevIndex] : null;

      if (!prev)
        return WorkTask.fresh(CommitRef2.fresh(parent.path), next);

      if (index === prevIndex)
        return WorkTask.move(prev, next);

      return WorkTask.existing(prev, next);
    });
    const removed = changeReport.removed.map((index) => {
      const prev = prevs[index];
      return WorkTask.remove(prev);
    });
    
    return new UpdateReport(
      [...newOrPersisted, ...removed],
      newOrPersisted.map((p) => p.ref)
    );
  }
}
