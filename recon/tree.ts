import { ContextID, EffectCleanup, Element, specialNodeTypes } from "@lukekaalim/act";
import { Commit2, CommitID, CommitRef2 } from "./commit.ts";
import { ElementOutput2 } from "./element.ts";
import { BoundaryState, ComponentState, ContextState, EffectID } from "./state.ts";
import { Reconciler2 } from "./reconciler.ts";
import { last } from "./algorithms.ts";

/**
 * The CommitTree is responsible for keeping track
 * of act's "canon" understanding of the application tree,
 * including references to all live commits, all component
 * state, all context state and such.
 * 
 * The key methods here are "processElement", which
 * is the gateway into getting an element into the tree,
 * and "unmountCommit", which clears all the references
 * from a particular commit.
 * 
 * While changes done here are immediate (you always get
 * the current state of the tree), the renderer won't see any
 * intermediate states - the return values of "process" and "unmount"
 * is later added to the WorkThread's "Delta", which is the
 * actual value passes to renderers.
 * 
 * Don't forget - commits are mutable! Once you get a reference
 * to a commit, you always have the latest copy of it.
 */
export class CommitTree2 {
  reconciler: Reconciler2;

  components: Map<CommitID, ComponentState> = new Map();
  contexts: Map<CommitID, ContextState<unknown>> = new Map();
  boundaries: Map<CommitID, BoundaryState> = new Map();

  cleanups: Map<EffectID, EffectCleanup> = new Map();

  commits: Map<CommitID, Commit2> = new Map();
  roots: Set<CommitID> = new Set();

  constructor(reconciler: Reconciler2) {
    this.reconciler = reconciler;
  }

  getOrCreateComponentState(ref: CommitRef2) {
    let state = this.components.get(ref.id);
    if (!state) {
      state = {
        unmounted: false,
        ref,
        hookIndex: 0,
        rejection: null,
        boundary: null,
        hooks: null,
        providers: new Map(),
        values: new Map(),
        deps: new Map(),
        effects: new Map(),
      }
      this.components.set(ref.id, state);
    }
    return state;
  }

  getOrCreateProviderState(ref: CommitRef2, element: Element) {
    let state = this.contexts.get(ref.id);
    if (!state) {
      state = {
        id: ref.id,
        contextId: element.props.id as ContextID,
        value: element.props.value,
        consumers: new Map(),
      }
      this.contexts.set(ref.id, state);
    }
    return state;
  }
  getOrCreateBoundaryState(ref: CommitRef2) {
    let state = this.boundaries.get(ref.id);
    if (!state) {
      state = new BoundaryState(this, ref);
      this.boundaries.set(ref.id, state);
    }
    return state;
  }

  findClosestBoundary(ref: CommitRef2) {
    let ancestor: CommitRef2 | null = ref;
    let lastAncestor: CommitRef2 | null = null;

    while (ancestor) {
      const state = this.boundaries.get(ancestor.id);
      if (state) {
        if (state.mode === 'fallback' && state.fallbackRef) {
          // need to check that we are not "in" the fallback
          if (lastAncestor && lastAncestor.id === state.fallbackRef.id) {
            // we are in the fallback - continue to next ancestor
            lastAncestor = ancestor;
            ancestor = ancestor.parent;
            continue;
          }
        }

        // otherwise, we've found our closest boundary
        return state;
      }

      lastAncestor = ancestor;
      ancestor = ancestor.parent;
    }
  }

  unmountCommit(prev: Commit2) {
    const output = new ElementOutput2(prev.ref);
    output.prevChildren = prev.children.map(c => this.commits.get(c.id) as Commit2);
  
    switch (typeof prev.element.type) {
      case 'symbol': {
        switch (prev.element.type) {
          case specialNodeTypes.provider:
            this.contexts.delete(prev.ref.id);
            // you might think we have to do some
            // special logic about notifying subscribers
            // that the context died, but the subscribers are
            // also about to die so its ok!
            break;
          case specialNodeTypes.boundary:
            this.boundaries.delete(prev.ref.id);
            break;
        }
        break;
      }
      case 'function': {
        const componentState = this.components.get(prev.ref.id) as ComponentState;
        componentState.unmounted = true;
        for (const provider of componentState.providers.values()) {
          if (provider)
            provider.consumers.delete(prev.ref.id);
        }
        if (componentState.boundary && componentState.rejection) {
          componentState.boundary.clearThrow(prev.ref);
        }
        output.cleanups = [];
        for (const effectId of componentState.effects.values()) {
          const cleanup = this.cleanups.get(effectId);
          if (!cleanup)
            continue;
          output.cleanups.push({
            id: effectId,
            ref: prev.ref,
            func: cleanup
          });
        }
        this.components.delete(prev.ref.id);
        break;
      }
    }

    output.calculateDiff();
    return output;
  }

  processElement(element: Element, ref: CommitRef2, commit: (Commit2 | null)) {
    const output = new ElementOutput2(ref);

    if (commit)
      output.prevChildren = commit.children.map(c => this.commits.get(c.id) as Commit2);

    switch (typeof element.type) {
      case 'string':
        output.processPrimitive(element);
        break;
      case 'symbol': {
        switch (element.type) {
          case specialNodeTypes.provider: {
            const state = this.getOrCreateProviderState(ref, element);
            output.processProvider(element, state)
            break;
          }
          case specialNodeTypes.boundary: {
            const state = this.getOrCreateBoundaryState(ref);
            output.processBoundary(element, state);
            break;
          }
          case specialNodeTypes.render:
          default:
            output.processPrimitive(element)
            break;
        }
        break;
      }
      case 'function': {
        const state = this.getOrCreateComponentState(ref);
        output.processComponent(element.type, element, this, state);
        break;
      }
    }

    return output;
  }
}

