import { Element } from "@lukekaalim/act";
import { Commit2, CommitID } from "./commit.ts";
import { EffectID, EffectTask, EffectTask2 } from "./state.ts";

/**
 * The Delta class represents an accumulation
 * of changes over time.
 * 
 * A WorkThread may do several "passes" over the CommitTree,
 * but all of those changes are written to the same Delta.
 * 
 * The Delta keeps track of only the immediately prior state (the
 * last one that was sent to the Renderer), and the final state.
 * 
 * If a pass causes a component to be rendered/updated several times,
 * it will only be recorded in the delta once for it's final state. Similarly,
 * if an element is create in one pass, but removed in a another, then it will
 * be entirely excluded from the delta - and the renderer will never know it existed.
 * 
 * The Delta records Commits as well as Effects this way.
 */
export class Delta {
  fresh: Map<CommitID, Commit2> = new Map();
  changed: Map<CommitID, { prev: Element, next: Commit2, moved: boolean }> = new Map();
  removed: Map<CommitID, Commit2> = new Map();

  effects: Map<EffectID, EffectTask2> = new Map();

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

  addEffects(tasks: EffectTask2[]) {
    for (const task of tasks) {
      this.effects.set(task.id, task);
    }
  }
}