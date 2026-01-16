import { EffectConstructor, Element } from "@lukekaalim/act";
import { Commit, Commit2, CommitID, CommitRef, CommitRef2 } from "./commit.ts";
import { CommitTree } from "./tree.ts";
import { EffectID, EffectTask } from "./state.ts";

export type CreateDelta = { ref: CommitRef, next: Commit };
export type UpdateDelta = { ref: CommitRef, next: Commit, prev: Commit, moved: boolean };
export type RemoveDelta = { ref: CommitRef, prev: Commit };
export type SkipDelta =   { next: Commit };

export type DeltaSet = {
  created: CreateDelta[],
  updated: UpdateDelta[],
  skipped: SkipDelta[],
  removed: RemoveDelta[],
};

/**
 * Apply a deltaset to a tree, modifying it's commit list
 * to match the changes produced by the thread.
 * 
 * @param thread 
 * @param tree 
 */
const applyDeltaSet = (deltas: DeltaSet, tree: CommitTree) => {
  for (const delta of deltas.created)
    tree.commits.set(delta.ref.id, delta.next);
  
  for (const delta of deltas.skipped)
    tree.commits.set(delta.next.id, delta.next);
  
  for (const delta of deltas.updated)
    tree.commits.set(delta.ref.id, delta.next);
  
  for (const delta of deltas.removed)
    tree.commits.delete(delta.ref.id);
};

export const DeltaSet = {
  create: (): DeltaSet => ({ created: [], updated: [], skipped: [], removed: [] }),
  clone: (deltas: DeltaSet): DeltaSet => ({
    created: [...deltas.created],
    updated: [...deltas.updated],
    skipped: [...deltas.skipped],
    removed: [...deltas.removed],
  }),
  apply: applyDeltaSet,
}

export class CreateDelta2 {
  next: Commit2;

  constructor(next: Commit2) {
    this.next = next;
  }
}
export class UpdateDelta2 {
  prev: Element;
  next: Commit2;

  constructor(prev: Element, next: Commit2) {
    this.next = next;
    this.prev = prev;
  }
}
export class RemoveDelta2 {
  prev: Commit2;

  constructor(prev: Commit2) {
    this.prev = prev;
  }
}
export class SkipDelta2 {
  ref: CommitRef2;

  constructor(ref: CommitRef2) {
    this.ref = ref;
  }
}

export class DeltaSet2 {
  created: CreateDelta2[] = []
  updated: UpdateDelta2[] = []
  removed: RemoveDelta2[] = []
  skipped: SkipDelta2[] = []

  create(next: Commit2) {
    this.created.push(new CreateDelta2(next))
  }
  update(prev: Element, next: Commit2) {
    this.updated.push(new UpdateDelta2(prev, next))
  }
  remove(prev: Commit2) {
    this.removed.push(new RemoveDelta2(prev))
  }
  skip(ref: CommitRef2) {
    this.skipped.push(new SkipDelta2(ref))
  }
}

/**
 * The Delta class represents an accumulation
 * of changes over time.
 */
export class Delta {
  fresh: Map<CommitID, Commit2> = new Map();
  changed: Map<CommitID, { prev: Element, next: Commit2, moved: boolean }> = new Map();
  removed: Map<CommitID, Commit2> = new Map();

  effects: Map<EffectID, EffectTask> = new Map();
  cleanups: Map<EffectID, EffectTask> = new Map();

  get size() {
    return (
      + this.fresh.size
      + this.changed.size
      + this.removed.size
    )
  }

  add(commit: Commit2) {
    this.fresh.set(commit.ref.id, commit)
  }
  update(prev: Element, next: Commit2, moved: boolean) {
    if (this.fresh.has(next.ref.id)) {
      this.fresh.set(next.ref.id, next);
    } else {
      const change = this.changed.get(next.ref.id);
      if (change) {
        change.next = next;
      } else {
        this.changed.set(next.ref.id, { prev, next, moved });
      }
    }
  }
  delete(commit: Commit2) {
    if (this.fresh.has(commit.ref.id)) {
      this.fresh.delete(commit.ref.id);
    }
    else {
      if (this.changed.has(commit.ref.id))
        this.changed.delete(commit.ref.id);

      this.removed.set(commit.ref.id, commit);
    }
  }

  addEffects(tasks: EffectTask[]) {
    for (const task of tasks) {
      this.effects.set(task.id, task);
    }
  }

  addCleanups(tasks: EffectTask[]) {
    for (const task of tasks) {
      this.effects.delete(task.id);
      this.cleanups.set(task.id, task);
    }
  }
}