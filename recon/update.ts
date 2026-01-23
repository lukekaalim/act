import { convertNodeToElements, createId, Element, Node, specialNodeTypes } from "@lukekaalim/act";
import { ChangeEqualityTest, ChangeReport2 } from "./algorithms.ts";
import { Commit2, CommitID, CommitRef2 } from "./commit.ts";
import { createObjectPool, ObjectPool } from "./pool.ts";

/**
 * A request to transform part of a tree specified by
 * the "ref". Contains the history needed to resolve this
 * request
 */
export class WorkTask {
  static pool = createObjectPool<WorkTask, Parameters<typeof this.new>>(
    (ref, prev, next, moved) => new WorkTask(ref, prev,  next, moved),
    (task, ref, prev, next, moved = false) => {
      task.ref = ref;
      task.prev = prev;
      task.next = next;
      task.moved = moved;
    }
  )

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

  free() {
    WorkTask.pool.release(this);
  }

  private static new(ref: CommitRef2, prev: null | Commit2, next: null | Element, moved: boolean = false) {
    return this.pool.acquire(ref, prev, next, moved)
  }

  static fresh(ref: CommitRef2, next: Element) {
    return WorkTask.new(ref, null, next)
  }
  static existing(prev: Commit2, next: Element) {
    return WorkTask.new(prev.ref, prev, next)
  }
  static move(prev: Commit2, next: Element) {
    return WorkTask.new(prev.ref, prev, next, true)
  }
  static remove(prev: Commit2) {
    return WorkTask.new(prev.ref, prev, null)
  }
  static visit(prev: Commit2) {
    return WorkTask.new(prev.ref, prev, prev.element)
  }
}

export const keyedElementEqualityTest2:  ChangeEqualityTest<Commit2, Element> = (prev, next, prev_index, next_index) => {
  const compatible = prev.element.type === next.type || prev.element.type === specialNodeTypes.placeholder;
  if (!compatible)
    return false;
  const prevKey = prev.element.props.key;
  const nextKey = next.props.key;
  if (prevKey || nextKey)
    return prevKey === nextKey;

  return prev_index === next_index;
}
