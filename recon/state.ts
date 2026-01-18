import { CommitID, CommitRef2 } from "./commit.ts";
import { OpaqueID, Deps, EffectCleanup, ContextID, HookImplementation, createId, BoundaryProps } from '@lukekaalim/act';
import { CommitTree2 } from "./tree.ts";


export type EffectID = OpaqueID<"EffectID">;
export type EffectTask = {
  ref: CommitRef2,
  id: EffectID,
  func: () => void,
}

export type ComponentState = {
  ref: CommitRef2;

  unmounted: boolean,

  hookIndex: number,
  hooks: null | HookImplementation,
  effectTasks: null | EffectTask[],

  values:   Map<number, unknown>;
  deps:     Map<number, Deps>;
  effects:  Map<number, EffectID>;
  cleanups:  Map<number, EffectCleanup>;

  rejection: null | { value: unknown };
  boundary: null | BoundaryState;

  providers:  Map<number, null | ContextState<unknown>>;
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
    
    const commit = this.tree.commits.get(this.ref.id);
    if (commit) {
      const onError = (commit.element.props as BoundaryProps).onError;
      if (onError)
        onError(thrownValue);
    }

    this.values.set(ref.id, thrownValue);
  }
  
  clearThrow(ref: CommitRef2) {
    this.values.delete(ref.id);

    if (this.mode === 'normal')
      this.tree.reconciler.render(this.ref);
  }
}