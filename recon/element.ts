import {
  ContextID, Element, Node,
  providerNodeType,
  convertNodeToElements,
  Component,
  Props,
  ElementID,
  ElementType,
  boundaryNodeType
} from "@lukekaalim/act";
import { Commit, Commit2, CommitID, CommitRef, CommitRef2 } from "./commit";
import { loadHooks, loadHooks2 } from "./hooks";
import { ContextState } from "./context";
import { ComponentState, EffectID, EffectTask } from "./state";
import { CommitTree } from "./tree";
import { WorkThread } from "./thread";
import { keyedElementEqualityTest2, Update, WorkTask } from "./update";
import { ChangeReport2 } from "./algorithms";
import { Reconciler2 } from "./reconciler";

/**
 * When processing an element, it may produce additional
 * pieces of information: new targets, side effects, and boundary
 * values
 */
export type ElementOutput = {
  child: Node,
  reject: null | unknown,
  effects: EffectTask[],
};
export const ElementOutput = {
  new: (child: Node): ElementOutput => ({
    child,
    reject: null,
    effects: [],
  })
}

export type TypedElement<TElementType extends ElementType> = {
  id: ElementID,
  props: Props,
  children: Node,
  type: TElementType
}

/**
 * A data structure that represents the immediate output
 * inserting something into the tree such as:
 *  - What the new children would be
 *  - Additional tasks that might need to be done
 *  - Side effects from running components
 *  - Rejection values
 *  - Extra rendering targets that now need to be accounted for
 */
export class ElementOutput2 {
  element: Element | null = null;
  ref: CommitRef2;

  children: Element[] = [];

  prevChildren: Commit2[] | null = null;

  childRefs: CommitRef2[] = [];
  updates: WorkTask[] = []

  reject: null | unknown = null;

  effects: null | EffectTask[] = null;
  cleanups: null | EffectTask[] = null;

  extraTargets: null | CommitRef[] = null;

  constructor(ref: CommitRef2) {
    this.ref = ref;
  }

  processComponent(component: Component<{}>, element: Element, reconciler: Reconciler2, state: ComponentState) {
    this.element = element;
    this.effects = [];

    loadHooks2(reconciler, state, this.ref, this.effects);

    const props = {
      ...this.element.props,
      children: this.element.children,
    } as Parameters<typeof component>[0];
    
    try {
      this.setNode(component(props));
    } catch (thrownValue) {
      this.reject = thrownValue;
    }
  }

  processPrimitive(element: Element) {
    this.element = element;
    this.setNode(this.element.children);
  }

  processProvider(element: Element, state: ContextState<unknown>) {
    this.element = element;
    this.setNode(this.element.children);

    if (state.value !== element.props.value) {
      state.value = element.props.value;
      this.extraTargets = [...state.consumers.values()];
    }
  }

  calculateDiff() {
    if (this.prevChildren && this.children.length !== 0) {
      const changes = ChangeReport2.generate(this.prevChildren, this.children, keyedElementEqualityTest2);

      for (let childIndex = 0; childIndex < this.children.length; childIndex++) {
        const transform = changes.transform[childIndex];
      
        if (transform === -1) {
          const newRef = CommitRef2.fresh(this.ref.path);
          this.updates.push(WorkTask.fresh(newRef, this.children[childIndex]));
          this.childRefs.push(newRef);
        }
        else {
          const prevCommit = this.prevChildren[transform]
          this.childRefs.push(prevCommit.ref);
          const moved = childIndex !== transform;
          if (moved)
            this.updates.push(WorkTask.move(prevCommit, this.children[childIndex]));
          else
            this.updates.push(WorkTask.existing(prevCommit, this.children[childIndex]));
        }
      }
      for (let removedIndex = 0; removedIndex < changes.removed.length; removedIndex++) {
        const prevCommit = this.prevChildren[removedIndex]
        this.updates.push(WorkTask.remove(prevCommit))
      }
    } else if (!this.prevChildren) {
      // If there were no previous children, always generate "Create" tasks
      this.updates = this.children.map(child => WorkTask.fresh(CommitRef2.fresh(this.ref.path), child));
      this.childRefs = this.updates.map(c => c.ref);

    } else {
      // If there will be no children in the future, generate "Remove" tasks
      this.updates = this.prevChildren.map(child => WorkTask.remove(child));
      this.childRefs = [];
    }
  }

  setNode(node: Node) {
    this.children = convertNodeToElements(node);
  }
}

export type ElementService = {
  render(element: Element, ref: CommitRef, thread: WorkThread): ElementOutput,
  clear(ref: Commit): ElementOutput,

  boundary: Map<CommitID, unknown>,
}

export const createElementService = (
  tree: CommitTree,
  requestRender: (ref: CommitRef) => void
): ElementService => {
  const contextStates = new Map<CommitID, ContextState<unknown>>();
  const boundaryValues = new Map<CommitID, unknown>();

  const render = (
    element: Element,
    ref: CommitRef,
    thread: WorkThread,
  ): ElementOutput => {
    const output = ElementOutput.new(element.children);
  
    switch (typeof element.type) {
      case 'string':
        break;
      case 'symbol':
        switch (element.type) {
          case providerNodeType: {
            let state = contextStates.get(ref.id);
            if (!state) {
              state = {
                id: ref.id,
                contextId: element.props.id as ContextID,
                value: element.props.value,
                consumers: new Map(),
              }
              contextStates.set(ref.id, state);
            }
            if (state.value !== element.props.value) {
              state.value = element.props.value;
              
              for (const [, consumer] of state.consumers) {
                // there should be no way for the children of the
                // provider to already have been renderer,
                // so we don't check the return value.
                WorkThread.queueTarget(thread, consumer, tree);
              }
            }
            break;
          }
          case boundaryNodeType: {
            //const error = tree.getOrCreateBoundaryState(ref.id);
            //if (error.state === 'error')
            //  output.child = null;
            break;
          }
          default:
            break;
        }
        break;
      case 'function': {
        let state = tree.components.get(ref.id);
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
          tree.components.set(ref.id, state);
        }
        loadHooks(contextStates, requestRender, state, ref, output);
        const props = {
          ...element.props,
          children: element.children,
        } as Parameters<typeof element.type>[0];
        try {
          output.child = element.type(props);
        } catch (thrownValue) {
          output.child = null;
          output.reject = thrownValue;
        }
        break;
      }
      default:
        break;
    }
    return output;
  }
  const clear = (prev: Commit) => {
    const output = ElementOutput.new(null);
  
    switch (typeof prev.element.type) {
      case 'symbol': {
        switch (prev.element.type) {
          case providerNodeType:
            contextStates.delete(prev.id);
        }
        break;
      }
      case 'function': {
        const componentState = tree.components.get(prev.id) as ComponentState;
        componentState.unmounted = true;
        for (const [,context] of componentState.contexts) {
          if (context.state)
            context.state.consumers.delete(prev.id);
        }
        for (const [index, cleanup] of componentState.cleanups) {
          if (!cleanup)
            continue;
          const id = componentState.effects.get(index) as EffectID;
          output.effects.push({
            id,
            ref: prev,
            func: () => {
              cleanup();
            }
          });
        }
        tree.components.delete(prev.id);
        break;
      }
    }

    return output;
  }

  return { render, clear, boundary: boundaryValues };
}

export const ElementService = {
  create: createElementService
}