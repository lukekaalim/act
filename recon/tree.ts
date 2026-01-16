import { ContextID, Element, providerNodeType, specialNodeTypes } from "@lukekaalim/act";
import { Commit, Commit2, CommitID, CommitRef, CommitRef2 } from "./commit.ts";
import { ContextState } from "./context.ts";
import { ElementOutput2 } from "./element.ts";
import { ErrorBoundaryState } from "./errors.ts";
import { ComponentState, EffectID } from "./state.ts";
import { Reconciler2 } from "./reconciler.ts";

export class CommitTree {
  components: Map<CommitID, ComponentState>;
  contexts: Map<CommitID, ContextState<unknown>>;
  boundaryStates: Map<CommitID, ErrorBoundaryState>;

  commits: Map<CommitID, Commit>;
  roots: Set<CommitRef>;

  private constructor() {
    this.components = new Map();
    this.contexts = new Map();
    this.boundaryStates = new Map();

    this.commits = new Map();
    this.roots = new Set();
  }

  static new() {
    return new CommitTree();
  }
}

export class CommitTree2 {
  reconciler: Reconciler2;

  components: Map<CommitID, ComponentState> = new Map();
  contexts: Map<CommitID, ContextState<unknown>> = new Map();
  boundaries: Map<CommitID, ErrorBoundaryState> = new Map();

  commits: Map<CommitID, Commit2> = new Map();
  roots: Set<CommitRef2> = new Set();

  constructor(reconciler: Reconciler2) {
    this.reconciler = reconciler;
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
            return output;
          case specialNodeTypes.boundary:
            this.boundaries.delete(prev.ref.id);
            return output;
        }
        break;
      }
      case 'function': {
        const componentState = this.components.get(prev.ref.id) as ComponentState;
        componentState.unmounted = true;
        for (const [,context] of componentState.contexts) {
          if (context.state)
            context.state.consumers.delete(prev.ref.id);
        }
        output.cleanups = [];
        for (const [index, cleanup] of componentState.cleanups) {
          if (!cleanup)
            continue;
          const id = componentState.effects.get(index) as EffectID;
          output.cleanups.push({
            id,
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
        element.type
        output.processPrimitive(element);
        break;
      case 'symbol':
        switch (element.type) {
          case specialNodeTypes.provider: {
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
            output.processProvider(element, state)
            break;
          }
          default:
          case specialNodeTypes.render:
            output.processPrimitive(element)
            break;
        }
        break;
      case 'function': {
        let state = this.components.get(ref.id);
        if (!state) {
          state = {
            unmounted: false,
            ref,
            cleanups: new Map(),
            contexts: new Map(),
            values: new Map(),
            deps: new Map(),
            effects: new Map(),
          }
          this.components.set(ref.id, state);
        }
        output.processComponent(element.type, element, this.reconciler, state)
        break;
      }
    }

    output.calculateDiff();
    return output;
  }
}

