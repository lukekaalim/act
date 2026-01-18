import {
  Element, Node,
  convertNodeToElements,
  Component,
  hookImplementation,
  Fallback,
  h,
} from "@lukekaalim/act";
import { Commit2, CommitRef2 } from "./commit";
import { loadHooks2 } from "./hooks";
import { BoundaryState, ComponentState, ContextState, EffectTask } from "./state";
import { keyedElementEqualityTest2, WorkTask } from "./update";
import { ChangeReport2 } from "./algorithms";
import { Reconciler2 } from "./reconciler";
import { CommitTree2 } from "./tree";

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
  /**
   * Processing an element of some kind often
   * implies changes to it's children: the Output
   * will produce additional tasks that a thread should enqueue.
   */
  updates: WorkTask[] = []
  
  effects: null | EffectTask[] = null;
  cleanups: null | EffectTask[] = null;

  extraTargets: null | CommitRef2[] = null;

  constructor(ref: CommitRef2) {
    this.ref = ref;
  }

  processComponent(component: Component<{}>, element: Element, tree: CommitTree2, state: ComponentState) {
    this.element = element;
    state.effectTasks = null;
    
    state.hookIndex = 0;
    if (!state.hooks)
      state.hooks = loadHooks2(tree.reconciler, state, this.ref);

    hookImplementation.useContext = state.hooks.useContext;
    hookImplementation.useEffect = state.hooks.useEffect;
    hookImplementation.useState = state.hooks.useState;

    const props = {
      ...this.element.props,
      children: this.element.children,
    } as Parameters<typeof component>[0];
    
    try {
      this.setNode(component(props));
      if (state.rejection) {
        state.rejection = null;

        if (state.boundary)
          state.boundary.clearThrow(this.ref);
      }
      this.effects = state.effectTasks;
      this.calculateDiff();
    } catch (thrownValue) {
    
      if (!state.boundary) {
        const boundary = tree.findClosestBoundary(this.ref);
        if (!boundary)
          throw thrownValue;

        state.boundary = boundary;
      }
      // update component state to know we rejected
      state.rejection = { value: thrownValue };
      state.boundary.addThrow(this.ref, thrownValue);

      if (this.prevChildren)
        this.childRefs = this.prevChildren.map(c => c.ref);
    }
  }

  processPrimitive(element: Element) {
    this.element = element;
    this.setNode(this.element.children);
    this.calculateDiff();
  }

  processProvider(element: Element, state: ContextState<unknown>) {
    this.element = element;
    this.setNode(this.element.children);

    if (state.value !== element.props.value) {
      state.value = element.props.value;
      this.extraTargets = [...state.consumers.values()];
    }
    this.calculateDiff();
  }
  processBoundary(element: Element, state: BoundaryState) {
    this.element = element;
    const fallbackElement = !!element.props.fallback && h(Fallback, {}, element.props.fallback as Node)

    if (state.mode === 'normal') {

      this.setNode([this.element.children]);
      this.calculateDiff();

    } else if (fallbackElement) {
      // Handle a boundary
      this.setNode([this.element.children, fallbackElement]);
      this.calculateDiff();

      for (let i = 0; i < this.children.length; i++) {
        const childElement = this.children[i];
        if (childElement.id === fallbackElement.id) {
          const childCommit = this.childRefs[i];
          state.fallbackRef = childCommit;
        }
      }
    }
  }

  calculateDiff() {
    if (this.prevChildren && this.children.length !== 0) {
      const changes = ChangeReport2.generate(this.prevChildren, this.children, keyedElementEqualityTest2);

      for (let childIndex = 0; childIndex < this.children.length; childIndex++) {
        const transform = changes.transform[childIndex];
      
        if (transform === -1) {
          const newRef = CommitRef2.fresh(this.ref);
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
        const prevCommit = this.prevChildren[changes.removed[removedIndex]]
        this.updates.push(WorkTask.remove(prevCommit))
      }
    } else if (!this.prevChildren) {
      // If there were no previous children, always generate "Create" tasks
      this.updates = this.children.map(child => WorkTask.fresh(CommitRef2.fresh(this.ref), child));
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
