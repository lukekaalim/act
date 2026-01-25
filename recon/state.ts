import { CommitID, CommitRef2 } from "./commit.ts";
import { OpaqueID, Deps, EffectCleanup, ContextID, HookImplementation, createId, BoundaryProps } from '@lukekaalim/act';
import { CommitTree2 } from "./tree.ts";

export type HookID = number;
export type EffectID = OpaqueID<"EffectID">;
export type EffectTask = {
  ref: CommitRef2,
  id: EffectID,
  func: () => void,
}

export type ComponentState = {
  ref: CommitRef2;

  unmounted: boolean,

  hookIndex: HookID,
  hooks: null | HookImplementation,
  effectTasks: null | EffectTask[],

  values:   Map<HookID, unknown>;
  deps:     Map<HookID, Deps>;
  effects:  Map<HookID, EffectID>;
  cleanups:  Map<HookID, EffectCleanup>;

  rejection: null | { value: unknown };
  boundary: null | BoundaryState;

  providers:  Map<HookID, null | ContextState<unknown>>;
};

export type ContextState<T> = {
  id: CommitID,
  contextId: ContextID,
  consumers: Map<CommitID, CommitRef2>,
  value: T,
}

export type BoundaryID = OpaqueID<"BoundaryID">;

export class BoundaryState {
  tree: CommitTree2;

  id: BoundaryID;
  ref: CommitRef2;

  /**
   * When the boundary is in "fallback"
   * mode, this should reference the immediate
   * fallback node that was generated.
   */
  fallbackRef: null | CommitRef2 = null;

  values: Map<CommitID, unknown> = new Map();

  get mode(): 'normal' | 'fallback' {
    return this.values.size === 0
      ? 'normal'
      : 'fallback'
  }

  constructor(tree: CommitTree2, ref: CommitRef2) {
    this.tree = tree;
    this.ref = ref;
    this.id = createId("BoundaryID");
  }

  addThrow(ref: CommitRef2, thrownValue: unknown) {
    if (this.mode === 'normal')
      this.tree.reconciler.render(this.ref);
    
    this.values.set(ref.id, thrownValue);

    const commit = this.tree.commits.get(this.ref.id);
    if (commit) {
      const onThrow = (commit.element.props as BoundaryProps).onThrow;
      if (onThrow)
        onThrow(thrownValue, [...this.values.values()]);
    }
  }
  
  clearThrow(ref: CommitRef2) {
    this.values.delete(ref.id);

    if (this.mode === 'normal')
      this.tree.reconciler.render(this.ref);

    const commit = this.tree.commits.get(this.ref.id);
    if (commit) {
      const onClear = (commit.element.props as BoundaryProps).onClear;
      if (onClear)
        onClear();
    }
  }
}