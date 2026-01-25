"use strict";
(() => {
  // ../core/errors.ts
  var unsetHookText = `
A hook was run, but it didnt have any implementations set up for it.

This error might be caused by manually calling a component function
(or a hook directly) outside of act, or by multiple copies of
Act in a project at once!

The renderer is supposed to set up implementation for each hook before
it runs the component.

Check the location of this error, and which version of act your
renderer uses internaly. You might get this error if those are two
different packages!
`.trim();
  var UnsetHookImplementation = class extends Error {
    constructor() {
      super(unsetHookText);
    }
  };
  var unknownElementText = `
Encountered an object that is not any of the expected node types, like
string, number, boolean, array, null, or the result of a call to createElement.

Maybe something was accidentally returned from a Component, or was passed
as a child to an element?
`.trim();
  var UnknownElementType = class extends Error {
    constructor() {
      super(unknownElementText);
    }
  };

  // ../core/hooks.ts
  var placeholderImplementation = () => {
    throw new UnsetHookImplementation();
  };
  var hookImplementation = {
    useState: placeholderImplementation,
    useEffect: placeholderImplementation,
    useContext: placeholderImplementation
  };
  var calculateValue = (valueOrCalculator) => {
    if (typeof valueOrCalculator === "function")
      return valueOrCalculator();
    return valueOrCalculator;
  };
  var calculateDepsChange = (prev, next) => {
    if (!prev || !next) return true;
    return prev.length !== next.length || prev.some((value, i) => value !== next[i]);
  };
  var runUpdater = (prev, updater) => {
    if (typeof updater === "function")
      return updater(prev);
    return updater;
  };
  var useState = (initialValue) => {
    return hookImplementation.useState(initialValue);
  };
  var useEffect = (effect, deps = []) => {
    return hookImplementation.useEffect(effect, deps);
  };
  var useContext = (context) => {
    return hookImplementation.useContext(context);
  };
  var refSymbol = /* @__PURE__ */ Symbol();
  var useRef = (initialValue) => {
    const [ref] = useState(() => ({ current: calculateValue(initialValue), [refSymbol]: true }));
    return ref;
  };
  var useMemo = (calculate, deps) => {
    const prevDeps = useRef(deps);
    const valueRef = useRef(calculate);
    if (calculateDepsChange(prevDeps.current, deps)) {
      prevDeps.current = deps;
      valueRef.current = calculate();
    }
    return valueRef.current;
  };

  // ../core/id.ts
  var latestId = 0;
  var createId = (namespace) => {
    if (namespace) {
      if (!(namespace in namespaces))
        namespaces[namespace] = 0;
      return namespaces[namespace]++;
    }
    return latestId++;
  };
  var namespaces = {};
  globalThis.__LUKEKAALIM_ACT_GLOBAL_NAMESPACE_ID = namespaces;

  // ../core/element.ts
  var EMPTY_PROPS = Object.freeze({});
  function createElement(type, props, children = []) {
    return {
      id: createId("ElementID"),
      type,
      props: props || EMPTY_PROPS,
      children
    };
  }
  var h = createElement;

  // ../core/context.ts
  var providerNodeType = /* @__PURE__ */ Symbol("provider");
  var createContext = (defaultValue) => {
    const id = createId("ContextID");
    return {
      Provider({ value, children }) {
        return h(providerNodeType, { value, id }, children);
      },
      defaultValue,
      id
    };
  };

  // ../core/node.ts
  var primitiveNodeTypes = {
    string: /* @__PURE__ */ Symbol("string-node"),
    number: /* @__PURE__ */ Symbol("number-node"),
    boolean: /* @__PURE__ */ Symbol("boolean-node"),
    null: /* @__PURE__ */ Symbol("null-node"),
    array: /* @__PURE__ */ Symbol("array-node")
  };
  var convertNodeToElements = (node) => {
    const nodeArray = Array.isArray(node) ? node : [node];
    return nodeArray.map(convertNodeToElement);
  };
  var convertNodeToElement = (node) => {
    switch (typeof node) {
      case "boolean":
        return h(primitiveNodeTypes.boolean, { value: node });
      case "number":
        return h(primitiveNodeTypes.number, { value: node });
      case "string":
        return h(primitiveNodeTypes.string, { value: node });
      case "object":
        if (node === null)
          return h(primitiveNodeTypes.null);
        if (Array.isArray(node))
          return h(primitiveNodeTypes.array, {}, node);
        return node;
      case "symbol":
        return node;
      case "undefined":
        throw new Error(`Undefined is not a valid act element!`);
      default:
        throw new UnknownElementType();
    }
  };

  // ../core/special.ts
  var boundaryNodeType = /* @__PURE__ */ Symbol("boundary");
  var fallbackNodeType = /* @__PURE__ */ Symbol("fallback");
  var suspendNodeType = /* @__PURE__ */ Symbol("suspend");
  var renderNodeType = /* @__PURE__ */ Symbol("render");
  var placeholderNodeType = /* @__PURE__ */ Symbol("placeholder");
  var Fallback = fallbackNodeType;
  var Suspend = suspendNodeType;
  var specialNodeTypes = {
    boundary: boundaryNodeType,
    render: renderNodeType,
    provider: providerNodeType,
    fallback: fallbackNodeType,
    suspend: suspendNodeType,
    placeholder: placeholderNodeType
  };

  // ../core/mod.ts
  if (globalThis["__LUKEKAALIM_ACT_GLOBAL_CHECK"]) {
    console.warn(`There are multiple (at least ${globalThis.__LUKEKAALIM_ACT_GLOBAL_CHECK}) copies of Act running!`);
    globalThis.__LUKEKAALIM_ACT_GLOBAL_CHECK++;
  } else {
    globalThis.__LUKEKAALIM_ACT_GLOBAL_CHECK = 1;
  }

  // ../renderers/web/props.ts
  var setProps = (window2, node, next, prev) => {
    if (node instanceof window2.HTMLElement) {
      setHTMLElementProps(node, next, prev);
    }
    if (node instanceof window2.SVGElement) {
      setSVGElementProps(node, next, prev);
    }
    if (node instanceof window2.Text) {
      if (node.textContent !== next.props.value)
        node.textContent = next.props.value;
    }
  };
  var setSVGElementProps = (node, next, prev) => {
    setPropObject(node, next.props, prev && prev.props, (name, next2, prev2) => {
      if (name.startsWith("on")) {
        const eventName = name.slice(2).toLocaleLowerCase();
        setEventProp(node, eventName, next2, prev2);
        return true;
      }
      switch (name) {
        case "ref":
          next2.current = node;
          return true;
        case "style":
          return setStyleProp(node.style, next2, prev2), true;
        default:
          node.setAttribute(name, next2);
          return true;
      }
      ;
    });
  };
  var setHTMLElementProps = (node, next, prev) => {
    setPropObject(node, next.props, prev && prev.props, (name, next2, prev2) => {
      if (name.startsWith("on")) {
        const eventName = name.slice(2).toLocaleLowerCase();
        setEventProp(node, eventName, next2, prev2);
        return true;
      }
      if (name.startsWith("data-")) {
        if (next2 === void 0)
          node.removeAttribute(name);
        else
          node.setAttribute(name, next2);
      }
      switch (name) {
        case "ref":
          next2.current = node;
          return true;
        case "style":
          return setStyleProp(node.style, next2, prev2), true;
        case "className":
          node.className = next2;
          return true;
        case "classList":
          const classNames = next2.filter(Boolean).join(" ");
          node.className = classNames;
          return true;
        default:
          return false;
      }
    });
  };
  var setEventProp = (node, type, next, prev) => {
    if (prev === next)
      return;
    if (prev) {
      node.removeEventListener(type, prev);
    }
    if (next) {
      node.addEventListener(type, next);
    }
  };
  var setStyleProp = (node, style, prevStyle) => {
    setPropObject(node, style, prevStyle, (name, value) => (node.setProperty(name, value), true));
  };
  var setPropObject = (target, next, prev, assign = null) => {
    const names = /* @__PURE__ */ new Set([
      ...Object.keys(next || {}),
      ...Object.keys(prev || {})
    ]);
    for (const name of names) {
      const nextValue = (next || {})[name];
      const successfulAssign = assign && assign(name, nextValue, (prev || {})[name]);
      if (!successfulAssign) {
        if (target[name] !== nextValue) {
          target[name] = nextValue;
        }
      }
    }
  };

  // ../renderers/web/space.ts
  var defaultWindow = globalThis.window;
  var createWebNodeBuilder = (root, window2 = defaultWindow) => ({
    roots: /* @__PURE__ */ new Set(["web:html", "web:svg"]),
    create(element, rootType) {
      const tag = element.type;
      switch (typeof tag) {
        case "symbol": {
          switch (tag) {
            case primitiveNodeTypes.string:
            case primitiveNodeTypes.number:
              return window2.document.createTextNode("<empty text>");
            default:
              return null;
          }
        }
        case "string": {
          switch (rootType) {
            case "web:html":
              return window2.document.createElementNS("http://www.w3.org/1999/xhtml", tag);
            case "web:svg":
              return window2.document.createElementNS("http://www.w3.org/2000/svg", tag);
          }
        }
        default:
          return null;
      }
    },
    update(el, next, prev) {
      setProps(window2, el, next, prev);
    },
    link(el, parent) {
      parent.appendChild(el);
    },
    linkRoot(child) {
      root.appendChild(child);
    },
    unlink(el, parent) {
      if (el.parentNode === parent)
        parent.removeChild(el);
    },
    destroy(el) {
      if (el.parentNode)
        el.parentNode.removeChild(el);
    },
    suspend(el, parent) {
      if (el instanceof HTMLElement)
        el.style.opacity = 0.5.toString();
    },
    unsuspend(el, parent) {
      if (el instanceof HTMLElement)
        el.style.opacity = 1 .toString();
    },
    sort(el, newChildren) {
      if (el instanceof Text)
        return;
      for (const child of el.childNodes)
        if (!newChildren.includes(child)) {
          if (newChildren.length < 2)
            return;
        }
      for (let i = 0; i < newChildren.length; i++)
        if (el.children[i] !== newChildren[i])
          el.insertBefore(newChildren[i], el.children[i]);
    }
  });

  // ../renderers/backstage/space2.ts
  var RenderSpace2 = class {
    /** The CommitTree this render space is connected to */
    tree;
    /** A reverse map to look up Commits given just the node they represent */
    nodeByCommit = /* @__PURE__ */ new Map();
    /** A reverse map to look up Commits given just the node they represent */
    commitByNode = /* @__PURE__ */ new Map();
    /** For a given CommitID, find it's closest "real" parent (a ancestor with a non-null TNode) */
    parentByNode = /* @__PURE__ */ new Map();
    /**
     * A set of all special Root element IDs in the tree.
     * A Root element helps tell a renderer what kind of element
     * to render, based on it's closest Root.
     */
    roots = /* @__PURE__ */ new Map();
    bus;
    builder;
    constructor(tree, builder) {
      this.tree = tree;
      this.bus = {
        render: (delta) => {
          this.create(delta);
          this.update(delta);
        }
      };
      this.builder = builder;
    }
    findChildren(id, ignoreFirst = false, ignoreSuspended = true) {
      const node = this.nodeByCommit.get(id);
      if (node && !ignoreFirst)
        return [node];
      const commit = this.tree.commits.get(id);
      if (!commit)
        return [];
      if (commit.element.type === primitiveNodeTypes.null)
        return [];
      if (ignoreSuspended && commit.isSuspended())
        return [];
      return commit.children.map((c) => this.findChildren(c.id)).flat(1);
    }
    /**
     * "find parent" can return 3 types of results:
     *  - An ancestor has a node! we return that.
     *  - An ancestor is a "null" node - we return the special form of "commit but no node"
     *  - No ancestor has a node - you might be near the root
     * @param ref 
     * @returns 
     */
    findParent(ref) {
      let ancestor = ref;
      let attachable = true;
      while (ancestor) {
        if (ancestor.id !== ref.id) {
          const commit = this.tree.commits.get(ancestor.id) || null;
          if (commit && commit.element.type === primitiveNodeTypes.null)
            return { commit, node: null, attachable: false };
          if (commit && commit.isSuspended())
            attachable = false;
          const node = this.nodeByCommit.get(ancestor.id);
          if (node)
            return { commit, node, attachable };
        }
        ancestor = ancestor.parent;
      }
      return { commit: null, node: null, attachable };
    }
    findRoot(ref) {
      let ancestor = ref;
      while (ancestor) {
        const root = this.roots.get(ancestor.id);
        if (root)
          return root;
        ancestor = ancestor.parent;
      }
      return null;
    }
    newNodes = /* @__PURE__ */ new Set();
    needsReorder = /* @__PURE__ */ new Set();
    create(deltas) {
      this.newNodes.clear();
      this.needsReorder.clear();
      for (const next of deltas.fresh.values()) {
        if (next.element.type === specialNodeTypes.render) {
          this.roots.set(next.ref.id, next);
          continue;
        }
        const root = this.findRoot(next.ref);
        if (!root)
          continue;
        const rootType = root.element.props["type"];
        if (this.builder.roots.has(rootType)) {
          const node = this.builder.create(next.element, rootType, next.ref);
          if (node) {
            this.newNodes.add([next, node]);
            this.nodeByCommit.set(next.ref.id, node);
            this.commitByNode.set(node, next);
          }
        }
      }
    }
    update(deltas) {
      const {
        link,
        unlink,
        linkRoot,
        sort,
        update,
        destroy,
        unlinkRoot,
        suspend = unlink,
        unsuspend = link
      } = this.builder;
      if (link || sort) {
        for (const [next, node] of this.newNodes) {
          const result = this.findParent(next.ref);
          if (result.commit && result.node && result.attachable) {
            this.needsReorder.add(result.commit.ref.id);
            if (link)
              link(node, result.node);
          }
          if (linkRoot && !result.commit && result.attachable)
            linkRoot(node);
        }
      }
      if (update) {
        for (const { prev, next, moved } of deltas.changed.values()) {
          if (next.element.type === specialNodeTypes.suspend) {
            const result = this.findParent(next.ref);
            const wasSuspended = !!prev.props.suspended;
            const isSuspended = !!next.element.props.suspended;
            const suspenseChanged = wasSuspended !== isSuspended;
            if (suspenseChanged && result.commit && result.node) {
              this.needsReorder.add(result.commit.ref.id);
              const children = this.findChildren(next.ref.id, true, false);
              for (const child of children) {
                if (isSuspended && suspend) {
                  suspend(child, result.node);
                }
                if (!isSuspended && unsuspend) {
                  unsuspend(child, result.node);
                }
              }
            }
            continue;
          }
          const node = this.nodeByCommit.get(next.ref.id);
          if (!node)
            continue;
          update(node, next.element, prev, next.ref);
          if (moved) {
            const result = this.findParent(next.ref);
            if (result.commit) {
              this.needsReorder.add(result.commit.ref.id);
            }
          }
        }
        for (const next of deltas.fresh.values()) {
          const node = this.nodeByCommit.get(next.ref.id);
          if (node)
            update(node, next.element, null, next.ref);
        }
      }
      for (const prev of deltas.removed.values()) {
        const node = this.nodeByCommit.get(prev.ref.id);
        if (node) {
          this.nodeByCommit.delete(prev.ref.id);
          const parent = this.findParent(prev.ref);
          if (parent.commit && parent.node)
            this.needsReorder.add(parent.commit.ref.id);
          this.commitByNode.delete(node);
          if (unlink && parent.node)
            unlink(node, parent.node);
          if (unlinkRoot && !parent.commit)
            unlinkRoot(node);
          if (destroy)
            destroy(node);
        }
      }
      if (sort) {
        for (const id of this.needsReorder) {
          const node = this.nodeByCommit.get(id);
          if (node) {
            const children = this.findChildren(id, true, true);
            sort(node, children);
          }
        }
      }
    }
  };

  // ../recon/algorithms.ts
  var ChangeReport2 = class _ChangeReport2 {
    /**
     * The indices of elements that were removed
     */
    removed = [];
    /**
     * The indices of the previous position that an element
     * was in, or -1 if it didn't exist in the "prevs" array.
     */
    transform = [];
    /**
     * A (hopefully) faster single-entry report generator
     * @param prev 
     * @param next 
     * @param equalityTest 
     * @returns 
     */
    static generateSingles(prev, next, equalityTest) {
      const report = new _ChangeReport2();
      if (equalityTest(prev, next, 0, 0)) {
        report.transform.push(0);
      } else {
        report.transform.push(-1);
        report.removed.push(0);
      }
      return report;
    }
    static generate(prevs, nexts, equalityTest) {
      if (prevs.length === 0 && nexts.length === 0)
        return _ChangeReport2.generateSingles(prevs[0], nexts[0], equalityTest);
      const report = new _ChangeReport2();
      const visited = /* @__PURE__ */ new Set();
      for (let nextIndex = 0; nextIndex < nexts.length; nextIndex++) {
        const next = nexts[nextIndex];
        const prevIndex = prevs.findIndex((prev, prevIndex2) => equalityTest(prev, next, prevIndex2, nextIndex));
        report.transform.push(prevIndex);
        if (prevIndex !== -1)
          visited.add(prevIndex);
      }
      for (let i = 0; i < prevs.length; i++) {
        if (!visited.has(i))
          report.removed.push(i);
      }
      return report;
    }
  };

  // ../recon/pool.ts
  var createObjectPool = (build, assign) => {
    const pool = {
      maxSize: 256,
      available: [],
      all: [],
      get size() {
        return pool.available.length;
      },
      acquire(...args) {
        let object = pool.available.pop();
        if (!object) {
          object = build(...args);
          pool.all.push(object);
          return object;
        }
        assign(object, ...args);
        return object;
      },
      release(value) {
        pool.available.push(value);
      }
    };
    return pool;
  };

  // ../recon/commit.ts
  var CommitRef2 = class _CommitRef2 {
    id;
    parent;
    length;
    constructor(id, parent) {
      this.id = id;
      this.parent = parent;
      if (parent)
        this.length = parent.length + 1;
      else
        this.length = 1;
    }
    /*
    [Symbol.iterator]() {
      return this.ancestors();
    }
      */
    /**
     * Iterate though all "parent" commit refs,
     * including itself as the first entry.
     * 
     * @returns Iterator<CommitRef2>
     */
    *ancestors() {
      let ref = this;
      while (ref) {
        yield ref;
        ref = ref.parent;
      }
    }
    /**
     * 
     * @param climber A function that receives every ancestor commit ref,
     * including this one. Return "true" to stop climbing early.
     */
    climb(climber) {
      let ref = this;
      while (ref) {
        if (climber(ref))
          return;
        ref = ref.parent;
      }
    }
    find(test) {
      let result = null;
      this.climb((ref) => {
        const currentResult = test(ref);
        if (currentResult) {
          result = currentResult;
          return true;
        }
      });
      return result;
    }
    static fresh(parent) {
      return new _CommitRef2(createId("CommitID"), parent);
    }
    static rehydrate(id, length) {
      const ref = new _CommitRef2(id, null);
      ref.length = length;
      return ref;
    }
  };
  var Commit2 = class _Commit2 {
    static pool = () => createObjectPool(
      function alloc(ref, el, ch) {
        return new _Commit2(ref, el, ch);
      },
      function reassign(c, ref, el, ch) {
        c.ref = ref;
        c.element = el;
        c.children = ch;
        c.version = createId("CommitVersion");
      }
    );
    ref;
    element;
    children;
    version = createId("CommitVersion");
    constructor(ref, element, children) {
      this.ref = ref;
      this.element = element;
      this.children = children;
    }
    update(element = null, children = null) {
      this.version = createId("CommitVersion");
      if (element)
        this.element = element;
      if (children)
        this.children = children;
    }
    isSuspended() {
      return this.element.type === specialNodeTypes.suspend && this.element.props.suspended;
    }
  };

  // ../recon/delta.ts
  var Delta = class {
    fresh = /* @__PURE__ */ new Map();
    changed = /* @__PURE__ */ new Map();
    removed = /* @__PURE__ */ new Map();
    effects = /* @__PURE__ */ new Map();
    cleanups = /* @__PURE__ */ new Map();
    get size() {
      return +this.fresh.size + this.changed.size + this.removed.size;
    }
    add(commit) {
      this.fresh.set(commit.ref.id, commit);
    }
    update(prev, next, moved) {
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
    delete(commit) {
      if (this.fresh.has(commit.ref.id)) {
        this.fresh.delete(commit.ref.id);
      } else {
        if (this.changed.has(commit.ref.id))
          this.changed.delete(commit.ref.id);
        this.removed.set(commit.ref.id, commit);
      }
    }
    addEffects(tasks) {
      for (const task of tasks) {
        this.effects.set(task.id, task);
      }
    }
    addCleanups(tasks) {
      for (const task of tasks) {
        this.effects.delete(task.id);
        this.cleanups.set(task.id, task);
      }
    }
  };

  // ../recon/hooks.ts
  var loadHooks2 = (reconciler, state, ref) => {
    function useContext2(context) {
      const stateIndex = state.hookIndex++;
      if (!state.providers.has(stateIndex)) {
        const provider2 = ref.find((ref2) => {
          const provider3 = reconciler.tree.contexts.get(ref2.id);
          if (provider3 && provider3.contextId === context.id)
            return provider3;
        });
        if (provider2) {
          provider2.consumers.set(ref.id, ref);
        }
        state.providers.set(stateIndex, provider2);
      }
      const provider = state.providers.get(stateIndex);
      if (provider)
        return provider.value;
      return context.defaultValue;
    }
    function useState2(initialValue) {
      const stateIndex = state.hookIndex++;
      if (!state.values.has(stateIndex))
        state.values.set(stateIndex, calculateValue(initialValue));
      const value = state.values.get(stateIndex);
      const setValue = (updater) => {
        if (state.unmounted)
          return;
        const prevValue = state.values.get(stateIndex);
        const nextValue = runUpdater(prevValue, updater);
        if (prevValue === nextValue)
          return;
        state.values.set(stateIndex, nextValue);
        reconciler.render(ref);
      };
      return [value, setValue];
    }
    function useEffect2(effect, deps = null) {
      const effectIndex = state.hookIndex++;
      if (!state.effects.has(effectIndex))
        state.effects.set(effectIndex, createId("EffectID"));
      const prevDeps = state.deps.get(effectIndex) || null;
      const effectId = state.effects.get(effectIndex);
      state.deps.set(effectIndex, deps);
      const depsChanges = calculateDepsChange(prevDeps, deps);
      if (depsChanges) {
        if (!state.effectTasks)
          state.effectTasks = [];
        state.effectTasks.push({
          id: effectId,
          ref,
          func() {
            const prevCleanup = state.cleanups.get(effectId);
            if (prevCleanup) {
              state.cleanups.delete(effectId);
              prevCleanup();
            }
            state.cleanups.set(effectId, effect());
          }
        });
      }
    }
    return { useContext: useContext2, useState: useState2, useEffect: useEffect2 };
  };

  // ../recon/update.ts
  var WorkTask = class _WorkTask {
    static pool = createObjectPool(
      (ref, prev, next, moved) => new _WorkTask(ref, prev, next, moved),
      (task, ref, prev, next, moved = false) => {
        task.ref = ref;
        task.prev = prev;
        task.next = next;
        task.moved = moved;
      }
    );
    /**
     * The commit that should evaluate this
     * update (if this commit does not exist,
     * it should use this as it's ID and Path).
     * */
    ref;
    /** If null, this update should cause
     * this commit to be created */
    prev;
    /** If null, this update should cause
     * this commit to be removed
     */
    next;
    // TODO: maybe expose prev/next index information?
    moved;
    constructor(ref, prev, next, moved = false) {
      this.ref = ref;
      this.prev = prev;
      this.next = next;
      this.moved = moved;
    }
    free() {
      _WorkTask.pool.release(this);
    }
    static new(ref, prev, next, moved = false) {
      return this.pool.acquire(ref, prev, next, moved);
    }
    static fresh(ref, next) {
      return _WorkTask.new(ref, null, next);
    }
    static existing(prev, next) {
      return _WorkTask.new(prev.ref, prev, next);
    }
    static move(prev, next) {
      return _WorkTask.new(prev.ref, prev, next, true);
    }
    static remove(prev) {
      return _WorkTask.new(prev.ref, prev, null);
    }
    static visit(prev) {
      return _WorkTask.new(prev.ref, prev, prev.element);
    }
  };
  var keyedElementEqualityTest2 = (prev, next, prev_index, next_index) => {
    const compatible = prev.element.type === next.type || prev.element.type === specialNodeTypes.placeholder;
    if (!compatible)
      return false;
    const prevKey = prev.element.props.key;
    const nextKey = next.props.key;
    if (prevKey || nextKey)
      return prevKey === nextKey;
    return prev_index === next_index;
  };

  // ../recon/internal.ts
  var useInternalComponentState = () => {
    return internalHookImplementations.useInternalComponentState();
  };
  var internalHookImplementations = {
    useInternalComponentState() {
      throw new UnsetHookImplementation();
    }
  };

  // ../recon/element.ts
  var ElementOutput2 = class {
    element = null;
    ref;
    children = [];
    prevChildren = null;
    childRefs = [];
    /**
     * Processing an element of some kind often
     * implies changes to it's children: the Output
     * will produce additional tasks that a thread should enqueue.
     */
    updates = [];
    effects = null;
    cleanups = null;
    extraTargets = null;
    constructor(ref) {
      this.ref = ref;
    }
    processComponent(component, element, tree, state) {
      this.element = element;
      state.effectTasks = null;
      state.hookIndex = 0;
      if (!state.hooks)
        state.hooks = loadHooks2(tree.reconciler, state, this.ref);
      hookImplementation.useContext = state.hooks.useContext;
      hookImplementation.useEffect = state.hooks.useEffect;
      hookImplementation.useState = state.hooks.useState;
      internalHookImplementations.useInternalComponentState = () => state;
      const props = {
        ...this.element.props,
        children: this.element.children
      };
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
        state.rejection = { value: thrownValue };
        state.boundary.addThrow(this.ref, thrownValue);
        if (this.prevChildren)
          this.childRefs = this.prevChildren.map((c) => c.ref);
      }
    }
    processPrimitive(element) {
      this.element = element;
      this.setNode(this.element.children);
      this.calculateDiff();
    }
    processProvider(element, state) {
      this.element = element;
      this.setNode(this.element.children);
      if (state.value !== element.props.value) {
        state.value = element.props.value;
        this.extraTargets = [...state.consumers.values()];
      }
      this.calculateDiff();
    }
    processBoundary(element, state) {
      this.element = element;
      const fallbackElement = !!element.props.fallback && h(Fallback, {}, element.props.fallback);
      if (state.mode === "normal") {
        this.setNode([h(Suspend, { suspended: false }, this.element.children)]);
        this.calculateDiff();
      } else if (fallbackElement) {
        this.setNode([h(Suspend, { suspended: true }, this.element.children), fallbackElement]);
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
          } else {
            const prevCommit = this.prevChildren[transform];
            this.childRefs.push(prevCommit.ref);
            const moved = childIndex !== transform;
            if (moved)
              this.updates.push(WorkTask.move(prevCommit, this.children[childIndex]));
            else
              this.updates.push(WorkTask.existing(prevCommit, this.children[childIndex]));
          }
        }
        for (let removedIndex = 0; removedIndex < changes.removed.length; removedIndex++) {
          const prevCommit = this.prevChildren[changes.removed[removedIndex]];
          this.updates.push(WorkTask.remove(prevCommit));
        }
      } else if (!this.prevChildren) {
        this.updates = this.children.map((child) => WorkTask.fresh(CommitRef2.fresh(this.ref), child));
        this.childRefs = this.updates.map((c) => c.ref);
      } else {
        this.updates = this.prevChildren.map((child) => WorkTask.remove(child));
        this.childRefs = [];
      }
    }
    setNode(node) {
      this.children = convertNodeToElements(node);
    }
  };

  // ../recon/thread.ts
  var WorkThread2 = class {
    tree;
    /**
     * Each time an external system adds an update to the current thread,
     * they record the "reason", so you can trace which effects
     * cause/contributed to this thread.
     */
    reasons = [];
    /**
     * A Map of every commit that NEEDS to be rendered if you visit them.
     * This is often for commits that explicitly need a re-render because
     * they updated and are the reason for the re-render.
     */
    mustRender = /* @__PURE__ */ new Set();
    /**
     * A Set of every commit that NEEDS to be visited. Normally,
     * when an update is requested all the target's parents are
     * labelled "mustVisit" so any update thread should get to
     * the target eventually.
     */
    mustVisit = /* @__PURE__ */ new Set();
    /**
     * A stack of "Update" objects representing Commits (often
     * children of commits just processed)
     */
    pendingTasks = [];
    /** 
     * When a change is requested on a thread, but the target
     * commit has already been "visited", we instead put it
     * in out "missed" backlog.
     * 
     * Once a thread has completed all it's updates, it may
     * start an additional "pass", resetting itself (but not it's "DeltaSet")
     * and loading in all the missed targets as new updates.
    */
    missed = /* @__PURE__ */ new Set();
    unmountMissed = /* @__PURE__ */ new Set();
    errorNotifications = /* @__PURE__ */ new Map();
    /**
     * A list of each commit the thread processed
     */
    visited = /* @__PURE__ */ new Set();
    delta = new Delta();
    id = createId("ThreadID");
    passes = 1;
    constructor(tree) {
      this.tree = tree;
    }
    get done() {
      return this.pendingTasks.length === 0 && this.missed.size === 0;
    }
    /**
     * Add some work to be done by the thread.
     * 
     * @param reason 
     * @returns true if the Thread can accept the work, or false 
     * if the Thread has already rendered this element (you
     * have to queue it in the next thread)
     */
    queue(reason) {
      this.reasons.push(reason);
      if (reason.type === "mount") {
        this.pendingTasks.push(WorkTask.fresh(reason.ref, reason.element));
        return "new-task";
      }
      if (this.visited.has(reason.ref.id)) {
        if (reason.type === "unmount") {
          this.unmountMissed.add(reason.ref.id);
          return "missed";
        } else {
          this.missed.add(reason.ref.id);
          return "missed";
        }
      }
      if (this.mustRender.has(reason.ref.id))
        return "existing-target";
      this.mustRender.add(reason.ref.id);
      let ancestor = reason.ref;
      while (ancestor) {
        this.mustVisit.add(ancestor.id);
        for (const update of this.pendingTasks) {
          if (update.ref.id === ancestor.id) {
            return "existing-task";
          }
        }
        ancestor = ancestor.parent;
      }
      ancestor = reason.ref;
      while (ancestor) {
        if (ancestor.id !== reason.ref.id)
          this.visited.add(ancestor.id);
        ancestor = ancestor.parent;
      }
      const prev = this.tree.commits.get(reason.ref.id);
      switch (reason.type) {
        case "target":
          this.pendingTasks.push(WorkTask.visit(prev));
          break;
        case "unmount":
          this.pendingTasks.push(WorkTask.remove(prev));
          break;
      }
      return "new-task";
    }
    /**
     * Perform the work to add a fresh commit into the tree,
     * enqueuing additional work onto the thread if the commit has children.
     * 
     * @param element The element that the commit will have.
     * @param ref The location where the commit will be installed.
     */
    createCommit(element, ref) {
      const output = this.tree.processElement(element, ref, null);
      const commit = this.tree.reconciler.pools.commit.acquire(ref, element, output.childRefs);
      this.tree.commits.set(commit.ref.id, commit);
      this.delta.add(commit);
      if (commit.ref.length === 1)
        this.tree.roots.add(commit.ref.id);
      if (output.effects)
        this.delta.addEffects(output.effects);
      this.pendingTasks.push(...output.updates);
    }
    updateCommit(commit, element, moved) {
      const output = this.tree.processElement(element, commit.ref, commit);
      const oldElement = commit.element;
      commit.update(element, output.childRefs);
      this.delta.update(oldElement, commit, moved);
      this.pendingTasks.push(...output.updates);
      if (output.effects)
        this.delta.addEffects(output.effects);
    }
    removeCommit(commit) {
      const output = this.tree.unmountCommit(commit);
      this.tree.commits.delete(commit.ref.id);
      this.delta.delete(commit);
      if (commit.ref.length === 1)
        this.tree.roots.delete(commit.ref.id);
      this.pendingTasks.push(...output.updates);
      if (output.cleanups)
        this.delta.addEffects(output.cleanups);
    }
    skipCommit(commit) {
      const prevChildren = commit.children.map((c) => this.tree.commits.get(c.id));
      const updates = prevChildren.map((prev) => WorkTask.visit(prev));
      this.pendingTasks.push(...updates);
      commit.update();
    }
    visit(update) {
      this.visited.add(update.ref.id);
      if (update.next && !update.prev) {
        this.createCommit(update.next, update.ref);
      } else if (update.next && update.prev) {
        this.updateCommit(update.prev, update.next, update.moved);
      } else if (!update.next && update.prev) {
        this.removeCommit(update.prev);
      }
    }
    processTask(task) {
      const { next, prev, ref } = task;
      const identicalChange = next && prev && next.id === prev.element.id;
      if (identicalChange) {
        const mustVisit = this.mustVisit.has(ref.id);
        if (!mustVisit)
          return;
        const mustRender = this.mustRender.has(ref.id);
        if (!mustRender) {
          this.skipCommit(prev);
          return;
        }
      }
      this.visit(task);
    }
    work() {
      const task = this.pendingTasks.pop();
      if (task) {
        this.processTask(task);
        task.free();
      } else if (!this.done) {
        this.startNextPass();
      }
    }
    startNextPass() {
      this.pendingTasks = [];
      this.mustRender.clear();
      this.mustVisit.clear();
      this.visited.clear();
      this.passes++;
      const missedCommit = [...this.missed].map((id) => this.tree.commits.get(id)).filter((x) => !!x).sort((a, b) => a.ref.length - b.ref.length);
      const unmountingRefs = new Map(
        [...this.unmountMissed].map((id) => this.tree.commits.get(id)).filter((x) => !!x).map((c) => [c.ref.id, c.ref])
      );
      for (const commitRef of unmountingRefs.values()) {
        this.queue({ type: "unmount", ref: commitRef });
      }
      for (const commit of missedCommit) {
        if (commit.ref.find((ref) => unmountingRefs.has(ref.id)))
          continue;
        this.queue({ type: "target", ref: commit.ref });
      }
      this.missed.clear();
    }
  };

  // ../recon/state.ts
  var BoundaryState = class {
    tree;
    id;
    ref;
    /**
     * When the boundary is in "fallback"
     * mode, this should reference the immediate
     * fallback node that was generated.
     */
    fallbackRef = null;
    values = /* @__PURE__ */ new Map();
    get mode() {
      return this.values.size === 0 ? "normal" : "fallback";
    }
    constructor(tree, ref) {
      this.tree = tree;
      this.ref = ref;
      this.id = createId("BoundaryID");
    }
    addThrow(ref, thrownValue) {
      if (this.mode === "normal")
        this.tree.reconciler.render(this.ref);
      this.values.set(ref.id, thrownValue);
      const commit = this.tree.commits.get(this.ref.id);
      if (commit) {
        const onThrow = commit.element.props.onThrow;
        if (onThrow)
          onThrow(thrownValue, [...this.values.values()]);
      }
    }
    clearThrow(ref) {
      this.values.delete(ref.id);
      if (this.mode === "normal")
        this.tree.reconciler.render(this.ref);
      const commit = this.tree.commits.get(this.ref.id);
      if (commit) {
        const onClear = commit.element.props.onClear;
        if (onClear)
          onClear();
      }
    }
  };

  // ../recon/tree.ts
  var CommitTree2 = class {
    reconciler;
    components = /* @__PURE__ */ new Map();
    contexts = /* @__PURE__ */ new Map();
    boundaries = /* @__PURE__ */ new Map();
    commits = /* @__PURE__ */ new Map();
    roots = /* @__PURE__ */ new Set();
    constructor(reconciler) {
      this.reconciler = reconciler;
    }
    getOrCreateComponentState(ref) {
      let state = this.components.get(ref.id);
      if (!state) {
        state = {
          unmounted: false,
          ref,
          hookIndex: 0,
          rejection: null,
          boundary: null,
          hooks: null,
          effectTasks: [],
          cleanups: /* @__PURE__ */ new Map(),
          providers: /* @__PURE__ */ new Map(),
          values: /* @__PURE__ */ new Map(),
          deps: /* @__PURE__ */ new Map(),
          effects: /* @__PURE__ */ new Map()
        };
        this.components.set(ref.id, state);
      }
      return state;
    }
    getOrCreateProviderState(ref, element) {
      let state = this.contexts.get(ref.id);
      if (!state) {
        state = {
          id: ref.id,
          contextId: element.props.id,
          value: element.props.value,
          consumers: /* @__PURE__ */ new Map()
        };
        this.contexts.set(ref.id, state);
      }
      return state;
    }
    getOrCreateBoundaryState(ref) {
      let state = this.boundaries.get(ref.id);
      if (!state) {
        state = new BoundaryState(this, ref);
        this.boundaries.set(ref.id, state);
      }
      return state;
    }
    findClosestBoundary(ref) {
      let ancestor = ref;
      let lastAncestor = null;
      while (ancestor) {
        const state = this.boundaries.get(ancestor.id);
        if (state) {
          if (state.mode === "fallback" && state.fallbackRef) {
            if (lastAncestor && lastAncestor.id === state.fallbackRef.id) {
              lastAncestor = ancestor;
              ancestor = ancestor.parent;
              continue;
            }
          }
          return state;
        }
        lastAncestor = ancestor;
        ancestor = ancestor.parent;
      }
    }
    unmountCommit(prev) {
      const output = new ElementOutput2(prev.ref);
      output.prevChildren = prev.children.map((c) => this.commits.get(c.id));
      switch (typeof prev.element.type) {
        case "symbol": {
          switch (prev.element.type) {
            case specialNodeTypes.provider:
              this.contexts.delete(prev.ref.id);
              break;
            case specialNodeTypes.boundary:
              this.boundaries.delete(prev.ref.id);
              break;
          }
          break;
        }
        case "function": {
          const componentState = this.components.get(prev.ref.id);
          componentState.unmounted = true;
          for (const provider of componentState.providers.values()) {
            if (provider)
              provider.consumers.delete(prev.ref.id);
          }
          if (componentState.boundary && componentState.rejection) {
            componentState.boundary.clearThrow(prev.ref);
          }
          output.cleanups = [];
          for (const [index, cleanup] of componentState.cleanups) {
            if (!cleanup)
              continue;
            const id = componentState.effects.get(index);
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
    processElement(element, ref, commit) {
      const output = new ElementOutput2(ref);
      if (commit)
        output.prevChildren = commit.children.map((c) => this.commits.get(c.id));
      switch (typeof element.type) {
        case "string":
          output.processPrimitive(element);
          break;
        case "symbol": {
          switch (element.type) {
            case specialNodeTypes.provider: {
              const state = this.getOrCreateProviderState(ref, element);
              output.processProvider(element, state);
              break;
            }
            case specialNodeTypes.boundary: {
              const state = this.getOrCreateBoundaryState(ref);
              output.processBoundary(element, state);
              break;
            }
            case specialNodeTypes.render:
            default:
              output.processPrimitive(element);
              break;
          }
          break;
        }
        case "function": {
          const state = this.getOrCreateComponentState(ref);
          output.processComponent(element.type, element, this, state);
          break;
        }
      }
      return output;
    }
  };

  // ../recon/reconciler.ts
  var Reconciler2 = class {
    tree;
    scheduler;
    bus = {
      render: () => {
      }
    };
    // in the future - maybe more than one thread?
    thread;
    pools = {
      commit: Commit2.pool()
    };
    constructor(scheduler) {
      this.scheduler = scheduler;
      this.tree = new CommitTree2(this);
      this.thread = new WorkThread2(this.tree);
      this.scheduler.setCallbackFunc(() => this.work());
      this.pools.commit.maxSize = 2048;
    }
    submitThread() {
      const currentThread = this.thread;
      this.thread = new WorkThread2(this.tree);
      this.running = false;
      this.bus.render(currentThread.delta);
      for (const cleanup of currentThread.delta.cleanups.values())
        cleanup.func();
      for (const effect of currentThread.delta.effects.values())
        effect.func();
      for (const remove of currentThread.delta.removed.values())
        this.pools.commit.release(remove);
    }
    work() {
      if (!this.thread.done) {
        this.thread.work();
        this.scheduler.requestCallback();
      } else {
        this.submitThread();
      }
    }
    running = false;
    mount(node) {
      const element = convertNodeToElement(node);
      const ref = CommitRef2.fresh(null);
      this.thread.queue({ type: "mount", ref, element });
      this.scheduler.requestCallback();
      return ref;
    }
    unmount(ref) {
      this.thread.queue({ type: "unmount", ref });
      this.scheduler.requestCallback();
    }
    render(ref) {
      this.thread.queue({ type: "target", ref });
      this.scheduler.requestCallback();
    }
  };

  // ../renderers/web/ssr.ts
  var deserializeSSRPayload = (payload, mode, readyForServer) => {
    return {
      contextCommitID: payload.contextCommitID,
      mode,
      readyForServer,
      commits: new Map(payload.commits.map((c) => [c.id, c])),
      mounts: payload.mounts,
      components: new Map(payload.components.map((c) => [c.id, {
        id: c.id,
        values: new Map(c.values),
        deps: new Map(c.deps)
      }])),
      contexts: new Map(payload.contexts)
    };
  };
  var SSRContext = createContext(null);
  var useSSRComponentState = (data, state) => {
    return useMemo(() => {
      let ssrComponentState = data.components.get(state.ref.id);
      if (!ssrComponentState) {
        ssrComponentState = {
          id: state.ref.id,
          values: /* @__PURE__ */ new Map(),
          deps: /* @__PURE__ */ new Map()
        };
        data.components.set(state.ref.id, ssrComponentState);
      }
      return ssrComponentState;
    }, []);
  };
  var ssr = {
    useState(initialValue) {
      const state = useInternalComponentState();
      const ssrData = ssr.useSSRContext();
      const ssrComponentState = useSSRComponentState(ssrData, state);
      const hookIndex = state.hookIndex;
      const initialServerValue = useMemo(() => {
        if (ssrData.mode === "server")
          return initialValue;
        if (!ssrComponentState.values.has(hookIndex))
          return initialValue;
        return ssrComponentState.values.get(hookIndex);
      }, []);
      const [value, innerSetter] = useState(initialServerValue);
      const setter = useMemo(() => {
        if (ssrData.mode === "client")
          return innerSetter;
        return (updater) => {
          innerSetter((prevValue) => {
            const nextValue = runUpdater(prevValue, updater);
            ssrComponentState.values.set(hookIndex, nextValue);
            return nextValue;
          });
        };
      }, []);
      return [value, setter];
    },
    useEffect(effect, deps) {
      const liveState = useInternalComponentState();
      const ssrData = ssr.useSSRContext();
      const ssrComponentState = useSSRComponentState(ssrData, liveState);
      const hookIndex = liveState.hookIndex;
      let firstRun = useRef(true);
      useMemo(() => {
        if (ssrData.mode === "client")
          return;
        ssrComponentState.deps.set(hookIndex, deps);
      }, deps);
      useEffect(() => {
        if (!firstRun.current || ssrData.mode === "server")
          return effect();
        firstRun.current = false;
        const prevDeps = ssrComponentState.deps.get(hookIndex);
        if (!prevDeps || calculateDepsChange(prevDeps, deps)) {
          return effect();
        }
      }, deps);
    },
    // This needs special rehydration efforts to restore
    createContext(defaultValue) {
      const innerContext = createContext(defaultValue);
      return {
        ...innerContext,
        Provider({ value, children }) {
          const liveState = useInternalComponentState();
          const ssrData = ssr.useSSRContext();
          useMemo(() => {
            if (ssrData.mode === "client")
              return;
            ssrData.contexts.set(liveState.ref.id, value);
          }, [value]);
          return h(specialNodeTypes.provider, { id: innerContext.id, value }, children);
        }
      };
    },
    useSSRReady() {
      const ssrData = ssr.useSSRContext();
      return ssrData.readyForServer;
    },
    useSSRContext() {
      const ssrContext = useContext(SSRContext);
      if (!ssrContext)
        throw new Error("Missing SSR Bundle Context!");
      return ssrContext;
    }
  };
  var ssrStringToSymbolMap = {
    "primitive:string": primitiveNodeTypes.string,
    "primitive:number": primitiveNodeTypes.number,
    "primitive:null": primitiveNodeTypes.null,
    "primitive:boolean": primitiveNodeTypes.boolean,
    "primitive:array": primitiveNodeTypes.array,
    [primitiveNodeTypes.string]: "primitive:string",
    [primitiveNodeTypes.number]: "primitive:number",
    [primitiveNodeTypes.null]: "primitive:null",
    [primitiveNodeTypes.boolean]: "primitive:boolean",
    [primitiveNodeTypes.array]: "primitive:array",
    "special:placeholder": specialNodeTypes.placeholder,
    "special:boundary": specialNodeTypes.boundary,
    "special:fallback": specialNodeTypes.fallback,
    "special:provider": specialNodeTypes.provider,
    "special:suspend": specialNodeTypes.suspend,
    "special:render": specialNodeTypes.render,
    [specialNodeTypes.placeholder]: "special:placeholder",
    [specialNodeTypes.boundary]: "special:boundary",
    [specialNodeTypes.fallback]: "special:fallback",
    [specialNodeTypes.provider]: "special:provider",
    [specialNodeTypes.suspend]: "special:suspend",
    [specialNodeTypes.render]: "special:render"
  };
  var ssrSymbolToStringMap = Object.fromEntries(Object.entries(ssrStringToSymbolMap).map(([key, value]) => [value, key]));

  // ../renderers/web/rehydrate.ts
  var rehydrate = (targets, reconciler, space, payload) => {
    const context = deserializeSSRPayload(payload, "client", () => {
    });
    const refs = /* @__PURE__ */ new Map();
    const elements = /* @__PURE__ */ new Map();
    const roots = [];
    const targetRefs = [];
    for (const commit of context.commits.values()) {
      const ref = CommitRef2.rehydrate(createId("CommitID"), commit.distance);
      refs.set(commit.id, ref);
      if (commit.elementType.startsWith("special:mount:")) {
        const targetName = commit.elementType.slice("special:mount:".length);
        const target = targets[targetName];
        const props = Object.fromEntries(commit.props);
        const element = h(target, props);
        elements.set(commit.id, element);
        targetRefs.push(ref);
      } else {
        const elementType = ssrStringToSymbolMap[commit.elementType] || commit.elementType || specialNodeTypes.placeholder;
        switch (elementType) {
          case primitiveNodeTypes.string:
          case primitiveNodeTypes.number:
          case primitiveNodeTypes.boolean:
            elements.set(commit.id, h(primitiveNodeTypes.null));
            continue;
          case specialNodeTypes.provider:
            if (commit.id === context.contextCommitID) {
              elements.set(commit.id, h(specialNodeTypes.provider, { id: SSRContext.id, value: context }));
              reconciler.tree.contexts.set(ref.id, {
                id: ref.id,
                contextId: SSRContext.id,
                value: context,
                consumers: /* @__PURE__ */ new Map()
              });
              continue;
            }
          default:
            const props = Object.fromEntries(commit.props);
            elements.set(commit.id, h(elementType, props));
            continue;
        }
      }
    }
    for (const dehydratedCommit of context.commits.values()) {
      const ref = refs.get(dehydratedCommit.id);
      ref.parent = dehydratedCommit.parent && refs.get(dehydratedCommit.parent) || null;
      const children = dehydratedCommit.children.map((c) => refs.get(c)).filter((x) => !!x);
      const element = elements.get(dehydratedCommit.id);
      element.children = children.map((c) => elements.get(c.id));
      if (!ref.parent) {
        roots.push(ref);
      }
      const commit = reconciler.pools.commit.acquire(
        ref,
        element,
        children
      );
      const node = document.querySelector(`[data-commit-id="${dehydratedCommit.id}"]`);
      if (node instanceof HTMLElement) {
        space.nodeByCommit.set(commit.ref.id, node);
        space.commitByNode.set(node, commit);
      }
      if (commit.element.type === specialNodeTypes.render) {
        space.roots.set(commit.ref.id, commit);
      }
      reconciler.tree.commits.set(commit.ref.id, commit);
    }
    reconciler.bus.render = (delta) => {
      console.log({ delta });
      space.bus.render(delta);
    };
    for (const ref of targetRefs.sort((left, right) => left.length - right.length)) {
      reconciler.render(ref);
    }
  };

  // app.ts
  var ChildComponent = () => {
    const [clicked, setClicked] = useState(0);
    const background = `hsl(${Math.random() * 360}deg  50% 50%)`;
    function onClick() {
      setClicked((c) => c + 1);
    }
    return h("button", { style: { background }, onClick }, `Clicked ${clicked} times!`);
  };
  var App = () => {
    const [name, setName] = ssr.useState("World");
    const [beerType, setBeerType] = ssr.useState("ale");
    const [beers, setBeers] = ssr.useState([]);
    const ready = ssr.useSSRReady();
    function onInput(event) {
      setName(event.target.value);
    }
    function onBeerTypeInput(event) {
      setBeerType(event.target.value);
    }
    ssr.useEffect(() => {
      fetch(`https://api.sampleapis.com/beers/${beerType}`).then((r) => r.json()).then((payload) => setBeers(payload.map((d) => d.name)));
    }, [beerType]);
    useEffect(() => {
      if (beers.length > 0)
        ready();
    }, [beers]);
    return h("article", {}, [
      h("h1", {}, `Hello, ${name}`),
      h(ChildComponent),
      h("input", { type: "text", value: name, onInput }),
      h("select", { onInput: onBeerTypeInput }, [
        h("option", { value: "ale", selected: "ale" === beerType }, ["ale"]),
        h("option", { value: "stouts", selected: "stouts" === beerType }, "stouts")
      ]),
      h("ol", {}, beers.map((beer) => h("li", {}, beer)))
    ]);
  };

  // ../tooling/debug/utils.ts
  var getElementName = (element) => {
    if (typeof element.type === "function")
      return `<component(${element.type.name})>`;
    if (typeof element.type === "symbol")
      switch (element.type) {
        case primitiveNodeTypes.number:
          return `<number value={${element.props.value}}>`;
        case primitiveNodeTypes.string:
          return `<string value="${element.props.value}">`;
        case primitiveNodeTypes.boolean:
          return `<boolean value="${element.props.value}">`;
        case primitiveNodeTypes.array:
          return `<array>`;
        case primitiveNodeTypes.null:
          return `<null>`;
        case specialNodeTypes.fallback:
          return `<fallback>`;
        case specialNodeTypes.suspend:
          return `<suspend>`;
        case specialNodeTypes.render:
          return `<render type="${element.props.type}">`;
        case specialNodeTypes.provider:
          return `<context id="${element.props.id}">`;
        case specialNodeTypes.boundary:
          return `<boundary>`;
        default:
          return `<symbol>`;
      }
    if (element.type)
      return `<${element.type}>`;
    return "<none>";
  };

  // ../tooling/debug/report.ts
  var createValueReport = (value) => {
    switch (typeof value) {
      case "string":
      case "number":
      case "boolean":
        return { type: "primitive", value };
      case "bigint":
        return { type: "complex", name: `bigint(${value.toString()})` };
      case "object":
        if (!value)
          return { type: "primitive", value };
        if (value.constructor)
          return { type: "complex", name: value.constructor.name };
        return { type: "complex", name: "???" };
      case "function":
        return { type: "complex", name: `function(${value.name})` };
      case "symbol":
        return { type: "complex", name: value.description || "symbol" };
      case "undefined":
        return { type: "undefined" };
    }
  };
  var createCommitDetailsReport = (commit, tree) => {
    const props = {};
    for (const key in commit.element.props) {
      props[key] = createValueReport(commit.element.props[key]);
    }
    const componentState = tree.components.get(commit.ref.id);
    const component = componentState && {
      stateValues: [...componentState.values.entries()].map(([hookIndex, value]) => ({
        hookIndex,
        value: createValueReport(value)
      }))
    } || null;
    return {
      commit: createCommitReport(commit),
      props,
      component
    };
  };
  var createElementReport = (element) => {
    return {
      id: element.id,
      //props: Object.entries(element.props).map(([name, value]) => [name, createValueReport(value)])
      type: getElementName(element)
    };
  };
  var createCommitReport = (commit) => {
    return {
      id: commit.ref.id,
      parent: commit.ref.parent ? commit.ref.parent.id : null,
      distance: commit.ref.length,
      element: createElementReport(commit.element),
      version: commit.version,
      children: commit.children.map((child) => child.id)
    };
  };
  var createDeltaReport = (delta) => {
    const report = {
      created: [],
      removed: [],
      updated: []
    };
    for (const commit of delta.fresh.values())
      report.created.push(createCommitReport(commit));
    for (const { next } of delta.changed.values())
      report.updated.push(createCommitReport(next));
    for (const commit of delta.removed.values())
      report.removed.push(createCommitReport(commit));
    return report;
  };
  var createWorkTaskReport = (task) => {
    return {
      element: task.next && createElementReport(task.next),
      prev: task.prev && createCommitReport(task.prev),
      moved: task.moved,
      parent: task.ref.parent && task.ref.parent.id,
      id: task.ref.id
    };
  };
  var createWorkReasonReport = (reason) => {
    if (reason.type === "mount")
      return { target: reason.ref.id, element: createElementReport(reason.element) };
    return { target: reason.ref.id, element: null };
  };
  var createThreadReport = (thread) => {
    return {
      visited: [...thread.visited],
      mustVisit: [...thread.mustVisit],
      mustRender: [...thread.mustRender],
      missed: [...thread.missed],
      pendingTasks: thread.pendingTasks.map(createWorkTaskReport),
      reasons: thread.reasons.map(createWorkReasonReport),
      id: thread.id,
      passes: thread.passes,
      done: thread.done
    };
  };
  var createTreeReport = (tree) => {
    const report = { commits: [], roots: [] };
    for (const commit of tree.commits.values()) {
      report.commits.push(createCommitReport(commit));
    }
    for (const root of tree.roots) {
      report.roots.push(root);
    }
    return report;
  };

  // ../tooling/debug/scheduler.ts
  var createDebugScheduler = (events, schedulerName = "Scheduler") => {
    let callbackFunc = () => {
    };
    let pending_callback = false;
    const run = (maxWork = 1e4) => {
      let workCount = 0;
      const startMark = performance.mark(`${schedulerName}:work:start`);
      while (pending_callback && workCount < maxWork) {
        pending_callback = false;
        callbackFunc();
        events.onAfterCallbackExecute();
        workCount++;
        if (controller.intercept === true)
          return events.onInterceptStart();
      }
      const endMark = performance.mark(`${schedulerName}:work:end`);
      const measurement = performance.measure(`${schedulerName}:work(${workCount})`, startMark.name, endMark.name);
      if (pending_callback) {
        timeoutId = window.setTimeout(onTimeout, 0);
      } else
        timeoutId = null;
    };
    const controller = {
      intercept: false,
      cancelIntercept() {
        controller.intercept = false;
        events.onInterceptEnd();
        run();
      },
      step(stride = 1) {
        run(stride);
        if (!pending_callback) {
          events.onInterceptEnd();
          timeoutId = null;
        }
      }
    };
    const onTimeout = () => {
      if (controller.intercept) {
        events.onInterceptStart();
      } else {
        run();
      }
    };
    let timeoutId = null;
    return {
      controller,
      setCallbackFunc(callback) {
        callbackFunc = callback;
      },
      requestCallback() {
        pending_callback = true;
        if (!timeoutId)
          timeoutId = window.setTimeout(onTimeout, 0);
      },
      cancelCallback() {
        pending_callback = false;
        if (timeoutId) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
      },
      isCallbackPending() {
        return pending_callback;
      }
    };
  };

  // ../tooling/debug/reconciler.ts
  var DebugReconciler = class extends Reconciler2 {
    controller;
    debugBus;
    started = false;
    constructor() {
      const debugBus = {
        scheduler: {
          onAfterCallbackExecute() {
          },
          onInterceptStart() {
          },
          onInterceptEnd() {
          }
        },
        thread: {
          onQueue() {
          },
          onStartPass() {
          },
          onWork() {
          },
          onRender() {
          }
        },
        onThreadDone() {
        }
      };
      const scheduler = createDebugScheduler(debugBus.scheduler);
      super(scheduler);
      this.debugBus = debugBus;
      const me = this;
      this.controller = {
        scheduler: scheduler.controller,
        getTree() {
          return createTreeReport(me.tree);
        },
        getThread() {
          return createThreadReport(me.thread);
        },
        getDelta() {
          return createDeltaReport(me.thread.delta);
        },
        getDetails(commitId) {
          const commit = me.tree.commits.get(commitId);
          if (!commit)
            return null;
          return createCommitDetailsReport(commit, me.tree) || null;
        }
      };
      this.thread = new DebugWorkThread(this.tree, debugBus.thread);
    }
    submitThread() {
      const submittedThread = this.thread;
      const { id, visited, passes } = submittedThread;
      this.started = false;
      const delta = createDeltaReport(submittedThread.delta);
      this.debugBus.onThreadDone(createThreadReport(submittedThread), delta);
      this.thread = new DebugWorkThread(this.tree, this.debugBus.thread);
      this.running = false;
      this.bus.render(submittedThread.delta);
      for (const cleanup of submittedThread.delta.cleanups.values())
        cleanup.func();
      for (const effect of submittedThread.delta.effects.values())
        effect.func();
      for (const remove of submittedThread.delta.removed.values())
        this.pools.commit.release(remove);
      performance.mark(`reconciler:thread(${id}):end`);
      performance.measure(
        `reconciler:thread(${id}, visited=${visited.size})`,
        `reconciler:thread(${id}):start`,
        `reconciler:thread(${id}):end`
      );
      console.info(`[Reconciler] Thread ${id} visited ${visited.size} nodes, in ${passes} passes`);
    }
    mount(node) {
      if (!this.started) {
        this.started = true;
        performance.mark(`reconciler:thread(${this.thread.id}):start`);
      }
      return super.mount(node);
    }
    unmount(ref) {
      if (!this.started) {
        this.started = true;
        performance.mark(`reconciler:thread(${this.thread.id}):start`);
      }
      return super.unmount(ref);
    }
    render(ref) {
      if (!this.started) {
        this.started = true;
        performance.mark(`reconciler:thread(${this.thread.id}):start`);
      }
      super.render(ref);
    }
  };
  var DebugWorkThread = class extends WorkThread2 {
    debugBus;
    constructor(tree, debugBus) {
      super(tree);
      this.debugBus = debugBus;
    }
    work() {
      const prevTask = this.pendingTasks[this.pendingTasks.length - 1];
      super.work();
      const nextTask = this.pendingTasks[this.pendingTasks.length - 1];
      this.debugBus.onWork(
        prevTask && createWorkTaskReport(prevTask) || null,
        nextTask && createWorkTaskReport(nextTask) || null,
        this.done
      );
    }
    queue(reason) {
      const result = super.queue(reason);
      this.debugBus.onQueue(createWorkReasonReport(reason), result);
      return result;
    }
    startNextPass() {
      super.startNextPass();
      this.debugBus.onStartPass();
    }
  };

  // client.ts
  var main = async () => {
    const dataElement = document.getElementById("SSR-DATA");
    const rootElement = document.getElementById("SSR-ROOT");
    if (!dataElement || !rootElement)
      return;
    const payload = JSON.parse(dataElement.innerText);
    const reconciler = new DebugReconciler();
    const space = new RenderSpace2(reconciler.tree, createWebNodeBuilder(rootElement));
    console.log("Rehydrating");
    rehydrate({ App }, reconciler, space, payload);
  };
  main();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vY29yZS9lcnJvcnMudHMiLCAiLi4vY29yZS9ob29rcy50cyIsICIuLi9jb3JlL2lkLnRzIiwgIi4uL2NvcmUvZWxlbWVudC50cyIsICIuLi9jb3JlL2NvbnRleHQudHMiLCAiLi4vY29yZS9ub2RlLnRzIiwgIi4uL2NvcmUvc3BlY2lhbC50cyIsICIuLi9jb3JlL21vZC50cyIsICIuLi9yZW5kZXJlcnMvd2ViL3Byb3BzLnRzIiwgIi4uL3JlbmRlcmVycy93ZWIvc3BhY2UudHMiLCAiLi4vcmVuZGVyZXJzL2JhY2tzdGFnZS9zcGFjZTIudHMiLCAiLi4vcmVjb24vYWxnb3JpdGhtcy50cyIsICIuLi9yZWNvbi9wb29sLnRzIiwgIi4uL3JlY29uL2NvbW1pdC50cyIsICIuLi9yZWNvbi9kZWx0YS50cyIsICIuLi9yZWNvbi9ob29rcy50cyIsICIuLi9yZWNvbi91cGRhdGUudHMiLCAiLi4vcmVjb24vaW50ZXJuYWwudHMiLCAiLi4vcmVjb24vZWxlbWVudC50cyIsICIuLi9yZWNvbi90aHJlYWQudHMiLCAiLi4vcmVjb24vc3RhdGUudHMiLCAiLi4vcmVjb24vdHJlZS50cyIsICIuLi9yZWNvbi9yZWNvbmNpbGVyLnRzIiwgIi4uL3JlbmRlcmVycy93ZWIvc3NyLnRzIiwgIi4uL3JlbmRlcmVycy93ZWIvcmVoeWRyYXRlLnRzIiwgImFwcC50cyIsICIuLi90b29saW5nL2RlYnVnL3V0aWxzLnRzIiwgIi4uL3Rvb2xpbmcvZGVidWcvcmVwb3J0LnRzIiwgIi4uL3Rvb2xpbmcvZGVidWcvc2NoZWR1bGVyLnRzIiwgIi4uL3Rvb2xpbmcvZGVidWcvcmVjb25jaWxlci50cyIsICJjbGllbnQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImV4cG9ydCBjbGFzcyBNYWdpY0Vycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihgQWRkaXRpb25hbCBtYWdpYyBpcyBuZWVkZWQgdG8gYmUgYWJsZSB0byBydW4gdGhpcyBmdW5jdGlvbmApO1xuICB9XG59XG5cblxuY29uc3QgdW5zZXRIb29rVGV4dCA9XG5gXG5BIGhvb2sgd2FzIHJ1biwgYnV0IGl0IGRpZG50IGhhdmUgYW55IGltcGxlbWVudGF0aW9ucyBzZXQgdXAgZm9yIGl0LlxuXG5UaGlzIGVycm9yIG1pZ2h0IGJlIGNhdXNlZCBieSBtYW51YWxseSBjYWxsaW5nIGEgY29tcG9uZW50IGZ1bmN0aW9uXG4ob3IgYSBob29rIGRpcmVjdGx5KSBvdXRzaWRlIG9mIGFjdCwgb3IgYnkgbXVsdGlwbGUgY29waWVzIG9mXG5BY3QgaW4gYSBwcm9qZWN0IGF0IG9uY2UhXG5cblRoZSByZW5kZXJlciBpcyBzdXBwb3NlZCB0byBzZXQgdXAgaW1wbGVtZW50YXRpb24gZm9yIGVhY2ggaG9vayBiZWZvcmVcbml0IHJ1bnMgdGhlIGNvbXBvbmVudC5cblxuQ2hlY2sgdGhlIGxvY2F0aW9uIG9mIHRoaXMgZXJyb3IsIGFuZCB3aGljaCB2ZXJzaW9uIG9mIGFjdCB5b3VyXG5yZW5kZXJlciB1c2VzIGludGVybmFseS4gWW91IG1pZ2h0IGdldCB0aGlzIGVycm9yIGlmIHRob3NlIGFyZSB0d29cbmRpZmZlcmVudCBwYWNrYWdlcyFcbmAudHJpbSgpO1xuXG5leHBvcnQgY2xhc3MgVW5zZXRIb29rSW1wbGVtZW50YXRpb24gZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKHVuc2V0SG9va1RleHQpO1xuICB9XG59XG5cblxuY29uc3QgdW5rbm93bkVsZW1lbnRUZXh0ID1cbmBcbkVuY291bnRlcmVkIGFuIG9iamVjdCB0aGF0IGlzIG5vdCBhbnkgb2YgdGhlIGV4cGVjdGVkIG5vZGUgdHlwZXMsIGxpa2VcbnN0cmluZywgbnVtYmVyLCBib29sZWFuLCBhcnJheSwgbnVsbCwgb3IgdGhlIHJlc3VsdCBvZiBhIGNhbGwgdG8gY3JlYXRlRWxlbWVudC5cblxuTWF5YmUgc29tZXRoaW5nIHdhcyBhY2NpZGVudGFsbHkgcmV0dXJuZWQgZnJvbSBhIENvbXBvbmVudCwgb3Igd2FzIHBhc3NlZFxuYXMgYSBjaGlsZCB0byBhbiBlbGVtZW50P1xuYC50cmltKCk7XG5leHBvcnQgY2xhc3MgVW5rbm93bkVsZW1lbnRUeXBlIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcih1bmtub3duRWxlbWVudFRleHQpXG4gIH1cbn0iLCAiaW1wb3J0IHsgQ29udGV4dCB9IGZyb20gXCIuL2NvbnRleHQudHNcIjtcbmltcG9ydCB7IFVuc2V0SG9va0ltcGxlbWVudGF0aW9uIH0gZnJvbSBcIi4vZXJyb3JzLnRzXCI7XG5cbmV4cG9ydCB0eXBlIEhvb2tJbXBsZW1lbnRhdGlvbiA9IHtcbiAgdXNlU3RhdGU6IHR5cGVvZiB1c2VTdGF0ZTtcbiAgdXNlRWZmZWN0OiB0eXBlb2YgdXNlRWZmZWN0O1xuICB1c2VDb250ZXh0OiB0eXBlb2YgdXNlQ29udGV4dDtcbn07XG5jb25zdCBwbGFjZWhvbGRlckltcGxlbWVudGF0aW9uID0gKCkgPT4ge1xuICB0aHJvdyBuZXcgVW5zZXRIb29rSW1wbGVtZW50YXRpb24oKTtcbn07XG5leHBvcnQgY29uc3QgaG9va0ltcGxlbWVudGF0aW9uOiBIb29rSW1wbGVtZW50YXRpb24gPSB7XG4gIHVzZVN0YXRlOiBwbGFjZWhvbGRlckltcGxlbWVudGF0aW9uLFxuICB1c2VFZmZlY3Q6IHBsYWNlaG9sZGVySW1wbGVtZW50YXRpb24sXG4gIHVzZUNvbnRleHQ6IHBsYWNlaG9sZGVySW1wbGVtZW50YXRpb24sXG59O1xuXG5leHBvcnQgdHlwZSBEZXBzID0gdW5rbm93bltdIHwgbnVsbDtcbmV4cG9ydCB0eXBlIFZhbHVlT3JDYWxjdWxhdG9yPFQ+ID1cbiAgfCBFeGNsdWRlPFQsICguLi5hcmdzOiB1bmtub3duW10pID0+IHVua25vd24+XG4gIHwgKCgpID0+IFQpO1xuXG5leHBvcnQgY29uc3QgY2FsY3VsYXRlVmFsdWUgPSA8VD4oXG4gIHZhbHVlT3JDYWxjdWxhdG9yOiBWYWx1ZU9yQ2FsY3VsYXRvcjxUPlxuKTogVCA9PiB7XG4gIGlmICh0eXBlb2YgdmFsdWVPckNhbGN1bGF0b3IgPT09IFwiZnVuY3Rpb25cIilcbiAgICByZXR1cm4gKHZhbHVlT3JDYWxjdWxhdG9yIGFzICgpID0+IFQpKCk7XG4gIHJldHVybiB2YWx1ZU9yQ2FsY3VsYXRvcjtcbn07XG5leHBvcnQgY29uc3QgY2FsY3VsYXRlRGVwc0NoYW5nZSA9IChwcmV2OiBEZXBzLCBuZXh0OiBEZXBzKSA9PiB7XG4gIGlmICghcHJldiB8fCAhbmV4dCkgcmV0dXJuIHRydWU7XG4gIHJldHVybiAoXG4gICAgcHJldi5sZW5ndGggIT09IG5leHQubGVuZ3RoIHx8IHByZXYuc29tZSgodmFsdWUsIGkpID0+IHZhbHVlICE9PSBuZXh0W2ldKVxuICApO1xufTtcbmV4cG9ydCBjb25zdCBydW5VcGRhdGVyID0gPFQ+KFxuICBwcmV2OiBULFxuICB1cGRhdGVyOiBVcGRhdGVyPFQ+XG4pOiBUID0+IHtcbiAgaWYgKHR5cGVvZiB1cGRhdGVyID09PSBcImZ1bmN0aW9uXCIpXG4gICAgcmV0dXJuICh1cGRhdGVyIGFzIChwcmV2OiBUKSA9PiBUKShwcmV2KTtcbiAgcmV0dXJuIHVwZGF0ZXI7XG59O1xuXG4vKipcbiAqIFVzZSBTdGF0ZVxuICpcbiAqIFN0b3JlIGEgdmFsdWUgaW5zaWRlIHRoZSBjb21wb25lbnQgc3RhdGUsIGFuZCBhcXVpcmVcbiAqIGFuZCBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIHVwZGF0ZSB0aGF0IHZhbHVlLFxuICogdHJpZ2dlciBhIHJlLXJlbmRlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHVzZVN0YXRlID0gPFQ+KFxuICBpbml0aWFsVmFsdWU6IFZhbHVlT3JDYWxjdWxhdG9yPFQ+XG4pOiBbVCwgU3RhdGVTZXR0ZXI8VD5dID0+IHtcbiAgcmV0dXJuIGhvb2tJbXBsZW1lbnRhdGlvbi51c2VTdGF0ZShpbml0aWFsVmFsdWUpO1xufTtcbmV4cG9ydCB0eXBlIFN0YXRlU2V0dGVyPFQ+ID0gKHVwZGF0ZXI6IFVwZGF0ZXI8VD4pID0+IHZvaWQ7XG5leHBvcnQgdHlwZSBVcGRhdGVyPFQ+ID0gVCB8ICgocHJldjogVCkgPT4gVCk7XG5cbi8qKlxuICogVXNlIEVmZmVjdFxuICpcbiAqIFBhc3NpbmcgYSBmdW5jdGlvbiBpbnRvIHRoaXMgaG9vayBjYXVzZXMgaXQgdG8gYmUgcnVuIGFmdGVyXG4gKiBhIHJlbmRlciBhcyBhICoqc2lkZSBlZmZlY3QqKi4gWW91IGRlZmluZSBfd2hpY2hfIHJlbmRlcnMgdGhpc1xuICogc2lkZSBlZmZlY3QgdHJpZ2dlcnMgdmlhIHNlY29uZCBhcmd1bWVudCwgYSAqKkRlcHMqKiBhcnJheS5cbiAqL1xuZXhwb3J0IGNvbnN0IHVzZUVmZmVjdCA9IChlZmZlY3Q6IEVmZmVjdENvbnN0cnVjdG9yLCBkZXBzOiBEZXBzID0gW10pOiB2b2lkID0+IHtcbiAgcmV0dXJuIGhvb2tJbXBsZW1lbnRhdGlvbi51c2VFZmZlY3QoZWZmZWN0LCBkZXBzKTtcbn07XG5leHBvcnQgdHlwZSBFZmZlY3RDb25zdHJ1Y3RvciA9ICgpID0+IEVmZmVjdENsZWFudXA7XG5leHBvcnQgdHlwZSBFZmZlY3RDbGVhbnVwID0gdm9pZCB8ICgoKSA9PiB2b2lkKVxuXG4vKipcbiAqIFVzZSBDb250ZXh0XG4gKlxuICogUmV0cmlldmVzIHRoZSB2YWx1ZSB0aGF0IGEgKkNvbnRleHRQcm92aWRlciogbWF5IGhhdmUgc2V0XG4gKiBlYXJsaWVyIGluIHRoZSB0cmVlLCBvciBpZiB0aGVyZSBhcmUgbm9uZSBwcmVzZW50LFxuICogcmV0dXJucyB0aGUgY29udGV4dCdzIGRlZmF1bHQgdmFsdWUuXG4gKi9cbmV4cG9ydCBjb25zdCB1c2VDb250ZXh0ID0gPFQ+KGNvbnRleHQ6IENvbnRleHQ8VD4pOiBUID0+IHtcbiAgcmV0dXJuIGhvb2tJbXBsZW1lbnRhdGlvbi51c2VDb250ZXh0KGNvbnRleHQpO1xufTtcblxuZXhwb3J0IHR5cGUgUmVmPGluIG91dCBUPiA9IHtcbiAgY3VycmVudDogVDtcbn07XG5leHBvcnQgdHlwZSBSZWFkb25seVJlZjxvdXQgVD4gPSB7XG4gIHJlYWRvbmx5IGN1cnJlbnQ6IFQ7XG59O1xuXG5leHBvcnQgY29uc3QgcmVmU3ltYm9sID0gU3ltYm9sKCk7XG5leHBvcnQgY29uc3QgbWVtb1N5bWJvbCA9IFN5bWJvbCgpO1xuXG5leHBvcnQgY29uc3QgdXNlUmVmID0gPFQ+KGluaXRpYWxWYWx1ZTogVmFsdWVPckNhbGN1bGF0b3I8VD4pOiBSZWY8VD4gPT4ge1xuICBjb25zdCBbcmVmXSA9IHVzZVN0YXRlKCgpID0+ICh7IGN1cnJlbnQ6IGNhbGN1bGF0ZVZhbHVlKGluaXRpYWxWYWx1ZSksIFtyZWZTeW1ib2xdOiB0cnVlIH0pKTtcbiAgcmV0dXJuIHJlZjtcbn07XG5leHBvcnQgY29uc3QgdXNlTWVtbyA9IDxUPihjYWxjdWxhdGU6ICgpID0+IFQsIGRlcHM6IERlcHMpOiBUID0+IHtcbiAgY29uc3QgcHJldkRlcHMgPSB1c2VSZWYoZGVwcyk7XG4gIGNvbnN0IHZhbHVlUmVmID0gdXNlUmVmKGNhbGN1bGF0ZSk7XG5cbiAgaWYgKGNhbGN1bGF0ZURlcHNDaGFuZ2UocHJldkRlcHMuY3VycmVudCwgZGVwcykpIHtcbiAgICBwcmV2RGVwcy5jdXJyZW50ID0gZGVwcztcbiAgICB2YWx1ZVJlZi5jdXJyZW50ID0gY2FsY3VsYXRlKCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlUmVmLmN1cnJlbnQ7XG59O1xuIiwgImxldCBsYXRlc3RJZCA9IDA7XG5cbmRlY2xhcmUgY29uc3Qgb3BhcXVlVHlwZTogdW5pcXVlIHN5bWJvbDtcbmV4cG9ydCB0eXBlIE9wYXF1ZUlEPFQgZXh0ZW5kcyBzdHJpbmc+ID0gbnVtYmVyICYgeyByZWFkb25seSBbb3BhcXVlVHlwZV06IFQgfTtcblxuXG4vKipcbiAqIFByb2R1Y2VzIGEgKHJlbGF0aXZlbHkgd2l0aGluIHRoaXMgcnVudGltZSkgdW5pcXVlIGluY3JlbWVudGluZyB2YWx1ZS5cbiAqIFxuICogSWYgbmFtZXNwYWNlIGlzIHBhc3NlZCwgdGhlbiB0aGUgaW5jcmVtZW50aW5nIHZhbHVlIGlzIHVuaXF1ZSB0byB0aGVcbiAqIG5hbWVzcGFjZSAob3RoZXJ3aXNlIGlzIGdsb2JhbGx5IHNoYXJlZCB3aXRoIGFsbCBvdGhlciBpZHMpXG4gKiBcbiAqIFRoZSBcIk9wYXF1ZUlEXCIgdHlwZSBoZWxwcyBhdm9pZCBjcm9zcy1jb250YW1pbmF0aW9uIG9mIGRpZmZlcmVudCBJRCB0eXBlc1xuICogKGJlaW5nIGF1dG9tYXRpY2FsbHkgY2FzdCB0byBudW1iZXIgYW5kIHN1Y2gpIGF0IFR5cGUgdGltZSwgYnV0IHByb3ZpZGVzXG4gKiBubyBydW50aW1lIGNoZWNrcy5cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZUlkID0gPFQgZXh0ZW5kcyBzdHJpbmc+KG5hbWVzcGFjZT86IFQpOiBPcGFxdWVJRDxUPiA9PiB7XG4gIGlmIChuYW1lc3BhY2UpIHtcbiAgICBpZiAoIShuYW1lc3BhY2UgaW4gbmFtZXNwYWNlcykpXG4gICAgICBuYW1lc3BhY2VzW25hbWVzcGFjZV0gPSAwO1xuICAgXG4gICAgcmV0dXJuIG5hbWVzcGFjZXNbbmFtZXNwYWNlXSsrIGFzIE9wYXF1ZUlEPFQ+O1xuICB9XG4gIHJldHVybiBsYXRlc3RJZCsrIGFzIE9wYXF1ZUlEPFQ+O1xufTtcblxuY29uc3QgbmFtZXNwYWNlczogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuXG4oZ2xvYmFsVGhpcykuX19MVUtFS0FBTElNX0FDVF9HTE9CQUxfTkFNRVNQQUNFX0lEID0gbmFtZXNwYWNlcztcblxuZGVjbGFyZSBnbG9iYWwge1xuICB2YXIgX19MVUtFS0FBTElNX0FDVF9HTE9CQUxfTkFNRVNQQUNFX0lEOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+O1xufSIsICJpbXBvcnQgeyBDb21wb25lbnQsIEVtcHR5UHJvcHMgfSBmcm9tIFwiLi9jb21wb25lbnQudHNcIjtcbmltcG9ydCB7IGNyZWF0ZUlkLCBPcGFxdWVJRCB9IGZyb20gXCIuL2lkLnRzXCI7XG5pbXBvcnQgeyBQcm9wcyB9IGZyb20gXCIuL21vZC50c1wiO1xuaW1wb3J0IHsgTm9kZSB9IGZyb20gXCIuL25vZGUudHNcIjtcblxuLyoqXG4gKiBUaGlzIGlzIGEgdW5pcXVlIHZhbHVlIHRoYXQgaXMgZ2VuZXJhdGVkXG4gKiBldmVyeSB0aW1lIHlvdSBjYWxsIGNyZWF0ZUVsZW1lbnQgLSBpdFxuICogaXMgdXNlZCB0byBjb21wYXJlIHR3byBkaWZmZXJlbnQgZWxlbWVudHNcbiAqIGFuZCBxdWlja2x5IGRldGVybWluZSBpZiB0aGV5IGFyZSB0aGUgc2FtZS5cbiAqL1xuZXhwb3J0IHR5cGUgRWxlbWVudElEID0gT3BhcXVlSUQ8XCJFbGVtZW50SURcIj47XG5cbi8qKlxuICogVGhlIFwiRWxlbWVudFwiIGlzIHRoZSBmdW5kYW1lbnRhbCBidWlsZGluZ1xuICogYmxvY2sgb2YgYWN0IC0gQ29tcG9uZW50cyByZXR1cm4gYW4gRWxlbWVudFxuICogVHJlZSwgd2hpY2ggdGhlbiBldmVudHVhbGx5IGJlY29tZXMgYSB0cmVlXG4gKiBvZiBDb21taXRzLlxuICovXG5leHBvcnQgdHlwZSBFbGVtZW50ID0ge1xuICB0eXBlOiBFbGVtZW50VHlwZTtcbiAgaWQ6IEVsZW1lbnRJRDtcbiAgcHJvcHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICBjaGlsZHJlbjogTm9kZTtcbn07XG5cbmV4cG9ydCB0eXBlIEVsZW1lbnRUeXBlPFQgZXh0ZW5kcyBQcm9wcyA9IEVtcHR5UHJvcHM+ID0gbnVsbCB8IHN0cmluZyB8IHN5bWJvbCB8IENvbXBvbmVudDxUPjtcbmV4cG9ydCB0eXBlIEVsZW1lbnRLZXkgPSBzdHJpbmcgfCBudW1iZXIgfCBzeW1ib2w7XG5cbmNvbnN0IEVNUFRZX1BST1BTID0gT2JqZWN0LmZyZWV6ZSh7fSk7XG5cbi8qKlxuICogR2VuZXJhdGUgYSB1bmlxdWUgZWxlbWVudC4gRWFjaCBlbGVtZW50IGhhcyBhbiBpbnRlcm5hbFxuICogSUQgdG8gcXVpY2tseSB0ZWxsIGlmIGVsZW1lbnRzIGFyZSBkaWZmZXJlbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbGVtZW50PFR5cGUgZXh0ZW5kcyBFbGVtZW50VHlwZTxhbnk+PihcbiAgdHlwZTogVHlwZSxcbiAgcHJvcHM6IFR5cGUgZXh0ZW5kcyBFbGVtZW50VHlwZTxpbmZlciBYPiA/IFggJiB7IGtleT86IEVsZW1lbnRLZXkgfSA6IG5ldmVyLFxuICBjaGlsZHJlbj86IE5vZGVcbik6IEVsZW1lbnQ7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRWxlbWVudChcbiAgdHlwZTogc3RyaW5nIHwgc3ltYm9sLFxuICBwcm9wcz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+ICYgeyBrZXk/OiBFbGVtZW50S2V5IH0sXG4gIGNoaWxkcmVuPzogTm9kZVxuKTogRWxlbWVudDtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbGVtZW50PFR5cGUgZXh0ZW5kcyBDb21wb25lbnQ8RW1wdHlQcm9wcz4+KFxuICB0eXBlOiBUeXBlLFxuICBwcm9wcz86IHsga2V5PzogRWxlbWVudEtleSB9LFxuICBjaGlsZHJlbj86IE5vZGVcbik6IEVsZW1lbnQ7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRWxlbWVudChcbiAgdHlwZTogRWxlbWVudFR5cGUsXG4gIHByb3BzPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gJiB7IGtleT86IEVsZW1lbnRLZXkgfSxcbiAgY2hpbGRyZW46IE5vZGUgPSBbXVxuKTogRWxlbWVudCB7XG4gIHJldHVybiB7XG4gICAgaWQ6IGNyZWF0ZUlkKFwiRWxlbWVudElEXCIpLFxuICAgIHR5cGUsXG4gICAgcHJvcHM6IHByb3BzIHx8IEVNUFRZX1BST1BTLFxuICAgIGNoaWxkcmVuLFxuICB9IGFzIEVsZW1lbnQ7XG59XG5cbmV4cG9ydCBjb25zdCBoID0gY3JlYXRlRWxlbWVudDtcbiIsICJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi9jb21wb25lbnQudHNcIjtcbmltcG9ydCB7IGggfSBmcm9tIFwiLi9lbGVtZW50LnRzXCI7XG5pbXBvcnQgeyBNYWdpY0Vycm9yIH0gZnJvbSBcIi4vZXJyb3JzLnRzXCI7XG5pbXBvcnQgeyBPcGFxdWVJRCwgY3JlYXRlSWQgfSBmcm9tIFwiLi9pZC50c1wiO1xuXG5leHBvcnQgdHlwZSBDb250ZXh0SUQgPSBPcGFxdWVJRDxcIkNvbnRleHRJRFwiPjtcbmV4cG9ydCB0eXBlIENvbnRleHQ8VD4gPSB7XG4gIFByb3ZpZGVyOiBDb21wb25lbnQ8eyB2YWx1ZTogVCB9PixcbiAgZGVmYXVsdFZhbHVlOiBULFxuICBpZDogQ29udGV4dElELFxufVxuXG5leHBvcnQgY29uc3QgcHJvdmlkZXJOb2RlVHlwZSA9IFN5bWJvbChcInByb3ZpZGVyXCIpO1xuXG5leHBvcnQgY29uc3QgY3JlYXRlQ29udGV4dCA9IDxUPihkZWZhdWx0VmFsdWU6IFQpOiBDb250ZXh0PFQ+ID0+IHtcbiAgY29uc3QgaWQgPSBjcmVhdGVJZDwnQ29udGV4dElEJz4oXCJDb250ZXh0SURcIik7XG4gIHJldHVybiB7XG4gICAgUHJvdmlkZXIoeyB2YWx1ZSwgY2hpbGRyZW4gfSkge1xuICAgICAgcmV0dXJuIGgocHJvdmlkZXJOb2RlVHlwZSwgeyB2YWx1ZSwgaWQgfSwgY2hpbGRyZW4pO1xuICAgIH0sXG4gICAgZGVmYXVsdFZhbHVlLFxuICAgIGlkLFxuICB9XG59O1xuIiwgImltcG9ydCB7IEVsZW1lbnQgfSBmcm9tIFwiLi9lbGVtZW50LnRzXCI7XG5pbXBvcnQgeyBVbmtub3duRWxlbWVudFR5cGUgfSBmcm9tIFwiLi9lcnJvcnMudHNcIjtcbmltcG9ydCB7IGggfSBmcm9tIFwiLi9lbGVtZW50LnRzXCI7XG5cbmV4cG9ydCB0eXBlIE5vZGUgPVxuICB8IHN0cmluZ1xuICB8IG51bWJlclxuICB8IGJvb2xlYW5cbiAgfCBudWxsXG4gIHwgRWxlbWVudFxuICB8IE5vZGVbXVxuXG5leHBvcnQgY29uc3QgcHJpbWl0aXZlTm9kZVR5cGVzID0ge1xuICBzdHJpbmc6ICAgU3ltYm9sKFwic3RyaW5nLW5vZGVcIiksXG4gIG51bWJlcjogICBTeW1ib2woXCJudW1iZXItbm9kZVwiKSxcbiAgYm9vbGVhbjogIFN5bWJvbChcImJvb2xlYW4tbm9kZVwiKSxcbiAgbnVsbDogICAgIFN5bWJvbChcIm51bGwtbm9kZVwiKSxcbiAgYXJyYXk6ICAgIFN5bWJvbChcImFycmF5LW5vZGVcIiksXG59IGFzIGNvbnN0O1xuXG4vKipcbiAqIEFueSBub2RlIHRyZWUgcmVwcmVzZW50cyBvbmUgb3IgbW9yZSBlbGVtZW50c1xuICovXG5leHBvcnQgY29uc3QgY29udmVydE5vZGVUb0VsZW1lbnRzID0gKG5vZGU6IE5vZGUpOiBFbGVtZW50W10gPT4ge1xuICBjb25zdCBub2RlQXJyYXkgPSBBcnJheS5pc0FycmF5KG5vZGUpID8gbm9kZSA6IFtub2RlXTtcblxuICByZXR1cm4gbm9kZUFycmF5Lm1hcChjb252ZXJ0Tm9kZVRvRWxlbWVudCk7XG59XG5cbmV4cG9ydCBjb25zdCBjb252ZXJ0Tm9kZVRvRWxlbWVudCA9IChub2RlOiBOb2RlKTogRWxlbWVudCA9PiB7XG4gIHN3aXRjaCAodHlwZW9mIG5vZGUpIHtcbiAgICBjYXNlICdib29sZWFuJzpcbiAgICAgIHJldHVybiBoKHByaW1pdGl2ZU5vZGVUeXBlcy5ib29sZWFuLCB7IHZhbHVlOiBub2RlIH0pO1xuICAgIGNhc2UgJ251bWJlcic6XG4gICAgICByZXR1cm4gaChwcmltaXRpdmVOb2RlVHlwZXMubnVtYmVyLCB7IHZhbHVlOiBub2RlIH0pO1xuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICByZXR1cm4gaChwcmltaXRpdmVOb2RlVHlwZXMuc3RyaW5nLCB7IHZhbHVlOiBub2RlIH0pO1xuXG4gICAgY2FzZSAnb2JqZWN0JzogXG4gICAgICBpZiAobm9kZSA9PT0gbnVsbClcbiAgICAgICAgcmV0dXJuIGgocHJpbWl0aXZlTm9kZVR5cGVzLm51bGwpO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkobm9kZSkpXG4gICAgICAgIHJldHVybiBoKHByaW1pdGl2ZU5vZGVUeXBlcy5hcnJheSwge30sIG5vZGUpO1xuICAgICAgXG4gICAgICByZXR1cm4gbm9kZTtcbiAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5kZWZpbmVkIGlzIG5vdCBhIHZhbGlkIGFjdCBlbGVtZW50IWApO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgVW5rbm93bkVsZW1lbnRUeXBlKClcbiAgfVxufSIsICJpbXBvcnQgeyBDb21wb25lbnQsIEVsZW1lbnRUeXBlLCBSZWYgfSBmcm9tIFwiLi9tb2RcIjtcbmltcG9ydCB7IHByb3ZpZGVyTm9kZVR5cGUgfSBmcm9tICcuL2NvbnRleHQnO1xuaW1wb3J0IHsgTm9kZSB9IGZyb20gJy4vbm9kZSc7XG5cbmV4cG9ydCBjb25zdCBib3VuZGFyeU5vZGVUeXBlID0gU3ltYm9sKCdib3VuZGFyeScpO1xuZXhwb3J0IGNvbnN0IGZhbGxiYWNrTm9kZVR5cGUgPSBTeW1ib2woJ2ZhbGxiYWNrJyk7XG5leHBvcnQgY29uc3Qgc3VzcGVuZE5vZGVUeXBlID0gU3ltYm9sKCdzdXNwZW5kJyk7XG5leHBvcnQgY29uc3QgcmVuZGVyTm9kZVR5cGUgPSBTeW1ib2woJ3JlbmRlcicpO1xuZXhwb3J0IGNvbnN0IHBsYWNlaG9sZGVyTm9kZVR5cGUgPSBTeW1ib2woJ3BsYWNlaG9sZGVyJyk7XG5cbmV4cG9ydCB0eXBlIEJvdW5kYXJ5UHJvcHMgPSB7XG4gIGZhbGxiYWNrPzogTm9kZSxcblxuICBvblRocm93PzogKHZhbHVlOiB1bmtub3duLCBhbGxWYWx1ZXM6IHVua25vd25bXSkgPT4gdW5rbm93bixcbiAgb25DbGVhcj86ICgpID0+IHVua25vd24sXG5cbiAgcmVmPzogUmVmPG51bGwgfCB7IGNsZWFyOiAoKSA9PiB2b2lkIH0+XG59XG5leHBvcnQgdHlwZSBSZW5kZXJSb290UHJvcHMgPSB7XG4gIHR5cGU6IHN0cmluZyB8IHN5bWJvbCxcbn1cbmV4cG9ydCB0eXBlIFN1c3BlbmRQcm9wcyA9IHtcbiAgc3VzcGVuZGVkOiBib29sZWFuLFxufVxuXG5leHBvcnQgY29uc3QgQm91bmRhcnk6IENvbXBvbmVudDxCb3VuZGFyeVByb3BzPiA9IGJvdW5kYXJ5Tm9kZVR5cGUgYXMgYW55O1xuZXhwb3J0IGNvbnN0IFJlbmRlclJvb3Q6IENvbXBvbmVudDxSZW5kZXJSb290UHJvcHM+ID0gcmVuZGVyTm9kZVR5cGUgYXMgYW55O1xuZXhwb3J0IGNvbnN0IEZhbGxiYWNrOiBDb21wb25lbnQgPSBmYWxsYmFja05vZGVUeXBlIGFzIGFueTtcbmV4cG9ydCBjb25zdCBTdXNwZW5kOiBDb21wb25lbnQ8U3VzcGVuZFByb3BzPiA9IHN1c3BlbmROb2RlVHlwZSBhcyBhbnk7XG5cbmV4cG9ydCB0eXBlIFNwZWNpYWxOb2RlVHlwZSA9XG4gIHwgdHlwZW9mIGJvdW5kYXJ5Tm9kZVR5cGVcbiAgfCB0eXBlb2YgcmVuZGVyTm9kZVR5cGVcbiAgfCB0eXBlb2YgcHJvdmlkZXJOb2RlVHlwZVxuICB8IHR5cGVvZiBmYWxsYmFja05vZGVUeXBlXG4gIHwgdHlwZW9mIHN1c3BlbmROb2RlVHlwZVxuICB8IHR5cGVvZiBwbGFjZWhvbGRlck5vZGVUeXBlXG5cbmV4cG9ydCBjb25zdCBzcGVjaWFsTm9kZVR5cGVzID0ge1xuICBib3VuZGFyeTogYm91bmRhcnlOb2RlVHlwZSxcbiAgcmVuZGVyOiByZW5kZXJOb2RlVHlwZSxcbiAgcHJvdmlkZXI6IHByb3ZpZGVyTm9kZVR5cGUsXG4gIGZhbGxiYWNrOiBmYWxsYmFja05vZGVUeXBlLFxuICBzdXNwZW5kOiBzdXNwZW5kTm9kZVR5cGUsXG4gIHBsYWNlaG9sZGVyOiBwbGFjZWhvbGRlck5vZGVUeXBlLFxufSIsICJleHBvcnQgKiBmcm9tICcuL2NvbXBvbmVudC50cyc7XG5leHBvcnQgKiBmcm9tICcuL2hvb2tzLnRzJztcbmV4cG9ydCAqIGZyb20gJy4vY29udGV4dC50cyc7XG5leHBvcnQgKiBmcm9tICcuL2Vycm9ycy50cyc7XG5cbmV4cG9ydCAqIGZyb20gJy4vZWxlbWVudC50cyc7XG5leHBvcnQgKiBmcm9tICcuL25vZGUudHMnO1xuZXhwb3J0ICogZnJvbSAnLi9pZC50cyc7XG5leHBvcnQgKiBmcm9tICcuL3NwZWNpYWwudHMnO1xuXG5kZWNsYXJlIGdsb2JhbCB7XG4gIHZhciBfX0xVS0VLQUFMSU1fQUNUX0dMT0JBTF9DSEVDSzogbnVtYmVyO1xufVxuXG5pZiAoZ2xvYmFsVGhpc1snX19MVUtFS0FBTElNX0FDVF9HTE9CQUxfQ0hFQ0snXSkge1xuICBjb25zb2xlLndhcm4oYFRoZXJlIGFyZSBtdWx0aXBsZSAoYXQgbGVhc3QgJHtnbG9iYWxUaGlzLl9fTFVLRUtBQUxJTV9BQ1RfR0xPQkFMX0NIRUNLfSkgY29waWVzIG9mIEFjdCBydW5uaW5nIWApXG4gIGdsb2JhbFRoaXMuX19MVUtFS0FBTElNX0FDVF9HTE9CQUxfQ0hFQ0srKztcbn0gZWxzZSB7XG4gIGdsb2JhbFRoaXMuX19MVUtFS0FBTElNX0FDVF9HTE9CQUxfQ0hFQ0sgPSAxO1xufVxuIiwgImltcG9ydCAqIGFzIGFjdCBmcm9tICdAbHVrZWthYWxpbS9hY3QnO1xuXG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBXaW5kb3cge1xuICAgIEhUTUxFbGVtZW50OiB0eXBlb2YgSFRNTEVsZW1lbnQsXG4gICAgU1ZHRWxlbWVudDogdHlwZW9mIFNWR0VsZW1lbnQsXG4gICAgVGV4dDogdHlwZW9mIFRleHQsXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHNldFByb3BzID0gKFxuICB3aW5kb3c6IFdpbmRvdyxcbiAgbm9kZTogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50IHwgVGV4dCxcbiAgXG4gIG5leHQ6IGFjdC5FbGVtZW50LFxuICBwcmV2OiBudWxsIHwgYWN0LkVsZW1lbnRcbikgPT4ge1xuICBpZiAobm9kZSBpbnN0YW5jZW9mIHdpbmRvdy5IVE1MRWxlbWVudCkge1xuICAgIHNldEhUTUxFbGVtZW50UHJvcHMobm9kZSwgbmV4dCwgcHJldik7XG4gIH1cbiAgaWYgKG5vZGUgaW5zdGFuY2VvZiB3aW5kb3cuU1ZHRWxlbWVudCkge1xuICAgIHNldFNWR0VsZW1lbnRQcm9wcyhub2RlLCBuZXh0LCBwcmV2KTtcbiAgfVxuICBpZiAobm9kZSBpbnN0YW5jZW9mIHdpbmRvdy5UZXh0KSB7XG4gICAgaWYgKG5vZGUudGV4dENvbnRlbnQgIT09IG5leHQucHJvcHMudmFsdWUpXG4gICAgICBub2RlLnRleHRDb250ZW50ID0gbmV4dC5wcm9wcy52YWx1ZSBhcyBzdHJpbmdcbiAgfVxufVxuXG5leHBvcnQgY29uc3Qgc2V0U1ZHRWxlbWVudFByb3BzID0gKFxuICBub2RlOiBTVkdFbGVtZW50LFxuICBcbiAgbmV4dDogYWN0LkVsZW1lbnQsXG4gIHByZXY6IG51bGwgfCBhY3QuRWxlbWVudFxuKSA9PiB7XG4gIHNldFByb3BPYmplY3Qobm9kZSBhcyBhbnksIG5leHQucHJvcHMsIHByZXYgJiYgcHJldi5wcm9wcywgKG5hbWUsIG5leHQsIHByZXYpID0+IHtcbiAgICBpZiAobmFtZS5zdGFydHNXaXRoKCdvbicpKSB7XG4gICAgICBjb25zdCBldmVudE5hbWUgPSBuYW1lLnNsaWNlKDIpLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICBzZXRFdmVudFByb3Aobm9kZSBhcyBhbnksIGV2ZW50TmFtZSwgbmV4dCwgcHJldik7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICBjYXNlICdyZWYnOlxuICAgICAgICAobmV4dCBhcyBhbnkpLmN1cnJlbnQgPSBub2RlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGNhc2UgJ3N0eWxlJzpcbiAgICAgICAgcmV0dXJuIChzZXRTdHlsZVByb3Aobm9kZS5zdHlsZSwgbmV4dCBhcyBhbnksIHByZXYgYXMgYW55KSwgdHJ1ZSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShuYW1lLCBuZXh0IGFzIGFueSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gIH0pO1xufVxuXG5leHBvcnQgY29uc3Qgc2V0SFRNTEVsZW1lbnRQcm9wcyA9IChcbiAgbm9kZTogSFRNTEVsZW1lbnQsXG4gIFxuICBuZXh0OiBhY3QuRWxlbWVudCxcbiAgcHJldjogbnVsbCB8IGFjdC5FbGVtZW50XG4pID0+IHtcbiAgc2V0UHJvcE9iamVjdChub2RlIGFzIGFueSwgbmV4dC5wcm9wcywgcHJldiAmJiBwcmV2LnByb3BzLCAobmFtZSwgbmV4dCwgcHJldikgPT4ge1xuICAgIGlmIChuYW1lLnN0YXJ0c1dpdGgoJ29uJykpIHtcbiAgICAgIGNvbnN0IGV2ZW50TmFtZSA9IG5hbWUuc2xpY2UoMikudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICAgIHNldEV2ZW50UHJvcChub2RlIGFzIGFueSwgZXZlbnROYW1lLCBuZXh0LCBwcmV2KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAobmFtZS5zdGFydHNXaXRoKCdkYXRhLScpKSB7XG4gICAgICBpZiAobmV4dCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAgIGVsc2VcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUobmFtZSwgbmV4dCBhcyBzdHJpbmcpO1xuICAgIH1cbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgJ3JlZic6XG4gICAgICAgIChuZXh0IGFzIGFueSkuY3VycmVudCA9IG5vZGU7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgY2FzZSAnc3R5bGUnOlxuICAgICAgICByZXR1cm4gKHNldFN0eWxlUHJvcChub2RlLnN0eWxlLCBuZXh0IGFzIGFueSwgcHJldiBhcyBhbnkpLCB0cnVlKTtcbiAgICAgIGNhc2UgJ2NsYXNzTmFtZSc6XG4gICAgICAgIG5vZGUuY2xhc3NOYW1lID0gbmV4dCBhcyBzdHJpbmc7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgY2FzZSAnY2xhc3NMaXN0JzpcbiAgICAgICAgY29uc3QgY2xhc3NOYW1lcyA9IChuZXh0IGFzIHN0cmluZ1tdKS5maWx0ZXIoQm9vbGVhbikuam9pbignICcpO1xuICAgICAgICBub2RlLmNsYXNzTmFtZSA9IGNsYXNzTmFtZXM7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSlcbn1cblxuZXhwb3J0IGNvbnN0IHNldEV2ZW50UHJvcCA9IChcbiAgbm9kZTogRXZlbnRTb3VyY2UsXG4gIHR5cGU6IHN0cmluZyxcbiAgbmV4dDogdW5rbm93bixcbiAgcHJldjogdW5rbm93bixcbikgPT4ge1xuICBpZiAocHJldiA9PT0gbmV4dClcbiAgICByZXR1cm47XG4gIGlmIChwcmV2KSB7XG4gICAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIHByZXYgYXMgYW55KVxuICB9XG4gIGlmIChuZXh0KSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKHR5cGUsIG5leHQgYXMgYW55KVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBzZXRTdHlsZVByb3AgPSAoXG4gIG5vZGU6IENTU1N0eWxlRGVjbGFyYXRpb24sXG4gIHN0eWxlOiBudWxsIHwgUmVjb3JkPGtleW9mIENTU1N0eWxlRGVjbGFyYXRpb24sIHN0cmluZyB8IG51bWJlcj4sXG4gIHByZXZTdHlsZTogbnVsbCB8IFJlY29yZDxrZXlvZiBDU1NTdHlsZURlY2xhcmF0aW9uLCBzdHJpbmcgfCBudW1iZXI+LFxuKSA9PiB7XG4gIHNldFByb3BPYmplY3Qobm9kZSBhcyBhbnksIHN0eWxlLCBwcmV2U3R5bGUsIChuYW1lLCB2YWx1ZSkgPT5cbiAgICAobm9kZS5zZXRQcm9wZXJ0eShuYW1lLCB2YWx1ZSBhcyBzdHJpbmcpLCB0cnVlKSlcbn1cblxuY29uc3Qgc2V0UHJvcE9iamVjdCA9IChcbiAgdGFyZ2V0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgbmV4dDogbnVsbCB8IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICBwcmV2OiBudWxsIHwgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gIGFzc2lnbjogbnVsbCB8ICgobmFtZTogc3RyaW5nLCBuZXh0OiB1bmtub3duLCBwcmV2OiB1bmtub3duKSA9PiBib29sZWFuKSA9IG51bGwsIFxuKSA9PiB7XG4gIGNvbnN0IG5hbWVzID0gbmV3IFNldChbXG4gICAgLi4uT2JqZWN0LmtleXMobmV4dCB8fCB7fSksXG4gICAgLi4uT2JqZWN0LmtleXMocHJldiB8fCB7fSlcbiAgXSk7XG5cbiAgZm9yIChjb25zdCBuYW1lIG9mIG5hbWVzKSB7XG4gICAgY29uc3QgbmV4dFZhbHVlID0gKG5leHQgfHwge30pW25hbWVdO1xuICAgIGNvbnN0IHN1Y2Nlc3NmdWxBc3NpZ24gPSBhc3NpZ24gJiYgYXNzaWduKG5hbWUsIG5leHRWYWx1ZSwgKHByZXYgfHwge30pW25hbWVdKTtcbiAgICBpZiAoIXN1Y2Nlc3NmdWxBc3NpZ24pIHtcbiAgICAgIGlmICh0YXJnZXRbbmFtZV0gIT09IG5leHRWYWx1ZSkge1xuICAgICAgICB0YXJnZXRbbmFtZV0gPSBuZXh0VmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG59IiwgImltcG9ydCAqIGFzIGFjdCBmcm9tICdAbHVrZWthYWxpbS9hY3QnO1xuXG5pbXBvcnQgeyBzZXRQcm9wcyB9IGZyb20gJy4vcHJvcHMudHMnO1xuaW1wb3J0IHsgTm9kZUJ1aWxkZXIgfSBmcm9tICdAbHVrZWthYWxpbS9hY3QtYmFja3N0YWdlJztcblxuZXhwb3J0IGNvbnN0IEhUTUw6IGFjdC5Db21wb25lbnQgPSAoeyBjaGlsZHJlbiB9KSA9PiBhY3QuaChhY3QucmVuZGVyTm9kZVR5cGUsIHsgdHlwZTogJ3dlYjpodG1sJyB9LCBjaGlsZHJlbik7XG5leHBvcnQgY29uc3QgU1ZHOiBhY3QuQ29tcG9uZW50ID0gKHsgY2hpbGRyZW4gfSkgPT4gYWN0LmgoYWN0LnJlbmRlck5vZGVUeXBlLCB7IHR5cGU6ICd3ZWI6c3ZnJyB9LCBjaGlsZHJlbik7XG5cbmNvbnN0IGRlZmF1bHRXaW5kb3cgPSAoZ2xvYmFsVGhpcy53aW5kb3cpO1xuXG5leHBvcnQgY29uc3QgY3JlYXRlV2ViTm9kZUJ1aWxkZXIgPSAoXG4gIHJvb3Q6IEhUTUxFbGVtZW50LFxuICB3aW5kb3c6IFdpbmRvdyA9IGRlZmF1bHRXaW5kb3dcbik6IE5vZGVCdWlsZGVyPEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudCB8IFRleHQsICd3ZWI6aHRtbCcgfCAnd2ViOnN2Zyc+ID0+ICh7XG4gIHJvb3RzOiBuZXcgU2V0KFsnd2ViOmh0bWwnLCAnd2ViOnN2ZyddIGFzIGNvbnN0KSxcblxuICBjcmVhdGUoZWxlbWVudCwgcm9vdFR5cGUpIHtcbiAgICBjb25zdCB0YWcgPSBlbGVtZW50LnR5cGU7XG4gICAgXG4gICAgc3dpdGNoICh0eXBlb2YgdGFnKSB7XG4gICAgICBjYXNlICdzeW1ib2wnOiB7XG4gICAgICAgIHN3aXRjaCAodGFnKSB7XG4gICAgICAgICAgY2FzZSBhY3QucHJpbWl0aXZlTm9kZVR5cGVzLnN0cmluZzpcbiAgICAgICAgICBjYXNlIGFjdC5wcmltaXRpdmVOb2RlVHlwZXMubnVtYmVyOlxuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5kb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIjxlbXB0eSB0ZXh0PlwiKTtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNhc2UgJ3N0cmluZyc6IHtcbiAgICAgICAgc3dpdGNoIChyb290VHlwZSkge1xuICAgICAgICAgIGNhc2UgJ3dlYjpodG1sJzpcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sJywgdGFnKTtcbiAgICAgICAgICBjYXNlICd3ZWI6c3ZnJzpcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIHRhZyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSxcbiAgdXBkYXRlKGVsLCBuZXh0LCBwcmV2KSB7XG4gICAgc2V0UHJvcHMod2luZG93LCBlbCwgbmV4dCwgcHJldik7XG4gIH0sXG4gIGxpbmsoZWwsIHBhcmVudCkge1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZChlbCk7XG4gIH0sXG4gIGxpbmtSb290KGNoaWxkKSB7XG4gICAgcm9vdC5hcHBlbmRDaGlsZChjaGlsZCk7XG4gIH0sXG4gIHVubGluayhlbCwgcGFyZW50KSB7XG4gICAgaWYgKGVsLnBhcmVudE5vZGUgPT09IHBhcmVudClcbiAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChlbCk7XG4gIH0sXG4gIGRlc3Ryb3koZWwpIHtcbiAgICBpZiAoZWwucGFyZW50Tm9kZSlcbiAgICAgIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpXG4gIH0sXG4gIHN1c3BlbmQoZWwsIHBhcmVudCkge1xuICAgIGlmIChlbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KVxuICAgICAgZWwuc3R5bGUub3BhY2l0eSA9IDAuNS50b1N0cmluZygpO1xuICB9LFxuICB1bnN1c3BlbmQoZWwsIHBhcmVudCkge1xuICAgIGlmIChlbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KVxuICAgICAgZWwuc3R5bGUub3BhY2l0eSA9ICgxKS50b1N0cmluZygpO1xuICB9LFxuICBzb3J0KGVsLCBuZXdDaGlsZHJlbikge1xuICAgIGlmIChlbCBpbnN0YW5jZW9mIFRleHQpXG4gICAgICByZXR1cm47XG5cbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGVsLmNoaWxkTm9kZXMpXG4gICAgICBpZiAoIW5ld0NoaWxkcmVuLmluY2x1ZGVzKGNoaWxkIGFzIEhUTUxFbGVtZW50KSlcblxuICAgIGlmIChuZXdDaGlsZHJlbi5sZW5ndGggPCAyKVxuICAgICAgcmV0dXJuO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZXdDaGlsZHJlbi5sZW5ndGg7IGkrKylcbiAgICAgIGlmIChlbC5jaGlsZHJlbltpXSAhPT0gbmV3Q2hpbGRyZW5baV0pXG4gICAgICAgIGVsLmluc2VydEJlZm9yZShuZXdDaGlsZHJlbltpXSwgZWwuY2hpbGRyZW5baV0pXG4gIH0sXG59KSIsICJpbXBvcnQgeyBwcmltaXRpdmVOb2RlVHlwZXMsIHNwZWNpYWxOb2RlVHlwZXMsIFN1c3BlbmRQcm9wcyB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcbmltcG9ydCB7IENvbW1pdDIsIENvbW1pdElELCBDb21taXRSZWYyLCBDb21taXRUcmVlMiwgRGVsdGEsIFJlY29uY2lsZXJFdmVudEJ1cyB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3QtcmVjb25cIlxuaW1wb3J0IHsgTm9kZUJ1aWxkZXIgfSBmcm9tIFwiLi9idWlsZGVyXCI7XG5cbnR5cGUgUGFyZW50U2VhcmNoUmVzdWx0PFROb2RlPiA9IHtcbiAgLyoqXG4gICAqIFlvdSBtaWdodCBub3QgaGF2ZSBhIHBhcmVudCAtIG5vXG4gICAqIGNvbW1pdCBtZWFucyB0aGVyZSBhcmUgbm8gTm9kZXMgYWJvdmUgeW91IC0ganVzdCBSb290LlxuICAgKi9cbiAgY29tbWl0OiBDb21taXQyIHwgbnVsbCxcbiAgLyoqXG4gICAqIFlvdXIgcGFyZW50IG1pZ2h0IGJlIGEgdmFsaWQgbm9kZSxcbiAgICogb3IgaXQgbWlnaHQgYmUgXCJudWxsXCJcbiAgICovXG4gIG5vZGU6IFROb2RlIHwgbnVsbCxcblxuICBhdHRhY2hhYmxlOiBib29sZWFuLFxufVxuXG4vKipcbiAqIFRoZSBSZW5kZXJTcGFjZSBjbGFzc1xuICovXG5leHBvcnQgY2xhc3MgUmVuZGVyU3BhY2UyPFROb2RlLCBUUm9vdCBleHRlbmRzIHN0cmluZyB8IHN5bWJvbD4ge1xuICAvKiogVGhlIENvbW1pdFRyZWUgdGhpcyByZW5kZXIgc3BhY2UgaXMgY29ubmVjdGVkIHRvICovXG4gIHRyZWU6IENvbW1pdFRyZWUyO1xuXG4gIC8qKiBBIHJldmVyc2UgbWFwIHRvIGxvb2sgdXAgQ29tbWl0cyBnaXZlbiBqdXN0IHRoZSBub2RlIHRoZXkgcmVwcmVzZW50ICovXG4gIG5vZGVCeUNvbW1pdDogTWFwPENvbW1pdElELCBUTm9kZT4gPSBuZXcgTWFwKCk7XG4gIC8qKiBBIHJldmVyc2UgbWFwIHRvIGxvb2sgdXAgQ29tbWl0cyBnaXZlbiBqdXN0IHRoZSBub2RlIHRoZXkgcmVwcmVzZW50ICovXG4gIGNvbW1pdEJ5Tm9kZTogTWFwPFROb2RlLCBDb21taXQyPiA9IG5ldyBNYXAoKTtcblxuICAvKiogRm9yIGEgZ2l2ZW4gQ29tbWl0SUQsIGZpbmQgaXQncyBjbG9zZXN0IFwicmVhbFwiIHBhcmVudCAoYSBhbmNlc3RvciB3aXRoIGEgbm9uLW51bGwgVE5vZGUpICovXG4gIHBhcmVudEJ5Tm9kZTogTWFwPENvbW1pdElELCBDb21taXQyPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogQSBzZXQgb2YgYWxsIHNwZWNpYWwgUm9vdCBlbGVtZW50IElEcyBpbiB0aGUgdHJlZS5cbiAgICogQSBSb290IGVsZW1lbnQgaGVscHMgdGVsbCBhIHJlbmRlcmVyIHdoYXQga2luZCBvZiBlbGVtZW50XG4gICAqIHRvIHJlbmRlciwgYmFzZWQgb24gaXQncyBjbG9zZXN0IFJvb3QuXG4gICAqL1xuICByb290czogTWFwPENvbW1pdElELCBDb21taXQyPiA9IG5ldyBNYXAoKTtcbiAgYnVzOiBSZWNvbmNpbGVyRXZlbnRCdXM7XG4gIGJ1aWxkZXI6IE5vZGVCdWlsZGVyPFROb2RlLCBUUm9vdD47XG5cbiAgY29uc3RydWN0b3IodHJlZTogQ29tbWl0VHJlZTIsIGJ1aWxkZXI6IE5vZGVCdWlsZGVyPFROb2RlLCBUUm9vdD4pIHtcbiAgICB0aGlzLnRyZWUgPSB0cmVlO1xuICAgIHRoaXMuYnVzID0ge1xuICAgICAgcmVuZGVyOiAoZGVsdGEpID0+IHtcbiAgICAgICAgdGhpcy5jcmVhdGUoZGVsdGEpO1xuICAgICAgICB0aGlzLnVwZGF0ZShkZWx0YSk7XG4gICAgICB9LFxuICAgIH1cbiAgICB0aGlzLmJ1aWxkZXIgPSBidWlsZGVyO1xuICB9XG5cbiAgZmluZENoaWxkcmVuKGlkOiBDb21taXRJRCwgaWdub3JlRmlyc3QgPSBmYWxzZSwgaWdub3JlU3VzcGVuZGVkID0gdHJ1ZSk6IFROb2RlW10ge1xuICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5vZGVCeUNvbW1pdC5nZXQoaWQpO1xuICAgIGlmIChub2RlICYmICFpZ25vcmVGaXJzdClcbiAgICAgIHJldHVybiBbbm9kZV07XG5cbiAgICBjb25zdCBjb21taXQgPSB0aGlzLnRyZWUuY29tbWl0cy5nZXQoaWQpO1xuICAgIGlmICghY29tbWl0KVxuICAgICAgcmV0dXJuIFtdO1xuICAgIGlmIChjb21taXQuZWxlbWVudC50eXBlID09PSBwcmltaXRpdmVOb2RlVHlwZXMubnVsbClcbiAgICAgIHJldHVybiBbXTtcbiAgICAvLyBzdXNwZW5kZWQgbm9kZXMgZG9uJ3QgY291bnQgYXMgY2hpbGRyZW5cbiAgICBpZiAoaWdub3JlU3VzcGVuZGVkICYmIGNvbW1pdC5pc1N1c3BlbmRlZCgpKVxuICAgICAgcmV0dXJuIFtdO1xuXG4gICAgcmV0dXJuIGNvbW1pdC5jaGlsZHJlbi5tYXAoYyA9PiB0aGlzLmZpbmRDaGlsZHJlbihjLmlkKSkuZmxhdCgxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBcImZpbmQgcGFyZW50XCIgY2FuIHJldHVybiAzIHR5cGVzIG9mIHJlc3VsdHM6XG4gICAqICAtIEFuIGFuY2VzdG9yIGhhcyBhIG5vZGUhIHdlIHJldHVybiB0aGF0LlxuICAgKiAgLSBBbiBhbmNlc3RvciBpcyBhIFwibnVsbFwiIG5vZGUgLSB3ZSByZXR1cm4gdGhlIHNwZWNpYWwgZm9ybSBvZiBcImNvbW1pdCBidXQgbm8gbm9kZVwiXG4gICAqICAtIE5vIGFuY2VzdG9yIGhhcyBhIG5vZGUgLSB5b3UgbWlnaHQgYmUgbmVhciB0aGUgcm9vdFxuICAgKiBAcGFyYW0gcmVmIFxuICAgKiBAcmV0dXJucyBcbiAgICovXG4gIGZpbmRQYXJlbnQocmVmOiBDb21taXRSZWYyKTogUGFyZW50U2VhcmNoUmVzdWx0PFROb2RlPiB7XG4gICAgbGV0IGFuY2VzdG9yOiBDb21taXRSZWYyIHwgbnVsbCA9IHJlZjtcbiAgICBsZXQgYXR0YWNoYWJsZSA9IHRydWU7XG5cbiAgICB3aGlsZSAoYW5jZXN0b3IpIHtcbiAgICAgIGlmIChhbmNlc3Rvci5pZCAhPT0gcmVmLmlkKSB7XG4gICAgICAgIGNvbnN0IGNvbW1pdCA9IHRoaXMudHJlZS5jb21taXRzLmdldChhbmNlc3Rvci5pZCkgfHwgbnVsbDtcblxuICAgICAgICAvLyBFYXJseSBleGl0IG91dCBvZiBwYXJlbnQgbG9va3VwIGlmIHNvbWVvbmUgb24gdGhlIHBhdGggaXMgbnVsbDtcbiAgICAgICAgaWYgKGNvbW1pdCAmJiBjb21taXQuZWxlbWVudC50eXBlID09PSBwcmltaXRpdmVOb2RlVHlwZXMubnVsbClcbiAgICAgICAgICByZXR1cm4geyBjb21taXQsIG5vZGU6IG51bGwsIGF0dGFjaGFibGU6IGZhbHNlIH07XG5cbiAgICAgICAgLy8gbWF5YmUgYSBiYWQgaWRlYS4uLiB3ZSdsbCBzZWVcbiAgICAgICAgaWYgKGNvbW1pdCAmJiBjb21taXQuaXNTdXNwZW5kZWQoKSlcbiAgICAgICAgICBhdHRhY2hhYmxlID0gZmFsc2U7XG5cbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMubm9kZUJ5Q29tbWl0LmdldChhbmNlc3Rvci5pZCk7XG4gICAgICAgIC8vIElmIHlvdSBmaW5kIGFuIGVsZW1lbnQgd2l0aCBhIG5vZGVcbiAgICAgICAgaWYgKG5vZGUpXG4gICAgICAgICAgcmV0dXJuIHsgY29tbWl0LCBub2RlLCBhdHRhY2hhYmxlIH1cbiAgICAgIH1cbiAgICAgIGFuY2VzdG9yID0gYW5jZXN0b3IucGFyZW50O1xuICAgIH1cblxuICAgIC8vIHRoaXMgZWxlbWVudCBoYXMgbm8gXCJub2RlXCIgcGFyZW50cyAtIGl0IGlzIHByb2JhYmx5IGEgXCJyb290XCIgY29tbWl0XG4gICAgcmV0dXJuIHsgY29tbWl0OiBudWxsLCBub2RlOiBudWxsLCBhdHRhY2hhYmxlIH07XG4gIH1cblxuICBmaW5kUm9vdChyZWY6IENvbW1pdFJlZjIpIHtcbiAgICBsZXQgYW5jZXN0b3I6IENvbW1pdFJlZjIgfCBudWxsID0gcmVmO1xuXG4gICAgd2hpbGUgKGFuY2VzdG9yKSB7XG4gICAgICBjb25zdCByb290ID0gdGhpcy5yb290cy5nZXQoYW5jZXN0b3IuaWQpO1xuICAgICAgaWYgKHJvb3QpXG4gICAgICAgIHJldHVybiByb290O1xuICAgICAgYW5jZXN0b3IgPSBhbmNlc3Rvci5wYXJlbnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBuZXdOb2RlczogU2V0PFtDb21taXQyLCBUTm9kZV0+ID0gbmV3IFNldCgpO1xuICBuZWVkc1Jlb3JkZXI6IFNldDxDb21taXRJRD4gPSBuZXcgU2V0KCk7XG5cbiAgY3JlYXRlKGRlbHRhczogRGVsdGEpIHtcbiAgICB0aGlzLm5ld05vZGVzLmNsZWFyKCk7XG4gICAgdGhpcy5uZWVkc1Jlb3JkZXIuY2xlYXIoKTtcblxuICAgIGZvciAoY29uc3QgbmV4dCBvZiBkZWx0YXMuZnJlc2gudmFsdWVzKCkpIHtcbiAgICAgIGlmIChuZXh0LmVsZW1lbnQudHlwZSA9PT0gc3BlY2lhbE5vZGVUeXBlcy5yZW5kZXIpIHtcbiAgICAgICAgLy8gYWRkIHJlbmRlciBib3VuZGFyeVxuICAgICAgICB0aGlzLnJvb3RzLnNldChuZXh0LnJlZi5pZCwgbmV4dCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3Qgcm9vdCA9IHRoaXMuZmluZFJvb3QobmV4dC5yZWYpO1xuICAgICAgaWYgKCFyb290KVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgY29uc3Qgcm9vdFR5cGUgPSByb290LmVsZW1lbnQucHJvcHNbJ3R5cGUnXSBhcyBUUm9vdDtcblxuICAgICAgLy8gdGVzdCB0byBzZWUgaWYgdGhpcyBlbGVtZW50XG4gICAgICAvLyBiZWxvbmdzIHRvIHRoaXMgXG4gICAgICBpZiAodGhpcy5idWlsZGVyLnJvb3RzLmhhcyhyb290VHlwZSkgKSB7XG4gICAgICAgIC8vIFRyeSB0byBjcmVhdGUgYSA8VD4gZm9yIGV2ZXJ5IG5ldyBjb21taXRcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuYnVpbGRlci5jcmVhdGUobmV4dC5lbGVtZW50LCByb290VHlwZSwgbmV4dC5yZWYpO1xuICAgICAgICAvLyBOb3QgYWxsIGNvbW1pdHMgaGF2ZSBhIGNvcnJlc3BvbmRpbmcgbm9kZVxuICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgIHRoaXMubmV3Tm9kZXMuYWRkKFtuZXh0LCBub2RlXSk7XG4gICAgICAgICAgdGhpcy5ub2RlQnlDb21taXQuc2V0KG5leHQucmVmLmlkLCBub2RlKTtcbiAgICAgICAgICB0aGlzLmNvbW1pdEJ5Tm9kZS5zZXQobm9kZSwgbmV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB1cGRhdGUoZGVsdGFzOiBEZWx0YSkge1xuICAgIGNvbnN0IHtcbiAgICAgIGxpbmssXG4gICAgICB1bmxpbmssXG4gICAgICBsaW5rUm9vdCxcbiAgICAgIHNvcnQsXG4gICAgICB1cGRhdGUsXG4gICAgICBkZXN0cm95LFxuICAgICAgdW5saW5rUm9vdCxcbiAgICAgIHN1c3BlbmQgPSB1bmxpbmssXG4gICAgICB1bnN1c3BlbmQgPSBsaW5rXG4gICAgfSA9IHRoaXMuYnVpbGRlcjtcblxuICAgIGlmIChsaW5rIHx8IHNvcnQpIHtcbiAgICAgIC8vIExvb3AgdGhyb3VnaCBuZXdseSBjcmVhdGVkIG5vZGVzXG4gICAgICBmb3IgKGNvbnN0IFtuZXh0LCBub2RlXSBvZiB0aGlzLm5ld05vZGVzKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZmluZFBhcmVudChuZXh0LnJlZik7XG5cbiAgICAgICAgaWYgKHJlc3VsdC5jb21taXQgJiYgcmVzdWx0Lm5vZGUgJiYgcmVzdWx0LmF0dGFjaGFibGUpIHtcbiAgICAgICAgICB0aGlzLm5lZWRzUmVvcmRlci5hZGQocmVzdWx0LmNvbW1pdC5yZWYuaWQpXG5cbiAgICAgICAgICBpZiAobGluaylcbiAgICAgICAgICAgIGxpbmsobm9kZSwgcmVzdWx0Lm5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxpbmtSb290ICYmICFyZXN1bHQuY29tbWl0ICYmIHJlc3VsdC5hdHRhY2hhYmxlKVxuICAgICAgICAgIGxpbmtSb290KG5vZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh1cGRhdGUpIHtcbiAgICAgIGZvciAoY29uc3QgeyBwcmV2LCBuZXh0LCBtb3ZlZCB9IG9mIGRlbHRhcy5jaGFuZ2VkLnZhbHVlcygpKSB7XG5cbiAgICAgICAgLy8gc3VzcGVuc2UgY29kZVxuICAgICAgICBpZiAobmV4dC5lbGVtZW50LnR5cGUgPT09IHNwZWNpYWxOb2RlVHlwZXMuc3VzcGVuZCkge1xuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZmluZFBhcmVudChuZXh0LnJlZik7XG5cbiAgICAgICAgICBjb25zdCB3YXNTdXNwZW5kZWQgPSAhIXByZXYucHJvcHMuc3VzcGVuZGVkO1xuICAgICAgICAgIGNvbnN0IGlzU3VzcGVuZGVkID0gISFuZXh0LmVsZW1lbnQucHJvcHMuc3VzcGVuZGVkO1xuXG4gICAgICAgICAgY29uc3Qgc3VzcGVuc2VDaGFuZ2VkID0gd2FzU3VzcGVuZGVkICE9PSBpc1N1c3BlbmRlZDtcbiAgICAgICAgICBpZiAoc3VzcGVuc2VDaGFuZ2VkICYmIHJlc3VsdC5jb21taXQgJiYgcmVzdWx0Lm5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMubmVlZHNSZW9yZGVyLmFkZChyZXN1bHQuY29tbWl0LnJlZi5pZCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdGhpcy5maW5kQ2hpbGRyZW4obmV4dC5yZWYuaWQsIHRydWUsIGZhbHNlKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgaWYgKGlzU3VzcGVuZGVkICYmIHN1c3BlbmQpIHtcbiAgICAgICAgICAgICAgICBzdXNwZW5kKGNoaWxkLCByZXN1bHQubm9kZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIGlmICghaXNTdXNwZW5kZWQgJiYgdW5zdXNwZW5kKSB7XG4gICAgICAgICAgICAgICAgdW5zdXNwZW5kKGNoaWxkLCByZXN1bHQubm9kZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5ub2RlQnlDb21taXQuZ2V0KG5leHQucmVmLmlkKTtcbiAgICAgICAgaWYgKCFub2RlKVxuICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgIHVwZGF0ZShub2RlLCBuZXh0LmVsZW1lbnQsIHByZXYsIG5leHQucmVmKTtcblxuICAgICAgICBpZiAobW92ZWQpIHtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmZpbmRQYXJlbnQobmV4dC5yZWYpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmIChyZXN1bHQuY29tbWl0KSB7XG4gICAgICAgICAgICB0aGlzLm5lZWRzUmVvcmRlci5hZGQocmVzdWx0LmNvbW1pdC5yZWYuaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBuZXh0IG9mIGRlbHRhcy5mcmVzaC52YWx1ZXMoKSkge1xuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5ub2RlQnlDb21taXQuZ2V0KG5leHQucmVmLmlkKTtcbiAgICAgICAgaWYgKG5vZGUpXG4gICAgICAgICAgdXBkYXRlKG5vZGUsIG5leHQuZWxlbWVudCwgbnVsbCwgbmV4dC5yZWYpO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IHByZXYgb2YgZGVsdGFzLnJlbW92ZWQudmFsdWVzKCkpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5vZGVCeUNvbW1pdC5nZXQocHJldi5yZWYuaWQpO1xuICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgdGhpcy5ub2RlQnlDb21taXQuZGVsZXRlKHByZXYucmVmLmlkKTtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5maW5kUGFyZW50KHByZXYucmVmKTtcbiAgICAgICAgaWYgKHBhcmVudC5jb21taXQgJiYgcGFyZW50Lm5vZGUpXG4gICAgICAgICAgdGhpcy5uZWVkc1Jlb3JkZXIuYWRkKHBhcmVudC5jb21taXQucmVmLmlkKVxuXG4gICAgICAgIHRoaXMuY29tbWl0QnlOb2RlLmRlbGV0ZShub2RlKTtcbiAgICAgICAgaWYgKHVubGluayAmJiBwYXJlbnQubm9kZSlcbiAgICAgICAgICB1bmxpbmsobm9kZSwgcGFyZW50Lm5vZGUpO1xuICAgICAgICBpZiAodW5saW5rUm9vdCAmJiAhcGFyZW50LmNvbW1pdClcbiAgICAgICAgICB1bmxpbmtSb290KG5vZGUpXG4gICAgICAgIGlmIChkZXN0cm95KVxuICAgICAgICAgIGRlc3Ryb3kobm9kZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHNvcnQpIHtcbiAgICAgIGZvciAoY29uc3QgaWQgb2YgdGhpcy5uZWVkc1Jlb3JkZXIpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMubm9kZUJ5Q29tbWl0LmdldChpZCk7XG4gICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB0aGlzLmZpbmRDaGlsZHJlbihpZCwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgICAgc29ydChub2RlLCBjaGlsZHJlbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBNYWdpY0Vycm9yIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuXG4vKipcbiAqIENoYW5nZVJlcG9ydFxuICovXG5leHBvcnQgY2xhc3MgQ2hhbmdlUmVwb3J0MiB7XG4gIC8qKlxuICAgKiBUaGUgaW5kaWNlcyBvZiBlbGVtZW50cyB0aGF0IHdlcmUgcmVtb3ZlZFxuICAgKi9cbiAgcmVtb3ZlZDogbnVtYmVyW10gPSBbXTtcbiAgLyoqXG4gICAqIFRoZSBpbmRpY2VzIG9mIHRoZSBwcmV2aW91cyBwb3NpdGlvbiB0aGF0IGFuIGVsZW1lbnRcbiAgICogd2FzIGluLCBvciAtMSBpZiBpdCBkaWRuJ3QgZXhpc3QgaW4gdGhlIFwicHJldnNcIiBhcnJheS5cbiAgICovXG4gIHRyYW5zZm9ybTogbnVtYmVyW10gPSBbXTtcblxuICAvKipcbiAgICogQSAoaG9wZWZ1bGx5KSBmYXN0ZXIgc2luZ2xlLWVudHJ5IHJlcG9ydCBnZW5lcmF0b3JcbiAgICogQHBhcmFtIHByZXYgXG4gICAqIEBwYXJhbSBuZXh0IFxuICAgKiBAcGFyYW0gZXF1YWxpdHlUZXN0IFxuICAgKiBAcmV0dXJucyBcbiAgICovXG4gIHN0YXRpYyBnZW5lcmF0ZVNpbmdsZXM8UHJldiwgTmV4dD4ocHJldjogUHJldiwgbmV4dDogTmV4dCwgZXF1YWxpdHlUZXN0OiBDaGFuZ2VFcXVhbGl0eVRlc3Q8UHJldiwgTmV4dD4pIHtcbiAgICBjb25zdCByZXBvcnQgPSBuZXcgQ2hhbmdlUmVwb3J0MigpO1xuXG4gICAgaWYgKGVxdWFsaXR5VGVzdChwcmV2LCBuZXh0LCAwLCAwKSkge1xuICAgICAgcmVwb3J0LnRyYW5zZm9ybS5wdXNoKDApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXBvcnQudHJhbnNmb3JtLnB1c2goLTEpO1xuICAgICAgcmVwb3J0LnJlbW92ZWQucHVzaCgwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVwb3J0O1xuICB9XG5cbiAgc3RhdGljIGdlbmVyYXRlPFByZXYsIE5leHQ+KHByZXZzOiBQcmV2W10sIG5leHRzOiBOZXh0W10sIGVxdWFsaXR5VGVzdDogQ2hhbmdlRXF1YWxpdHlUZXN0PFByZXYsIE5leHQ+KSB7XG4gICAgaWYgKHByZXZzLmxlbmd0aCA9PT0gMCAmJiBuZXh0cy5sZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gQ2hhbmdlUmVwb3J0Mi5nZW5lcmF0ZVNpbmdsZXMocHJldnNbMF0sIG5leHRzWzBdLCBlcXVhbGl0eVRlc3QpO1xuXG4gICAgY29uc3QgcmVwb3J0ID0gbmV3IENoYW5nZVJlcG9ydDIoKTtcbiAgICBjb25zdCB2aXNpdGVkID0gbmV3IFNldCgpO1xuXG4gICAgZm9yIChsZXQgbmV4dEluZGV4ID0gMDsgbmV4dEluZGV4IDwgbmV4dHMubGVuZ3RoOyBuZXh0SW5kZXgrKykge1xuICAgICAgY29uc3QgbmV4dCA9IG5leHRzW25leHRJbmRleF07XG4gICAgICBjb25zdCBwcmV2SW5kZXggPSBwcmV2cy5maW5kSW5kZXgoKHByZXYsIHByZXZJbmRleCkgPT4gZXF1YWxpdHlUZXN0KHByZXYsIG5leHQsIHByZXZJbmRleCwgbmV4dEluZGV4KSk7XG4gICAgICByZXBvcnQudHJhbnNmb3JtLnB1c2gocHJldkluZGV4KTtcbiAgICAgIGlmIChwcmV2SW5kZXggIT09IC0xKVxuICAgICAgICB2aXNpdGVkLmFkZChwcmV2SW5kZXgpO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZXZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoIXZpc2l0ZWQuaGFzKGkpKVxuICAgICAgICByZXBvcnQucmVtb3ZlZC5wdXNoKGkpO1xuICAgIH1cblxuICAgIHJldHVybiByZXBvcnQ7XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgQ2hhbmdlRXF1YWxpdHlUZXN0PFByZXYsIE5leHQ+ID0gKHByZXY6IFByZXYsIG5leHQ6IE5leHQsIHByZXZJbmRleDogbnVtYmVyLCBuZXh0SW5kZXg6IG51bWJlcikgPT4gYm9vbGVhbjtcblxuZXhwb3J0IGNvbnN0IGZpcnN0ID0gPFgsIFk+KGFycmF5OiBSZWFkb25seUFycmF5PFg+LCBmdW5jOiAodmFsdWU6IFgsIGluZGV4OiBudW1iZXIpID0+IFkgfCBudWxsKTogWSB8IG51bGwgPT4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdmFsdWUgPSBhcnJheVtpXTtcbiAgICBjb25zdCByZXN1bHQgPSBmdW5jKHZhbHVlLCBpKTtcbiAgICBpZiAocmVzdWx0ICE9PSBudWxsKVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGNvbnN0IGxhc3QgPSA8WCwgWSBleHRlbmRzIHt9PihhcnJheTogUmVhZG9ubHlBcnJheTxYPiwgZnVuYzogKHZhbHVlOiBYLCBpbmRleDogbnVtYmVyKSA9PiBZIHwgbnVsbCB8IGZhbHNlIHwgdW5kZWZpbmVkIHwgMCk6IFkgfCBudWxsID0+IHtcbiAgZm9yIChsZXQgaSA9IGFycmF5Lmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICBjb25zdCB2YWx1ZSA9IGFycmF5W2ldO1xuICAgIGNvbnN0IHJlc3VsdCA9IGZ1bmModmFsdWUsIGkpO1xuICAgIGlmIChyZXN1bHQpXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuIiwgIlxuLyoqXG4gKiBBIHNob3J0IHV0aWxpdHkgZm9yIHJlLXVzaW5nIG9sZCBvYmplY3RzXG4gKiB0byBhdm9pZCBkb2luZyB0b28gbXVjaCBHQyB0aHJhc2hpbmcsIGF0IHRoZVxuICogY29zdCBvZiBpbmNyZWFzZWQgbWVtb3J5LlxuICogXG4gKiBEb24ndCBrbm93IHlldCBpZiB0aGUgdHJhZGUgb2ZmIGl0IHdvcnRoIGl0LlxuICovXG5leHBvcnQgdHlwZSBPYmplY3RQb29sPFQsIFRBcmdzIGV4dGVuZHMgdW5rbm93bltdPiA9IHtcbiAgbWF4U2l6ZTogbnVtYmVyLFxuICBzaXplOiBudW1iZXIsXG5cbiAgYWxsOiBUW10sXG4gIGF2YWlsYWJsZTogVFtdLFxuXG4gIGFjcXVpcmUoLi4uYXJnczogVEFyZ3MpOiBULFxuICByZWxlYXNlKHZhbHVlOiBUKTogdm9pZCxcbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZU9iamVjdFBvb2wgPSA8VCwgVEFyZ3MgZXh0ZW5kcyB1bmtub3duW10+KFxuICBidWlsZDogKC4uLmFyZ3M6IFRBcmdzKSA9PiBULFxuICBhc3NpZ246ICh2YWx1ZTogVCwgLi4uYXJnczogVEFyZ3MpID0+IHZvaWQsXG4pOiBPYmplY3RQb29sPFQsIFRBcmdzPiA9PiB7XG4gIGNvbnN0IHBvb2wgPSB7XG4gICAgbWF4U2l6ZTogMjU2LFxuICAgIGF2YWlsYWJsZTogW10gYXMgVFtdLFxuICAgIGFsbDogW10gYXMgVFtdLFxuICAgIGdldCBzaXplKCkge1xuICAgICAgcmV0dXJuIHBvb2wuYXZhaWxhYmxlLmxlbmd0aDtcbiAgICB9LFxuICAgIGFjcXVpcmUoLi4uYXJnczogVEFyZ3MpOiBUIHtcbiAgICAgIGxldCBvYmplY3QgPSBwb29sLmF2YWlsYWJsZS5wb3AoKTtcbiAgICAgIGlmICghb2JqZWN0KSB7XG4gICAgICAgIG9iamVjdCA9IGJ1aWxkKC4uLmFyZ3MpO1xuICAgICAgICBwb29sLmFsbC5wdXNoKG9iamVjdCk7XG4gICAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgICB9XG5cbiAgICAgIGFzc2lnbihvYmplY3QsIC4uLmFyZ3MpO1xuICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICB9LFxuICAgIHJlbGVhc2UodmFsdWU6IFQpIHtcbiAgICAgIC8vaWYgKHBvb2wuc2l6ZSA8IHBvb2wubWF4U2l6ZSlcbiAgICAgIHBvb2wuYXZhaWxhYmxlLnB1c2godmFsdWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcG9vbDtcbn0iLCAiaW1wb3J0IHsgY3JlYXRlSWQsIEVsZW1lbnQsIE9wYXF1ZUlELCBzcGVjaWFsTm9kZVR5cGVzLCBTdXNwZW5kUHJvcHMgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5pbXBvcnQgeyBjcmVhdGVPYmplY3RQb29sIH0gZnJvbSBcIi4vcG9vbFwiO1xuXG4vKipcbiAqIEEgc2luZ2xlIGNvbnNpc3RlbnQgaWQgcmVwcmVzZW50aW5nIGEgY29tbWl0IGluIHRoZSBhY3QgdHJlZS5cbiAqIERvZXMgbm90IGNoYW5nZS5cbiAqL1xuZXhwb3J0IHR5cGUgQ29tbWl0SUQgPSBPcGFxdWVJRDxcIkNvbW1pdElEXCI+O1xuLyoqXG4gKiBBIElEIGZvciBhIHBhcnRpY3VsYXIgX3N0YXRlXyBhICoqQ29tbWl0KiogaXMgaW4gLSBldmVyeSB0aW1lIGl0IG9yIGl0c1xuICogY2hpbGRyZW4gY2hhbmdlLCBhIGNvbW1pdCB3aXRoIHRoZSBzYW1lIElkIGJ1dCBhIG5ldyBDb21taXRWZXJzaW9uXG4gKiBpcyBhZGRlZCB0byB0aGUgdHJlZSwgcmVwbGFjaW5nIHRoZSBwcmV2aW91cy5cbiAqL1xuZXhwb3J0IHR5cGUgQ29tbWl0VmVyc2lvbiA9IE9wYXF1ZUlEPFwiQ29tbWl0VmVyc2lvblwiPjtcblxuZXhwb3J0IGNsYXNzIENvbW1pdFJlZjIge1xuICBpZDogQ29tbWl0SUQ7XG4gIHBhcmVudDogbnVsbCB8IENvbW1pdFJlZjI7XG4gIGxlbmd0aDogbnVtYmVyO1xuXG4gIHByaXZhdGUgY29uc3RydWN0b3IoaWQ6IENvbW1pdElELCBwYXJlbnQ6IENvbW1pdFJlZjIgfCBudWxsKSB7XG4gICAgdGhpcy5pZCA9IGlkO1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIGlmIChwYXJlbnQpXG4gICAgICB0aGlzLmxlbmd0aCA9IHBhcmVudC5sZW5ndGggKyAxO1xuICAgIGVsc2VcbiAgICAgIHRoaXMubGVuZ3RoID0gMTtcbiAgfVxuXG4gIC8qXG4gIFtTeW1ib2wuaXRlcmF0b3JdKCkge1xuICAgIHJldHVybiB0aGlzLmFuY2VzdG9ycygpO1xuICB9XG4gICAgKi9cbiAgXG4gIC8qKlxuICAgKiBJdGVyYXRlIHRob3VnaCBhbGwgXCJwYXJlbnRcIiBjb21taXQgcmVmcyxcbiAgICogaW5jbHVkaW5nIGl0c2VsZiBhcyB0aGUgZmlyc3QgZW50cnkuXG4gICAqIFxuICAgKiBAcmV0dXJucyBJdGVyYXRvcjxDb21taXRSZWYyPlxuICAgKi9cbiAgKmFuY2VzdG9ycygpIHtcbiAgICBsZXQgcmVmOiBDb21taXRSZWYyIHwgbnVsbCA9IHRoaXM7XG5cbiAgICB3aGlsZSAocmVmKSB7XG4gICAgICB5aWVsZCByZWY7XG4gICAgICByZWYgPSByZWYucGFyZW50O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBcbiAgICogQHBhcmFtIGNsaW1iZXIgQSBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGV2ZXJ5IGFuY2VzdG9yIGNvbW1pdCByZWYsXG4gICAqIGluY2x1ZGluZyB0aGlzIG9uZS4gUmV0dXJuIFwidHJ1ZVwiIHRvIHN0b3AgY2xpbWJpbmcgZWFybHkuXG4gICAqL1xuICBjbGltYihjbGltYmVyOiAocmVmOiBDb21taXRSZWYyKSA9PiBib29sZWFuIHwgdm9pZCkge1xuICAgIGxldCByZWY6IENvbW1pdFJlZjIgfCBudWxsID0gdGhpcztcbiAgICB3aGlsZSAocmVmKSB7XG4gICAgICBpZiAoY2xpbWJlcihyZWYpKVxuICAgICAgICByZXR1cm47XG5cbiAgICAgIHJlZiA9IHJlZi5wYXJlbnQ7XG4gICAgfVxuICB9XG5cbiAgZmluZDxUPih0ZXN0OiAoaWQ6IENvbW1pdFJlZjIpID0+IFQgfCBudWxsIHwgdW5kZWZpbmVkIHwgZmFsc2UpOiBUIHwgbnVsbCB7XG4gICAgbGV0IHJlc3VsdDogVCB8IG51bGwgPSBudWxsO1xuICAgIHRoaXMuY2xpbWIocmVmID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbnRSZXN1bHQgPSB0ZXN0KHJlZik7XG4gICAgICBpZiAoY3VycmVudFJlc3VsdCkge1xuICAgICAgICByZXN1bHQgPSBjdXJyZW50UmVzdWx0XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHN0YXRpYyBmcmVzaChwYXJlbnQ6IENvbW1pdFJlZjIgfCBudWxsKSB7XG4gICAgcmV0dXJuIG5ldyBDb21taXRSZWYyKGNyZWF0ZUlkKCdDb21taXRJRCcpLCBwYXJlbnQpO1xuICB9XG4gIHN0YXRpYyByZWh5ZHJhdGUoaWQ6IENvbW1pdElELCBsZW5ndGg6IG51bWJlcikge1xuICAgIGNvbnN0IHJlZiA9IG5ldyBDb21taXRSZWYyKGlkLCBudWxsKTtcbiAgICByZWYubGVuZ3RoID0gbGVuZ3RoO1xuICAgIHJldHVybiByZWY7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbW1pdDIge1xuICBzdGF0aWMgcG9vbCA9ICgpID0+IGNyZWF0ZU9iamVjdFBvb2w8Q29tbWl0MiwgQ29uc3RydWN0b3JQYXJhbWV0ZXJzPHR5cGVvZiBDb21taXQyPj4oXG4gICAgZnVuY3Rpb24gYWxsb2MgKHJlZiwgZWwsIGNoKSB7IHJldHVybiBuZXcgQ29tbWl0MihyZWYsIGVsLCBjaCkgfSxcbiAgICBmdW5jdGlvbiByZWFzc2lnbihjLCByZWYsIGVsLCBjaCkge1xuICAgICAgYy5yZWYgPSByZWY7XG4gICAgICBjLmVsZW1lbnQgPSBlbDtcbiAgICAgIGMuY2hpbGRyZW4gPSBjaDtcbiAgICAgIGMudmVyc2lvbiA9IGNyZWF0ZUlkKCdDb21taXRWZXJzaW9uJyk7XG4gICAgfVxuICApXG5cbiAgcmVmOiBDb21taXRSZWYyO1xuXG4gIGVsZW1lbnQ6IEVsZW1lbnQ7XG4gIGNoaWxkcmVuOiBDb21taXRSZWYyW107XG5cbiAgdmVyc2lvbjogQ29tbWl0VmVyc2lvbiA9IGNyZWF0ZUlkKCdDb21taXRWZXJzaW9uJyk7XG5cbiAgY29uc3RydWN0b3IocmVmOiBDb21taXRSZWYyLCBlbGVtZW50OiBFbGVtZW50LCBjaGlsZHJlbjogQ29tbWl0UmVmMltdKSB7XG4gICAgdGhpcy5yZWYgPSByZWY7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gIH1cblxuICB1cGRhdGUoZWxlbWVudDogbnVsbCB8IEVsZW1lbnQgPSBudWxsLCBjaGlsZHJlbjogbnVsbCB8IENvbW1pdFJlZjJbXSA9IG51bGwpIHtcbiAgICB0aGlzLnZlcnNpb24gPSBjcmVhdGVJZCgnQ29tbWl0VmVyc2lvbicpO1xuICAgIFxuICAgIGlmIChlbGVtZW50KVxuICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICBpZiAoY2hpbGRyZW4pXG4gICAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gIH1cblxuICBpc1N1c3BlbmRlZCgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5lbGVtZW50LnR5cGUgPT09IHNwZWNpYWxOb2RlVHlwZXMuc3VzcGVuZFxuICAgICAgJiYgKHRoaXMuZWxlbWVudC5wcm9wcyBhcyBTdXNwZW5kUHJvcHMpLnN1c3BlbmRlZFxuICAgICk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBFbGVtZW50IH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuaW1wb3J0IHsgQ29tbWl0MiwgQ29tbWl0SUQgfSBmcm9tIFwiLi9jb21taXQudHNcIjtcbmltcG9ydCB7IEVmZmVjdElELCBFZmZlY3RUYXNrIH0gZnJvbSBcIi4vc3RhdGUudHNcIjtcblxuLyoqXG4gKiBUaGUgRGVsdGEgY2xhc3MgcmVwcmVzZW50cyBhbiBhY2N1bXVsYXRpb25cbiAqIG9mIGNoYW5nZXMgb3ZlciB0aW1lLlxuICogXG4gKiBBIFdvcmtUaHJlYWQgbWF5IGRvIHNldmVyYWwgXCJwYXNzZXNcIiBvdmVyIHRoZSBDb21taXRUcmVlLFxuICogYnV0IGFsbCBvZiB0aG9zZSBjaGFuZ2VzIGFyZSB3cml0dGVuIHRvIHRoZSBzYW1lIERlbHRhLlxuICogXG4gKiBUaGUgRGVsdGEga2VlcHMgdHJhY2sgb2Ygb25seSB0aGUgaW1tZWRpYXRlbHkgcHJpb3Igc3RhdGUgKHRoZVxuICogbGFzdCBvbmUgdGhhdCB3YXMgc2VudCB0byB0aGUgUmVuZGVyZXIpLCBhbmQgdGhlIGZpbmFsIHN0YXRlLlxuICogXG4gKiBJZiBhIHBhc3MgY2F1c2VzIGEgY29tcG9uZW50IHRvIGJlIHJlbmRlcmVkL3VwZGF0ZWQgc2V2ZXJhbCB0aW1lcyxcbiAqIGl0IHdpbGwgb25seSBiZSByZWNvcmRlZCBpbiB0aGUgZGVsdGEgb25jZSBmb3IgaXQncyBmaW5hbCBzdGF0ZS4gU2ltaWxhcmx5LFxuICogaWYgYW4gZWxlbWVudCBpcyBjcmVhdGUgaW4gb25lIHBhc3MsIGJ1dCByZW1vdmVkIGluIGEgYW5vdGhlciwgdGhlbiBpdCB3aWxsXG4gKiBiZSBlbnRpcmVseSBleGNsdWRlZCBmcm9tIHRoZSBkZWx0YSAtIGFuZCB0aGUgcmVuZGVyZXIgd2lsbCBuZXZlciBrbm93IGl0IGV4aXN0ZWQuXG4gKiBcbiAqIFRoZSBEZWx0YSByZWNvcmRzIENvbW1pdHMgYXMgd2VsbCBhcyBFZmZlY3RzIHRoaXMgd2F5LlxuICovXG5leHBvcnQgY2xhc3MgRGVsdGEge1xuICBmcmVzaDogTWFwPENvbW1pdElELCBDb21taXQyPiA9IG5ldyBNYXAoKTtcbiAgY2hhbmdlZDogTWFwPENvbW1pdElELCB7IHByZXY6IEVsZW1lbnQsIG5leHQ6IENvbW1pdDIsIG1vdmVkOiBib29sZWFuIH0+ID0gbmV3IE1hcCgpO1xuICByZW1vdmVkOiBNYXA8Q29tbWl0SUQsIENvbW1pdDI+ID0gbmV3IE1hcCgpO1xuXG4gIGVmZmVjdHM6IE1hcDxFZmZlY3RJRCwgRWZmZWN0VGFzaz4gPSBuZXcgTWFwKCk7XG4gIGNsZWFudXBzOiBNYXA8RWZmZWN0SUQsIEVmZmVjdFRhc2s+ID0gbmV3IE1hcCgpO1xuXG4gIGdldCBzaXplKCkge1xuICAgIHJldHVybiAoXG4gICAgICArIHRoaXMuZnJlc2guc2l6ZVxuICAgICAgKyB0aGlzLmNoYW5nZWQuc2l6ZVxuICAgICAgKyB0aGlzLnJlbW92ZWQuc2l6ZVxuICAgIClcbiAgfVxuXG4gIGFkZChjb21taXQ6IENvbW1pdDIpIHtcbiAgICB0aGlzLmZyZXNoLnNldChjb21taXQucmVmLmlkLCBjb21taXQpXG4gIH1cbiAgdXBkYXRlKHByZXY6IEVsZW1lbnQsIG5leHQ6IENvbW1pdDIsIG1vdmVkOiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMuZnJlc2guaGFzKG5leHQucmVmLmlkKSkge1xuICAgICAgdGhpcy5mcmVzaC5zZXQobmV4dC5yZWYuaWQsIG5leHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjaGFuZ2UgPSB0aGlzLmNoYW5nZWQuZ2V0KG5leHQucmVmLmlkKTtcbiAgICAgIGlmIChjaGFuZ2UpIHtcbiAgICAgICAgY2hhbmdlLm5leHQgPSBuZXh0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jaGFuZ2VkLnNldChuZXh0LnJlZi5pZCwgeyBwcmV2LCBuZXh0LCBtb3ZlZCB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZGVsZXRlKGNvbW1pdDogQ29tbWl0Mikge1xuICAgIGlmICh0aGlzLmZyZXNoLmhhcyhjb21taXQucmVmLmlkKSkge1xuICAgICAgdGhpcy5mcmVzaC5kZWxldGUoY29tbWl0LnJlZi5pZCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaWYgKHRoaXMuY2hhbmdlZC5oYXMoY29tbWl0LnJlZi5pZCkpXG4gICAgICAgIHRoaXMuY2hhbmdlZC5kZWxldGUoY29tbWl0LnJlZi5pZCk7XG5cbiAgICAgIHRoaXMucmVtb3ZlZC5zZXQoY29tbWl0LnJlZi5pZCwgY29tbWl0KTtcbiAgICB9XG4gIH1cblxuICBhZGRFZmZlY3RzKHRhc2tzOiBFZmZlY3RUYXNrW10pIHtcbiAgICBmb3IgKGNvbnN0IHRhc2sgb2YgdGFza3MpIHtcbiAgICAgIHRoaXMuZWZmZWN0cy5zZXQodGFzay5pZCwgdGFzayk7XG4gICAgfVxuICB9XG5cbiAgYWRkQ2xlYW51cHModGFza3M6IEVmZmVjdFRhc2tbXSkge1xuICAgIGZvciAoY29uc3QgdGFzayBvZiB0YXNrcykge1xuICAgICAgdGhpcy5lZmZlY3RzLmRlbGV0ZSh0YXNrLmlkKTtcbiAgICAgIHRoaXMuY2xlYW51cHMuc2V0KHRhc2suaWQsIHRhc2spO1xuICAgIH1cbiAgfVxufSIsICJpbXBvcnQge1xuICBob29rSW1wbGVtZW50YXRpb24sIENvbnRleHQsXG4gIFZhbHVlT3JDYWxjdWxhdG9yLCBjYWxjdWxhdGVWYWx1ZSwgU3RhdGVTZXR0ZXIsXG4gIHJ1blVwZGF0ZXIsXG4gIGNyZWF0ZUlkLFxuICBjYWxjdWxhdGVEZXBzQ2hhbmdlLFxuICBFZmZlY3RDb25zdHJ1Y3RvcixcbiAgRGVwcyxcbiAgSG9va0ltcGxlbWVudGF0aW9uXG59IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcbmltcG9ydCB7IENvbXBvbmVudFN0YXRlLCBFZmZlY3RJRCwgRWZmZWN0VGFzayB9IGZyb20gXCIuL3N0YXRlXCI7XG5pbXBvcnQgeyBDb21taXRSZWYyIH0gZnJvbSBcIi4vY29tbWl0XCI7XG5pbXBvcnQgeyBSZWNvbmNpbGVyMiB9IGZyb20gXCIuL3JlY29uY2lsZXJcIjtcbmltcG9ydCB7IGxhc3QgfSBmcm9tIFwiLi9hbGdvcml0aG1zXCI7XG5cbi8qKlxuICogQSBmcmVzaCBzZXQgb2YgaG9vayBmdW5jdGlvbnMgaXMgY3JlYXRlZCBwZXIgY29tcG9uZW50IHJ1bi5cbiAqL1xuZXhwb3J0IGNvbnN0IGxvYWRIb29rczIgPSAoXG4gIHJlY29uY2lsZXI6IFJlY29uY2lsZXIyLFxuXG4gIHN0YXRlOiBDb21wb25lbnRTdGF0ZSxcbiAgcmVmOiBDb21taXRSZWYyXG4pOiBIb29rSW1wbGVtZW50YXRpb24gPT4ge1xuXG4gIGZ1bmN0aW9uIHVzZUNvbnRleHQ8VD4oY29udGV4dDogQ29udGV4dDxUPik6IFQge1xuICAgIGNvbnN0IHN0YXRlSW5kZXggPSBzdGF0ZS5ob29rSW5kZXgrKztcblxuICAgIGlmICghc3RhdGUucHJvdmlkZXJzLmhhcyhzdGF0ZUluZGV4KSkge1xuICAgICAgY29uc3QgcHJvdmlkZXIgPSByZWYuZmluZChyZWYgPT4ge1xuICAgICAgICBjb25zdCBwcm92aWRlciA9IHJlY29uY2lsZXIudHJlZS5jb250ZXh0cy5nZXQocmVmLmlkKVxuICAgICAgICBpZiAocHJvdmlkZXIgJiYgcHJvdmlkZXIuY29udGV4dElkID09PSBjb250ZXh0LmlkKVxuICAgICAgICAgIHJldHVybiBwcm92aWRlcjtcbiAgICAgIH0pXG4gICAgICBpZiAocHJvdmlkZXIpIHtcbiAgICAgICAgcHJvdmlkZXIuY29uc3VtZXJzLnNldChyZWYuaWQsIHJlZik7XG4gICAgICB9XG4gICAgICBzdGF0ZS5wcm92aWRlcnMuc2V0KHN0YXRlSW5kZXgsIHByb3ZpZGVyKTtcbiAgICB9XG4gICAgY29uc3QgcHJvdmlkZXIgPSBzdGF0ZS5wcm92aWRlcnMuZ2V0KHN0YXRlSW5kZXgpO1xuICAgIGlmIChwcm92aWRlcilcbiAgICAgIHJldHVybiBwcm92aWRlci52YWx1ZSBhcyBUO1xuICAgIHJldHVybiBjb250ZXh0LmRlZmF1bHRWYWx1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVzZVN0YXRlPFQ+KGluaXRpYWxWYWx1ZTogVmFsdWVPckNhbGN1bGF0b3I8VD4pOiBbVCwgU3RhdGVTZXR0ZXI8VD5dIHtcbiAgICBjb25zdCBzdGF0ZUluZGV4ID0gc3RhdGUuaG9va0luZGV4Kys7XG4gICAgaWYgKCFzdGF0ZS52YWx1ZXMuaGFzKHN0YXRlSW5kZXgpKVxuICAgICAgc3RhdGUudmFsdWVzLnNldChzdGF0ZUluZGV4LCBjYWxjdWxhdGVWYWx1ZShpbml0aWFsVmFsdWUpKTtcblxuICAgIGNvbnN0IHZhbHVlID0gc3RhdGUudmFsdWVzLmdldChzdGF0ZUluZGV4KSBhcyBUO1xuICAgIGNvbnN0IHNldFZhbHVlOiBTdGF0ZVNldHRlcjxUPiA9ICh1cGRhdGVyKSA9PiB7XG4gICAgICBpZiAoc3RhdGUudW5tb3VudGVkKVxuICAgICAgICByZXR1cm47XG4gICAgICBjb25zdCBwcmV2VmFsdWUgPSBzdGF0ZS52YWx1ZXMuZ2V0KHN0YXRlSW5kZXgpIGFzIFQ7XG4gICAgICBjb25zdCBuZXh0VmFsdWUgPSBydW5VcGRhdGVyKHByZXZWYWx1ZSwgdXBkYXRlcik7XG4gICAgICBpZiAocHJldlZhbHVlID09PSBuZXh0VmFsdWUpXG4gICAgICAgIHJldHVybjtcbiAgICAgIFxuICAgICAgc3RhdGUudmFsdWVzLnNldChzdGF0ZUluZGV4LCBuZXh0VmFsdWUpO1xuICAgICAgcmVjb25jaWxlci5yZW5kZXIocmVmKTtcbiAgICB9O1xuICAgIHJldHVybiBbdmFsdWUsIHNldFZhbHVlXTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gdXNlRWZmZWN0KGVmZmVjdDogRWZmZWN0Q29uc3RydWN0b3IsIGRlcHM6IERlcHMgPSBudWxsKSB7XG4gICAgY29uc3QgZWZmZWN0SW5kZXggPSBzdGF0ZS5ob29rSW5kZXgrKztcbiAgICBpZiAoIXN0YXRlLmVmZmVjdHMuaGFzKGVmZmVjdEluZGV4KSlcbiAgICAgIHN0YXRlLmVmZmVjdHMuc2V0KGVmZmVjdEluZGV4LCBjcmVhdGVJZChcIkVmZmVjdElEXCIpKTtcbiAgICBcbiAgICBjb25zdCBwcmV2RGVwcyA9IHN0YXRlLmRlcHMuZ2V0KGVmZmVjdEluZGV4KSB8fCBudWxsO1xuICAgIGNvbnN0IGVmZmVjdElkID0gc3RhdGUuZWZmZWN0cy5nZXQoZWZmZWN0SW5kZXgpIGFzIEVmZmVjdElEO1xuICAgIHN0YXRlLmRlcHMuc2V0KGVmZmVjdEluZGV4LCBkZXBzKTtcbiAgICBjb25zdCBkZXBzQ2hhbmdlcyA9IGNhbGN1bGF0ZURlcHNDaGFuZ2UocHJldkRlcHMsIGRlcHMpXG4gICAgXG4gICAgaWYgKGRlcHNDaGFuZ2VzKSB7XG4gICAgICBpZiAoIXN0YXRlLmVmZmVjdFRhc2tzKVxuICAgICAgICBzdGF0ZS5lZmZlY3RUYXNrcyA9IFtdO1xuICAgICAgXG4gICAgICBzdGF0ZS5lZmZlY3RUYXNrcy5wdXNoKHtcbiAgICAgICAgaWQ6IGVmZmVjdElkLFxuICAgICAgICByZWYsXG4gICAgICAgIGZ1bmMoKSB7XG4gICAgICAgICAgY29uc3QgcHJldkNsZWFudXAgPSBzdGF0ZS5jbGVhbnVwcy5nZXQoZWZmZWN0SWQpO1xuICAgICAgICAgIGlmIChwcmV2Q2xlYW51cCkge1xuICAgICAgICAgICAgc3RhdGUuY2xlYW51cHMuZGVsZXRlKGVmZmVjdElkKTtcbiAgICAgICAgICAgIHByZXZDbGVhbnVwKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0YXRlLmNsZWFudXBzLnNldChlZmZlY3RJZCwgZWZmZWN0KCkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4geyB1c2VDb250ZXh0LCB1c2VTdGF0ZSwgdXNlRWZmZWN0IH07XG59OyIsICJpbXBvcnQgeyBjb252ZXJ0Tm9kZVRvRWxlbWVudHMsIGNyZWF0ZUlkLCBFbGVtZW50LCBOb2RlLCBzcGVjaWFsTm9kZVR5cGVzIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuaW1wb3J0IHsgQ2hhbmdlRXF1YWxpdHlUZXN0LCBDaGFuZ2VSZXBvcnQyIH0gZnJvbSBcIi4vYWxnb3JpdGhtcy50c1wiO1xuaW1wb3J0IHsgQ29tbWl0MiwgQ29tbWl0SUQsIENvbW1pdFJlZjIgfSBmcm9tIFwiLi9jb21taXQudHNcIjtcbmltcG9ydCB7IGNyZWF0ZU9iamVjdFBvb2wsIE9iamVjdFBvb2wgfSBmcm9tIFwiLi9wb29sLnRzXCI7XG5cbi8qKlxuICogQSByZXF1ZXN0IHRvIHRyYW5zZm9ybSBwYXJ0IG9mIGEgdHJlZSBzcGVjaWZpZWQgYnlcbiAqIHRoZSBcInJlZlwiLiBDb250YWlucyB0aGUgaGlzdG9yeSBuZWVkZWQgdG8gcmVzb2x2ZSB0aGlzXG4gKiByZXF1ZXN0XG4gKi9cbmV4cG9ydCBjbGFzcyBXb3JrVGFzayB7XG4gIHN0YXRpYyBwb29sID0gY3JlYXRlT2JqZWN0UG9vbDxXb3JrVGFzaywgUGFyYW1ldGVyczx0eXBlb2YgdGhpcy5uZXc+PihcbiAgICAocmVmLCBwcmV2LCBuZXh0LCBtb3ZlZCkgPT4gbmV3IFdvcmtUYXNrKHJlZiwgcHJldiwgIG5leHQsIG1vdmVkKSxcbiAgICAodGFzaywgcmVmLCBwcmV2LCBuZXh0LCBtb3ZlZCA9IGZhbHNlKSA9PiB7XG4gICAgICB0YXNrLnJlZiA9IHJlZjtcbiAgICAgIHRhc2sucHJldiA9IHByZXY7XG4gICAgICB0YXNrLm5leHQgPSBuZXh0O1xuICAgICAgdGFzay5tb3ZlZCA9IG1vdmVkO1xuICAgIH1cbiAgKVxuXG4gIC8qKlxuICAgKiBUaGUgY29tbWl0IHRoYXQgc2hvdWxkIGV2YWx1YXRlIHRoaXNcbiAgICogdXBkYXRlIChpZiB0aGlzIGNvbW1pdCBkb2VzIG5vdCBleGlzdCxcbiAgICogaXQgc2hvdWxkIHVzZSB0aGlzIGFzIGl0J3MgSUQgYW5kIFBhdGgpLlxuICAgKiAqL1xuICByZWY6IENvbW1pdFJlZjI7XG5cbiAgLyoqIElmIG51bGwsIHRoaXMgdXBkYXRlIHNob3VsZCBjYXVzZVxuICAgKiB0aGlzIGNvbW1pdCB0byBiZSBjcmVhdGVkICovXG4gIHByZXY6IG51bGwgfCBDb21taXQyO1xuICAvKiogSWYgbnVsbCwgdGhpcyB1cGRhdGUgc2hvdWxkIGNhdXNlXG4gICAqIHRoaXMgY29tbWl0IHRvIGJlIHJlbW92ZWRcbiAgICovXG4gIG5leHQ6IG51bGwgfCBFbGVtZW50O1xuXG4gIC8vIFRPRE86IG1heWJlIGV4cG9zZSBwcmV2L25leHQgaW5kZXggaW5mb3JtYXRpb24/XG4gIG1vdmVkOiBib29sZWFuO1xuXG4gIHByaXZhdGUgY29uc3RydWN0b3IocmVmOiBDb21taXRSZWYyLCBwcmV2OiBudWxsIHwgQ29tbWl0MiwgbmV4dDogbnVsbCB8IEVsZW1lbnQsIG1vdmVkOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICB0aGlzLnJlZiA9IHJlZjtcbiAgICB0aGlzLnByZXYgPSBwcmV2O1xuICAgIHRoaXMubmV4dCA9IG5leHQ7XG4gICAgdGhpcy5tb3ZlZCA9IG1vdmVkO1xuICB9XG5cbiAgZnJlZSgpIHtcbiAgICBXb3JrVGFzay5wb29sLnJlbGVhc2UodGhpcyk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBuZXcocmVmOiBDb21taXRSZWYyLCBwcmV2OiBudWxsIHwgQ29tbWl0MiwgbmV4dDogbnVsbCB8IEVsZW1lbnQsIG1vdmVkOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICByZXR1cm4gdGhpcy5wb29sLmFjcXVpcmUocmVmLCBwcmV2LCBuZXh0LCBtb3ZlZClcbiAgfVxuXG4gIHN0YXRpYyBmcmVzaChyZWY6IENvbW1pdFJlZjIsIG5leHQ6IEVsZW1lbnQpIHtcbiAgICByZXR1cm4gV29ya1Rhc2submV3KHJlZiwgbnVsbCwgbmV4dClcbiAgfVxuICBzdGF0aWMgZXhpc3RpbmcocHJldjogQ29tbWl0MiwgbmV4dDogRWxlbWVudCkge1xuICAgIHJldHVybiBXb3JrVGFzay5uZXcocHJldi5yZWYsIHByZXYsIG5leHQpXG4gIH1cbiAgc3RhdGljIG1vdmUocHJldjogQ29tbWl0MiwgbmV4dDogRWxlbWVudCkge1xuICAgIHJldHVybiBXb3JrVGFzay5uZXcocHJldi5yZWYsIHByZXYsIG5leHQsIHRydWUpXG4gIH1cbiAgc3RhdGljIHJlbW92ZShwcmV2OiBDb21taXQyKSB7XG4gICAgcmV0dXJuIFdvcmtUYXNrLm5ldyhwcmV2LnJlZiwgcHJldiwgbnVsbClcbiAgfVxuICBzdGF0aWMgdmlzaXQocHJldjogQ29tbWl0Mikge1xuICAgIHJldHVybiBXb3JrVGFzay5uZXcocHJldi5yZWYsIHByZXYsIHByZXYuZWxlbWVudClcbiAgfVxufVxuXG5leHBvcnQgY29uc3Qga2V5ZWRFbGVtZW50RXF1YWxpdHlUZXN0MjogIENoYW5nZUVxdWFsaXR5VGVzdDxDb21taXQyLCBFbGVtZW50PiA9IChwcmV2LCBuZXh0LCBwcmV2X2luZGV4LCBuZXh0X2luZGV4KSA9PiB7XG4gIGNvbnN0IGNvbXBhdGlibGUgPSBwcmV2LmVsZW1lbnQudHlwZSA9PT0gbmV4dC50eXBlIHx8IHByZXYuZWxlbWVudC50eXBlID09PSBzcGVjaWFsTm9kZVR5cGVzLnBsYWNlaG9sZGVyO1xuICBpZiAoIWNvbXBhdGlibGUpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBwcmV2S2V5ID0gcHJldi5lbGVtZW50LnByb3BzLmtleTtcbiAgY29uc3QgbmV4dEtleSA9IG5leHQucHJvcHMua2V5O1xuICBpZiAocHJldktleSB8fCBuZXh0S2V5KVxuICAgIHJldHVybiBwcmV2S2V5ID09PSBuZXh0S2V5O1xuXG4gIHJldHVybiBwcmV2X2luZGV4ID09PSBuZXh0X2luZGV4O1xufVxuIiwgImltcG9ydCB7IFVuc2V0SG9va0ltcGxlbWVudGF0aW9uIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuaW1wb3J0IHsgQ29tcG9uZW50U3RhdGUgfSBmcm9tIFwiLi9zdGF0ZVwiO1xuXG5leHBvcnQgY29uc3QgdXNlSW50ZXJuYWxDb21wb25lbnRTdGF0ZSA9ICgpOiBDb21wb25lbnRTdGF0ZSA9PiB7XG4gIHJldHVybiBpbnRlcm5hbEhvb2tJbXBsZW1lbnRhdGlvbnMudXNlSW50ZXJuYWxDb21wb25lbnRTdGF0ZSgpO1xufVxuXG5leHBvcnQgY29uc3QgaW50ZXJuYWxIb29rSW1wbGVtZW50YXRpb25zID0ge1xuICB1c2VJbnRlcm5hbENvbXBvbmVudFN0YXRlKCk6IENvbXBvbmVudFN0YXRlIHtcbiAgICB0aHJvdyBuZXcgVW5zZXRIb29rSW1wbGVtZW50YXRpb24oKTtcbiAgfSxcbn0iLCAiaW1wb3J0IHtcbiAgRWxlbWVudCwgTm9kZSxcbiAgY29udmVydE5vZGVUb0VsZW1lbnRzLFxuICBDb21wb25lbnQsXG4gIGhvb2tJbXBsZW1lbnRhdGlvbixcbiAgRmFsbGJhY2ssXG4gIGgsXG4gIFN1c3BlbmQsXG59IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcbmltcG9ydCB7IENvbW1pdDIsIENvbW1pdFJlZjIgfSBmcm9tIFwiLi9jb21taXRcIjtcbmltcG9ydCB7IGxvYWRIb29rczIgfSBmcm9tIFwiLi9ob29rc1wiO1xuaW1wb3J0IHsgQm91bmRhcnlTdGF0ZSwgQ29tcG9uZW50U3RhdGUsIENvbnRleHRTdGF0ZSwgRWZmZWN0VGFzayB9IGZyb20gXCIuL3N0YXRlXCI7XG5pbXBvcnQgeyBrZXllZEVsZW1lbnRFcXVhbGl0eVRlc3QyLCBXb3JrVGFzayB9IGZyb20gXCIuL3VwZGF0ZVwiO1xuaW1wb3J0IHsgQ2hhbmdlUmVwb3J0MiB9IGZyb20gXCIuL2FsZ29yaXRobXNcIjtcbmltcG9ydCB7IENvbW1pdFRyZWUyIH0gZnJvbSBcIi4vdHJlZVwiO1xuaW1wb3J0IHsgaW50ZXJuYWxIb29rSW1wbGVtZW50YXRpb25zIH0gZnJvbSBcIi4vaW50ZXJuYWxcIjtcblxuLyoqXG4gKiBBIGRhdGEgc3RydWN0dXJlIHRoYXQgcmVwcmVzZW50cyB0aGUgaW1tZWRpYXRlIG91dHB1dFxuICogaW5zZXJ0aW5nIHNvbWV0aGluZyBpbnRvIHRoZSB0cmVlIHN1Y2ggYXM6XG4gKiAgLSBXaGF0IHRoZSBuZXcgY2hpbGRyZW4gd291bGQgYmVcbiAqICAtIEFkZGl0aW9uYWwgdGFza3MgdGhhdCBtaWdodCBuZWVkIHRvIGJlIGRvbmVcbiAqICAtIFNpZGUgZWZmZWN0cyBmcm9tIHJ1bm5pbmcgY29tcG9uZW50c1xuICogIC0gUmVqZWN0aW9uIHZhbHVlc1xuICogIC0gRXh0cmEgcmVuZGVyaW5nIHRhcmdldHMgdGhhdCBub3cgbmVlZCB0byBiZSBhY2NvdW50ZWQgZm9yXG4gKi9cbmV4cG9ydCBjbGFzcyBFbGVtZW50T3V0cHV0MiB7XG4gIGVsZW1lbnQ6IEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcmVmOiBDb21taXRSZWYyO1xuXG4gIGNoaWxkcmVuOiBFbGVtZW50W10gPSBbXTtcblxuICBwcmV2Q2hpbGRyZW46IENvbW1pdDJbXSB8IG51bGwgPSBudWxsO1xuXG4gIGNoaWxkUmVmczogQ29tbWl0UmVmMltdID0gW107XG4gIC8qKlxuICAgKiBQcm9jZXNzaW5nIGFuIGVsZW1lbnQgb2Ygc29tZSBraW5kIG9mdGVuXG4gICAqIGltcGxpZXMgY2hhbmdlcyB0byBpdCdzIGNoaWxkcmVuOiB0aGUgT3V0cHV0XG4gICAqIHdpbGwgcHJvZHVjZSBhZGRpdGlvbmFsIHRhc2tzIHRoYXQgYSB0aHJlYWQgc2hvdWxkIGVucXVldWUuXG4gICAqL1xuICB1cGRhdGVzOiBXb3JrVGFza1tdID0gW11cbiAgXG4gIGVmZmVjdHM6IG51bGwgfCBFZmZlY3RUYXNrW10gPSBudWxsO1xuICBjbGVhbnVwczogbnVsbCB8IEVmZmVjdFRhc2tbXSA9IG51bGw7XG5cbiAgZXh0cmFUYXJnZXRzOiBudWxsIHwgQ29tbWl0UmVmMltdID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihyZWY6IENvbW1pdFJlZjIpIHtcbiAgICB0aGlzLnJlZiA9IHJlZjtcbiAgfVxuXG4gIHByb2Nlc3NDb21wb25lbnQoY29tcG9uZW50OiBDb21wb25lbnQ8e30+LCBlbGVtZW50OiBFbGVtZW50LCB0cmVlOiBDb21taXRUcmVlMiwgc3RhdGU6IENvbXBvbmVudFN0YXRlKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICBzdGF0ZS5lZmZlY3RUYXNrcyA9IG51bGw7XG4gICAgXG4gICAgc3RhdGUuaG9va0luZGV4ID0gMDtcbiAgICBpZiAoIXN0YXRlLmhvb2tzKVxuICAgICAgc3RhdGUuaG9va3MgPSBsb2FkSG9va3MyKHRyZWUucmVjb25jaWxlciwgc3RhdGUsIHRoaXMucmVmKTtcblxuXG4gICAgaG9va0ltcGxlbWVudGF0aW9uLnVzZUNvbnRleHQgPSBzdGF0ZS5ob29rcy51c2VDb250ZXh0O1xuICAgIGhvb2tJbXBsZW1lbnRhdGlvbi51c2VFZmZlY3QgPSBzdGF0ZS5ob29rcy51c2VFZmZlY3Q7XG4gICAgaG9va0ltcGxlbWVudGF0aW9uLnVzZVN0YXRlID0gc3RhdGUuaG9va3MudXNlU3RhdGU7XG4gICAgaW50ZXJuYWxIb29rSW1wbGVtZW50YXRpb25zLnVzZUludGVybmFsQ29tcG9uZW50U3RhdGUgPSAoKSA9PiBzdGF0ZTtcblxuICAgIGNvbnN0IHByb3BzID0ge1xuICAgICAgLi4udGhpcy5lbGVtZW50LnByb3BzLFxuICAgICAgY2hpbGRyZW46IHRoaXMuZWxlbWVudC5jaGlsZHJlbixcbiAgICB9IGFzIFBhcmFtZXRlcnM8dHlwZW9mIGNvbXBvbmVudD5bMF07XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuc2V0Tm9kZShjb21wb25lbnQocHJvcHMpKTtcbiAgICAgIGlmIChzdGF0ZS5yZWplY3Rpb24pIHtcbiAgICAgICAgc3RhdGUucmVqZWN0aW9uID0gbnVsbDtcblxuICAgICAgICBpZiAoc3RhdGUuYm91bmRhcnkpXG4gICAgICAgICAgc3RhdGUuYm91bmRhcnkuY2xlYXJUaHJvdyh0aGlzLnJlZik7XG4gICAgICB9XG4gICAgICB0aGlzLmVmZmVjdHMgPSBzdGF0ZS5lZmZlY3RUYXNrcztcbiAgICAgIHRoaXMuY2FsY3VsYXRlRGlmZigpO1xuICAgIH0gY2F0Y2ggKHRocm93blZhbHVlKSB7XG4gICAgXG4gICAgICBpZiAoIXN0YXRlLmJvdW5kYXJ5KSB7XG4gICAgICAgIGNvbnN0IGJvdW5kYXJ5ID0gdHJlZS5maW5kQ2xvc2VzdEJvdW5kYXJ5KHRoaXMucmVmKTtcbiAgICAgICAgaWYgKCFib3VuZGFyeSlcbiAgICAgICAgICB0aHJvdyB0aHJvd25WYWx1ZTtcblxuICAgICAgICBzdGF0ZS5ib3VuZGFyeSA9IGJvdW5kYXJ5O1xuICAgICAgfVxuICAgICAgLy8gdXBkYXRlIGNvbXBvbmVudCBzdGF0ZSB0byBrbm93IHdlIHJlamVjdGVkXG4gICAgICBzdGF0ZS5yZWplY3Rpb24gPSB7IHZhbHVlOiB0aHJvd25WYWx1ZSB9O1xuICAgICAgc3RhdGUuYm91bmRhcnkuYWRkVGhyb3codGhpcy5yZWYsIHRocm93blZhbHVlKTtcblxuICAgICAgaWYgKHRoaXMucHJldkNoaWxkcmVuKVxuICAgICAgICB0aGlzLmNoaWxkUmVmcyA9IHRoaXMucHJldkNoaWxkcmVuLm1hcChjID0+IGMucmVmKTtcbiAgICB9XG4gIH1cblxuICBwcm9jZXNzUHJpbWl0aXZlKGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMuc2V0Tm9kZSh0aGlzLmVsZW1lbnQuY2hpbGRyZW4pO1xuICAgIHRoaXMuY2FsY3VsYXRlRGlmZigpO1xuICB9XG5cbiAgcHJvY2Vzc1Byb3ZpZGVyKGVsZW1lbnQ6IEVsZW1lbnQsIHN0YXRlOiBDb250ZXh0U3RhdGU8dW5rbm93bj4pIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMuc2V0Tm9kZSh0aGlzLmVsZW1lbnQuY2hpbGRyZW4pO1xuXG4gICAgaWYgKHN0YXRlLnZhbHVlICE9PSBlbGVtZW50LnByb3BzLnZhbHVlKSB7XG4gICAgICBzdGF0ZS52YWx1ZSA9IGVsZW1lbnQucHJvcHMudmFsdWU7XG4gICAgICB0aGlzLmV4dHJhVGFyZ2V0cyA9IFsuLi5zdGF0ZS5jb25zdW1lcnMudmFsdWVzKCldO1xuICAgIH1cbiAgICB0aGlzLmNhbGN1bGF0ZURpZmYoKTtcbiAgfVxuICBwcm9jZXNzQm91bmRhcnkoZWxlbWVudDogRWxlbWVudCwgc3RhdGU6IEJvdW5kYXJ5U3RhdGUpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIGNvbnN0IGZhbGxiYWNrRWxlbWVudCA9ICEhZWxlbWVudC5wcm9wcy5mYWxsYmFjayAmJiBoKEZhbGxiYWNrLCB7fSwgZWxlbWVudC5wcm9wcy5mYWxsYmFjayBhcyBOb2RlKVxuXG4gICAgaWYgKHN0YXRlLm1vZGUgPT09ICdub3JtYWwnKSB7XG4gICAgICB0aGlzLnNldE5vZGUoW2goU3VzcGVuZCwgeyBzdXNwZW5kZWQ6IGZhbHNlIH0sIHRoaXMuZWxlbWVudC5jaGlsZHJlbildKTtcbiAgICAgIHRoaXMuY2FsY3VsYXRlRGlmZigpO1xuICAgIH0gZWxzZSBpZiAoZmFsbGJhY2tFbGVtZW50KSB7XG4gICAgICAvLyBIYW5kbGUgYSBib3VuZGFyeVxuICAgICAgdGhpcy5zZXROb2RlKFtoKFN1c3BlbmQsIHsgc3VzcGVuZGVkOiB0cnVlIH0sIHRoaXMuZWxlbWVudC5jaGlsZHJlbiksIGZhbGxiYWNrRWxlbWVudF0pO1xuICAgICAgdGhpcy5jYWxjdWxhdGVEaWZmKCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY2hpbGRFbGVtZW50ID0gdGhpcy5jaGlsZHJlbltpXTtcbiAgICAgICAgaWYgKGNoaWxkRWxlbWVudC5pZCA9PT0gZmFsbGJhY2tFbGVtZW50LmlkKSB7XG4gICAgICAgICAgY29uc3QgY2hpbGRDb21taXQgPSB0aGlzLmNoaWxkUmVmc1tpXTtcbiAgICAgICAgICBzdGF0ZS5mYWxsYmFja1JlZiA9IGNoaWxkQ29tbWl0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlRGlmZigpIHtcbiAgICBpZiAodGhpcy5wcmV2Q2hpbGRyZW4gJiYgdGhpcy5jaGlsZHJlbi5sZW5ndGggIT09IDApIHtcbiAgICAgIGNvbnN0IGNoYW5nZXMgPSBDaGFuZ2VSZXBvcnQyLmdlbmVyYXRlKHRoaXMucHJldkNoaWxkcmVuLCB0aGlzLmNoaWxkcmVuLCBrZXllZEVsZW1lbnRFcXVhbGl0eVRlc3QyKTtcblxuICAgICAgZm9yIChsZXQgY2hpbGRJbmRleCA9IDA7IGNoaWxkSW5kZXggPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IGNoYW5nZXMudHJhbnNmb3JtW2NoaWxkSW5kZXhdO1xuICAgICAgXG4gICAgICAgIGlmICh0cmFuc2Zvcm0gPT09IC0xKSB7XG4gICAgICAgICAgY29uc3QgbmV3UmVmID0gQ29tbWl0UmVmMi5mcmVzaCh0aGlzLnJlZik7XG4gICAgICAgICAgdGhpcy51cGRhdGVzLnB1c2goV29ya1Rhc2suZnJlc2gobmV3UmVmLCB0aGlzLmNoaWxkcmVuW2NoaWxkSW5kZXhdKSk7XG4gICAgICAgICAgdGhpcy5jaGlsZFJlZnMucHVzaChuZXdSZWYpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHByZXZDb21taXQgPSB0aGlzLnByZXZDaGlsZHJlblt0cmFuc2Zvcm1dXG4gICAgICAgICAgdGhpcy5jaGlsZFJlZnMucHVzaChwcmV2Q29tbWl0LnJlZik7XG4gICAgICAgICAgY29uc3QgbW92ZWQgPSBjaGlsZEluZGV4ICE9PSB0cmFuc2Zvcm07XG4gICAgICAgICAgaWYgKG1vdmVkKVxuICAgICAgICAgICAgdGhpcy51cGRhdGVzLnB1c2goV29ya1Rhc2subW92ZShwcmV2Q29tbWl0LCB0aGlzLmNoaWxkcmVuW2NoaWxkSW5kZXhdKSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpcy51cGRhdGVzLnB1c2goV29ya1Rhc2suZXhpc3RpbmcocHJldkNvbW1pdCwgdGhpcy5jaGlsZHJlbltjaGlsZEluZGV4XSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmb3IgKGxldCByZW1vdmVkSW5kZXggPSAwOyByZW1vdmVkSW5kZXggPCBjaGFuZ2VzLnJlbW92ZWQubGVuZ3RoOyByZW1vdmVkSW5kZXgrKykge1xuICAgICAgICBjb25zdCBwcmV2Q29tbWl0ID0gdGhpcy5wcmV2Q2hpbGRyZW5bY2hhbmdlcy5yZW1vdmVkW3JlbW92ZWRJbmRleF1dXG4gICAgICAgIHRoaXMudXBkYXRlcy5wdXNoKFdvcmtUYXNrLnJlbW92ZShwcmV2Q29tbWl0KSlcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCF0aGlzLnByZXZDaGlsZHJlbikge1xuICAgICAgLy8gSWYgdGhlcmUgd2VyZSBubyBwcmV2aW91cyBjaGlsZHJlbiwgYWx3YXlzIGdlbmVyYXRlIFwiQ3JlYXRlXCIgdGFza3NcbiAgICAgIHRoaXMudXBkYXRlcyA9IHRoaXMuY2hpbGRyZW4ubWFwKGNoaWxkID0+IFdvcmtUYXNrLmZyZXNoKENvbW1pdFJlZjIuZnJlc2godGhpcy5yZWYpLCBjaGlsZCkpO1xuICAgICAgdGhpcy5jaGlsZFJlZnMgPSB0aGlzLnVwZGF0ZXMubWFwKGMgPT4gYy5yZWYpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0aGVyZSB3aWxsIGJlIG5vIGNoaWxkcmVuIGluIHRoZSBmdXR1cmUsIGdlbmVyYXRlIFwiUmVtb3ZlXCIgdGFza3NcbiAgICAgIHRoaXMudXBkYXRlcyA9IHRoaXMucHJldkNoaWxkcmVuLm1hcChjaGlsZCA9PiBXb3JrVGFzay5yZW1vdmUoY2hpbGQpKTtcbiAgICAgIHRoaXMuY2hpbGRSZWZzID0gW107XG4gICAgfVxuICB9XG5cbiAgc2V0Tm9kZShub2RlOiBOb2RlKSB7XG4gICAgdGhpcy5jaGlsZHJlbiA9IGNvbnZlcnROb2RlVG9FbGVtZW50cyhub2RlKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGNyZWF0ZUlkLCBFbGVtZW50IH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuaW1wb3J0IHsgQ29tbWl0MiwgQ29tbWl0SUQsIENvbW1pdFJlZjIgfSBmcm9tIFwiLi9jb21taXQudHNcIjtcbmltcG9ydCB7IERlbHRhIH0gZnJvbSBcIi4vZGVsdGEudHNcIjtcbmltcG9ydCB7IENvbW1pdFRyZWUyIH0gZnJvbSBcIi4vdHJlZS50c1wiO1xuaW1wb3J0IHsgV29ya1Rhc2sgfSBmcm9tIFwiLi91cGRhdGUudHNcIjtcbmltcG9ydCB7IEVmZmVjdFRhc2sgfSBmcm9tIFwiLi9zdGF0ZS50c1wiO1xuXG5leHBvcnQgdHlwZSBXb3JrUmVhc29uID1cbiAgfCB7IHR5cGU6ICdtb3VudCcsIGVsZW1lbnQ6IEVsZW1lbnQsIHJlZjogQ29tbWl0UmVmMiB9XG4gIHwgeyB0eXBlOiAndW5tb3VudCcsIHJlZjogQ29tbWl0UmVmMiB9XG4gIHwgeyB0eXBlOiAndGFyZ2V0JywgcmVmOiBDb21taXRSZWYyIH1cblxuZXhwb3J0IHR5cGUgUXVldWVSZXN1bHQgPVxuICB8ICduZXctdGFzaydcbiAgfCAnbWlzc2VkJ1xuICB8ICdleGlzdGluZy10YXJnZXQnXG4gIHwgJ2V4aXN0aW5nLXRhc2snXG5cbi8qKlxuICogQSB0ZW1wb3JhcnkgZGF0YSBzdHJ1Y3R1cmUgdGhhdCBjYXJyaWVzIHRoZSBzdGF0ZSBvZiBhXG4gKiB3b3JrLWluLXByb2dyZXNzIHVwZGF0ZSB0byB0aGUgdHJlZS5cbiAqXG4gKiBBbiB1cGRhdGUgdG8gdGhlIHRyZWUgaXMgZGVzaWduZWQgdG8gYmUgYnJva2VuIHVwIC0gdGhlIHNjaGVkdWxlclxuICogd2lsbCBjb250aW51YWxseSBjYWxsIHRoZSBcIndvcmtcIiBmdW5jdGlvbiBtYW55IHRpbWVzLlxuICovXG5leHBvcnQgY2xhc3MgV29ya1RocmVhZDIge1xuICB0cmVlOiBDb21taXRUcmVlMjtcblxuICAvKipcbiAgICogRWFjaCB0aW1lIGFuIGV4dGVybmFsIHN5c3RlbSBhZGRzIGFuIHVwZGF0ZSB0byB0aGUgY3VycmVudCB0aHJlYWQsXG4gICAqIHRoZXkgcmVjb3JkIHRoZSBcInJlYXNvblwiLCBzbyB5b3UgY2FuIHRyYWNlIHdoaWNoIGVmZmVjdHNcbiAgICogY2F1c2UvY29udHJpYnV0ZWQgdG8gdGhpcyB0aHJlYWQuXG4gICAqL1xuICByZWFzb25zOiBXb3JrUmVhc29uW10gPSBbXTtcbiAgLyoqXG4gICAqIEEgTWFwIG9mIGV2ZXJ5IGNvbW1pdCB0aGF0IE5FRURTIHRvIGJlIHJlbmRlcmVkIGlmIHlvdSB2aXNpdCB0aGVtLlxuICAgKiBUaGlzIGlzIG9mdGVuIGZvciBjb21taXRzIHRoYXQgZXhwbGljaXRseSBuZWVkIGEgcmUtcmVuZGVyIGJlY2F1c2VcbiAgICogdGhleSB1cGRhdGVkIGFuZCBhcmUgdGhlIHJlYXNvbiBmb3IgdGhlIHJlLXJlbmRlci5cbiAgICovXG4gIG11c3RSZW5kZXI6IFNldDxDb21taXRJRD4gPSBuZXcgU2V0KCk7XG4gIC8qKlxuICAgKiBBIFNldCBvZiBldmVyeSBjb21taXQgdGhhdCBORUVEUyB0byBiZSB2aXNpdGVkLiBOb3JtYWxseSxcbiAgICogd2hlbiBhbiB1cGRhdGUgaXMgcmVxdWVzdGVkIGFsbCB0aGUgdGFyZ2V0J3MgcGFyZW50cyBhcmVcbiAgICogbGFiZWxsZWQgXCJtdXN0VmlzaXRcIiBzbyBhbnkgdXBkYXRlIHRocmVhZCBzaG91bGQgZ2V0IHRvXG4gICAqIHRoZSB0YXJnZXQgZXZlbnR1YWxseS5cbiAgICovXG4gIG11c3RWaXNpdDogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcbiAgXG4gIC8qKlxuICAgKiBBIHN0YWNrIG9mIFwiVXBkYXRlXCIgb2JqZWN0cyByZXByZXNlbnRpbmcgQ29tbWl0cyAob2Z0ZW5cbiAgICogY2hpbGRyZW4gb2YgY29tbWl0cyBqdXN0IHByb2Nlc3NlZClcbiAgICovXG4gIHBlbmRpbmdUYXNrczogV29ya1Rhc2tbXSA9IFtdO1xuXG4gIC8qKiBcbiAgICogV2hlbiBhIGNoYW5nZSBpcyByZXF1ZXN0ZWQgb24gYSB0aHJlYWQsIGJ1dCB0aGUgdGFyZ2V0XG4gICAqIGNvbW1pdCBoYXMgYWxyZWFkeSBiZWVuIFwidmlzaXRlZFwiLCB3ZSBpbnN0ZWFkIHB1dCBpdFxuICAgKiBpbiBvdXQgXCJtaXNzZWRcIiBiYWNrbG9nLlxuICAgKiBcbiAgICogT25jZSBhIHRocmVhZCBoYXMgY29tcGxldGVkIGFsbCBpdCdzIHVwZGF0ZXMsIGl0IG1heVxuICAgKiBzdGFydCBhbiBhZGRpdGlvbmFsIFwicGFzc1wiLCByZXNldHRpbmcgaXRzZWxmIChidXQgbm90IGl0J3MgXCJEZWx0YVNldFwiKVxuICAgKiBhbmQgbG9hZGluZyBpbiBhbGwgdGhlIG1pc3NlZCB0YXJnZXRzIGFzIG5ldyB1cGRhdGVzLlxuICAqL1xuICBtaXNzZWQ6IFNldDxDb21taXRJRD4gPSBuZXcgU2V0KCk7XG5cbiAgdW5tb3VudE1pc3NlZDogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcblxuXG4gIGVycm9yTm90aWZpY2F0aW9uczogTWFwPENvbW1pdElELCBDb21taXRSZWYyPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogQSBsaXN0IG9mIGVhY2ggY29tbWl0IHRoZSB0aHJlYWQgcHJvY2Vzc2VkXG4gICAqL1xuICB2aXNpdGVkOiBTZXQ8Q29tbWl0SUQ+ID0gbmV3IFNldCgpO1xuXG4gIGRlbHRhOiBEZWx0YSA9IG5ldyBEZWx0YSgpO1xuXG4gIGlkID0gY3JlYXRlSWQoXCJUaHJlYWRJRFwiKVxuICBwYXNzZXMgPSAxO1xuXG4gIGNvbnN0cnVjdG9yKHRyZWU6IENvbW1pdFRyZWUyKSB7XG4gICAgdGhpcy50cmVlID0gdHJlZTtcbiAgfVxuXG4gIGdldCBkb25lKCkge1xuICAgIHJldHVybiB0aGlzLnBlbmRpbmdUYXNrcy5sZW5ndGggPT09IDAgJiYgdGhpcy5taXNzZWQuc2l6ZSA9PT0gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgc29tZSB3b3JrIHRvIGJlIGRvbmUgYnkgdGhlIHRocmVhZC5cbiAgICogXG4gICAqIEBwYXJhbSByZWFzb24gXG4gICAqIEByZXR1cm5zIHRydWUgaWYgdGhlIFRocmVhZCBjYW4gYWNjZXB0IHRoZSB3b3JrLCBvciBmYWxzZSBcbiAgICogaWYgdGhlIFRocmVhZCBoYXMgYWxyZWFkeSByZW5kZXJlZCB0aGlzIGVsZW1lbnQgKHlvdVxuICAgKiBoYXZlIHRvIHF1ZXVlIGl0IGluIHRoZSBuZXh0IHRocmVhZClcbiAgICovXG4gIHF1ZXVlKHJlYXNvbjogV29ya1JlYXNvbik6IFF1ZXVlUmVzdWx0IHtcbiAgICAvLyBXZSBhcmUgdmVyeSBsYXp5IGluIHRoaXMgZnVuY3Rpb24gLSAgd2Ugb25seVxuICAgIC8vIHdhbnQgdG8gY3JlYXRlIGEgbmV3IHVwZGF0ZSBhdCB0aGUgd29yc3QgcG9zc2libGVcbiAgICAvLyBjYXNlXG4gICAgdGhpcy5yZWFzb25zLnB1c2gocmVhc29uKTtcblxuICAgIC8vIE1vdW50cyBhcmUgcmVhbGx5IGVhc3kgLSB0aGV5IG5ldmVyIGhhdmUgYW55IGhpc3RvcnksIHNvXG4gICAgLy8gd2UgZG9uJ3QgbmVlZCB0byBjaGVjayBmb3IgY29uZmxpY3RzLlxuICAgIGlmIChyZWFzb24udHlwZSA9PT0gJ21vdW50Jykge1xuICAgICAgdGhpcy5wZW5kaW5nVGFza3MucHVzaChXb3JrVGFzay5mcmVzaChyZWFzb24ucmVmLCByZWFzb24uZWxlbWVudCkpO1xuICAgICAgcmV0dXJuICduZXctdGFzayc7XG4gICAgfVxuICAgIGlmICh0aGlzLnZpc2l0ZWQuaGFzKHJlYXNvbi5yZWYuaWQpKSB7XG4gICAgICBpZiAocmVhc29uLnR5cGUgPT09ICd1bm1vdW50Jykge1xuICAgICAgICB0aGlzLnVubW91bnRNaXNzZWQuYWRkKHJlYXNvbi5yZWYuaWQpO1xuICAgICAgICByZXR1cm4gJ21pc3NlZCdcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0aGlzLm1pc3NlZC5hZGQocmVhc29uLnJlZi5pZCk7XG4gICAgICAgIHJldHVybiAnbWlzc2VkJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgcmVhc29uIGlzIGFscmVhZHkgaW4gdGhlIFwibXVzdFJlbmRlclwiLFxuICAgIC8vIHdlIGFscmVhZHkgaW50ZW5kIHRvIHJlbmRlciBpdCwgc28gZG8gbm90aGluZ1xuICAgIGlmICh0aGlzLm11c3RSZW5kZXIuaGFzKHJlYXNvbi5yZWYuaWQpKVxuICAgICAgcmV0dXJuICdleGlzdGluZy10YXJnZXQnO1xuICAgIHRoaXMubXVzdFJlbmRlci5hZGQocmVhc29uLnJlZi5pZCk7XG5cbiAgICAvLyBTZWFyY2ggdGhyb3VnaCBhbGwgdGhlIHBhcmVudHMsIGxvb2tpbmcgdG8gc2VlIGlmXG4gICAgLy8gdGhlcmUgYXJlIGFueSBwZW5kaW5nVGFza3MgdGhhdCBtaWdodFxuICAgIC8vIGxlYWQgdG8gdGhpcyBjb21taXQuIElmIHNvLCBtYWtlIHN1cmUgYW5jZXN0b3IgY29tbWl0XG4gICAgLy8gaXMgb24gdGhlIE11c3RWaXNpdCBzbyB0aGV5IHNob3VsZCBtYWtlIHRoZWlyIHdheSBkb3duXG4gICAgLy8gZXZlbnR1YWxseVxuICAgIGxldCBhbmNlc3RvcjogQ29tbWl0UmVmMiB8IG51bGwgPSByZWFzb24ucmVmO1xuICAgIHdoaWxlIChhbmNlc3Rvcikge1xuICAgICAgdGhpcy5tdXN0VmlzaXQuYWRkKGFuY2VzdG9yLmlkKTtcblxuICAgICAgLy8gSWYgd2UgZmluZCB0aGVyZSBpcyBhbiBVcGRhdGUgYWxyZWFkeVxuICAgICAgLy8gZXhpc3RpbmcgdG8gaGFuZGxlIG91ciBjb21taXQsIGV4aXQgZWFybHlcbiAgICAgIGZvciAoY29uc3QgdXBkYXRlIG9mIHRoaXMucGVuZGluZ1Rhc2tzKSB7XG4gICAgICAgIGlmICh1cGRhdGUucmVmLmlkID09PSBhbmNlc3Rvci5pZCkge1xuICAgICAgICAgIHJldHVybiAnZXhpc3RpbmctdGFzayc7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGFuY2VzdG9yID0gYW5jZXN0b3IucGFyZW50O1xuICAgIH1cblxuICAgIC8vIFRoZXJlIGFyZSBubyB1cGRhdGVzIChxdWV1ZWQgcGllY2VzIG9mIHdvcmspXG4gICAgLy8gV2UgbmVlZCBhdCBsZWFzdCBvbmUgdG8ga2ljayBvZmYgdGhlIHJlbmRlcmluZyBwcm9jZXNzXG5cbiAgICAvLyBXZSdyZSBnb2luZyB0byBqdXN0IHNraXAgYWxsIHRoZSBwYXJlbnRzIHVwIHVudGlsIHRoZVxuICAgIC8vIHNwZWNpZmljIGNvbW1pdCB3ZSB3YW50IHRvIHJlbmRlclxuICAgIGFuY2VzdG9yID0gcmVhc29uLnJlZjtcbiAgICB3aGlsZSAoYW5jZXN0b3IpIHtcbiAgICAgIGlmIChhbmNlc3Rvci5pZCAhPT0gcmVhc29uLnJlZi5pZClcbiAgICAgICAgdGhpcy52aXNpdGVkLmFkZChhbmNlc3Rvci5pZCk7XG4gICAgICBcbiAgICAgIGFuY2VzdG9yID0gYW5jZXN0b3IucGFyZW50O1xuICAgIH1cblxuICAgIGNvbnN0IHByZXYgPSB0aGlzLnRyZWUuY29tbWl0cy5nZXQocmVhc29uLnJlZi5pZCkgYXMgQ29tbWl0MjtcbiAgICBzd2l0Y2ggKHJlYXNvbi50eXBlKSB7XG4gICAgICBjYXNlICd0YXJnZXQnOlxuICAgICAgICB0aGlzLnBlbmRpbmdUYXNrcy5wdXNoKFdvcmtUYXNrLnZpc2l0KHByZXYpKVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3VubW91bnQnOlxuICAgICAgICB0aGlzLnBlbmRpbmdUYXNrcy5wdXNoKFdvcmtUYXNrLnJlbW92ZShwcmV2KSlcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiAnbmV3LXRhc2snO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gdGhlIHdvcmsgdG8gYWRkIGEgZnJlc2ggY29tbWl0IGludG8gdGhlIHRyZWUsXG4gICAqIGVucXVldWluZyBhZGRpdGlvbmFsIHdvcmsgb250byB0aGUgdGhyZWFkIGlmIHRoZSBjb21taXQgaGFzIGNoaWxkcmVuLlxuICAgKiBcbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdGhhdCB0aGUgY29tbWl0IHdpbGwgaGF2ZS5cbiAgICogQHBhcmFtIHJlZiBUaGUgbG9jYXRpb24gd2hlcmUgdGhlIGNvbW1pdCB3aWxsIGJlIGluc3RhbGxlZC5cbiAgICovXG4gIGNyZWF0ZUNvbW1pdChlbGVtZW50OiBFbGVtZW50LCByZWY6IENvbW1pdFJlZjIpIHtcbiAgICBjb25zdCBvdXRwdXQgPSB0aGlzLnRyZWUucHJvY2Vzc0VsZW1lbnQoZWxlbWVudCwgcmVmLCBudWxsKTtcbiAgICAgICAgXG4gICAgY29uc3QgY29tbWl0ID0gdGhpcy50cmVlLnJlY29uY2lsZXIucG9vbHMuY29tbWl0LmFjcXVpcmUocmVmLCBlbGVtZW50LCBvdXRwdXQuY2hpbGRSZWZzKTtcblxuICAgIHRoaXMudHJlZS5jb21taXRzLnNldChjb21taXQucmVmLmlkLCBjb21taXQpO1xuICAgIHRoaXMuZGVsdGEuYWRkKGNvbW1pdCk7XG4gICAgaWYgKGNvbW1pdC5yZWYubGVuZ3RoID09PSAxKVxuICAgICAgdGhpcy50cmVlLnJvb3RzLmFkZChjb21taXQucmVmLmlkKTtcblxuICAgIGlmIChvdXRwdXQuZWZmZWN0cylcbiAgICAgIHRoaXMuZGVsdGEuYWRkRWZmZWN0cyhvdXRwdXQuZWZmZWN0cyk7XG5cbiAgICB0aGlzLnBlbmRpbmdUYXNrcy5wdXNoKC4uLm91dHB1dC51cGRhdGVzKTtcbiAgfVxuICB1cGRhdGVDb21taXQoY29tbWl0OiBDb21taXQyLCBlbGVtZW50OiBFbGVtZW50LCBtb3ZlZDogYm9vbGVhbikge1xuICAgIGNvbnN0IG91dHB1dCA9IHRoaXMudHJlZS5wcm9jZXNzRWxlbWVudChlbGVtZW50LCBjb21taXQucmVmLCBjb21taXQpO1xuXG4gICAgY29uc3Qgb2xkRWxlbWVudCA9IGNvbW1pdC5lbGVtZW50O1xuICAgIGNvbW1pdC51cGRhdGUoZWxlbWVudCwgb3V0cHV0LmNoaWxkUmVmcyk7XG4gICAgdGhpcy5kZWx0YS51cGRhdGUob2xkRWxlbWVudCwgY29tbWl0LCBtb3ZlZCk7XG5cbiAgICB0aGlzLnBlbmRpbmdUYXNrcy5wdXNoKC4uLm91dHB1dC51cGRhdGVzKTtcbiAgICBpZiAob3V0cHV0LmVmZmVjdHMpXG4gICAgICB0aGlzLmRlbHRhLmFkZEVmZmVjdHMob3V0cHV0LmVmZmVjdHMpO1xuICB9XG4gIHJlbW92ZUNvbW1pdChjb21taXQ6IENvbW1pdDIpIHtcbiAgICBjb25zdCBvdXRwdXQgPSB0aGlzLnRyZWUudW5tb3VudENvbW1pdChjb21taXQpO1xuXG4gICAgdGhpcy50cmVlLmNvbW1pdHMuZGVsZXRlKGNvbW1pdC5yZWYuaWQpO1xuICAgIHRoaXMuZGVsdGEuZGVsZXRlKGNvbW1pdCk7XG4gICAgaWYgKGNvbW1pdC5yZWYubGVuZ3RoID09PSAxKVxuICAgICAgdGhpcy50cmVlLnJvb3RzLmRlbGV0ZShjb21taXQucmVmLmlkKTtcblxuICAgIHRoaXMucGVuZGluZ1Rhc2tzLnB1c2goLi4ub3V0cHV0LnVwZGF0ZXMpO1xuICAgIGlmIChvdXRwdXQuY2xlYW51cHMpXG4gICAgICB0aGlzLmRlbHRhLmFkZEVmZmVjdHMob3V0cHV0LmNsZWFudXBzKTtcbiAgfVxuICBza2lwQ29tbWl0KGNvbW1pdDogQ29tbWl0Mikge1xuICAgIGNvbnN0IHByZXZDaGlsZHJlbiA9IGNvbW1pdC5jaGlsZHJlblxuICAgICAgLm1hcChjID0+IHRoaXMudHJlZS5jb21taXRzLmdldChjLmlkKSBhcyBDb21taXQyKTtcblxuICAgIGNvbnN0IHVwZGF0ZXMgPSBwcmV2Q2hpbGRyZW4ubWFwKHByZXYgPT4gV29ya1Rhc2sudmlzaXQocHJldikpOyAgXG4gICAgdGhpcy5wZW5kaW5nVGFza3MucHVzaCguLi51cGRhdGVzKTtcblxuICAgIGNvbW1pdC51cGRhdGUoKTtcbiAgfVxuXG4gIHZpc2l0KHVwZGF0ZTogV29ya1Rhc2spIHtcbiAgICB0aGlzLnZpc2l0ZWQuYWRkKHVwZGF0ZS5yZWYuaWQpO1xuICAgIFxuICAgIGlmICh1cGRhdGUubmV4dCAmJiAhdXBkYXRlLnByZXYpIHtcbiAgICAgIHRoaXMuY3JlYXRlQ29tbWl0KHVwZGF0ZS5uZXh0LCB1cGRhdGUucmVmKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodXBkYXRlLm5leHQgJiYgdXBkYXRlLnByZXYpIHtcbiAgICAgIHRoaXMudXBkYXRlQ29tbWl0KHVwZGF0ZS5wcmV2LCB1cGRhdGUubmV4dCwgdXBkYXRlLm1vdmVkKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoIXVwZGF0ZS5uZXh0ICYmIHVwZGF0ZS5wcmV2KSB7XG4gICAgICB0aGlzLnJlbW92ZUNvbW1pdCh1cGRhdGUucHJldik7XG4gICAgfVxuICB9XG5cbiAgcHJvY2Vzc1Rhc2sodGFzazogV29ya1Rhc2spIHtcbiAgICBjb25zdCB7IG5leHQsIHByZXYsIHJlZiB9ID0gdGFzaztcblxuICAgIGNvbnN0IGlkZW50aWNhbENoYW5nZSA9IG5leHQgJiYgcHJldiAmJiAobmV4dC5pZCA9PT0gcHJldi5lbGVtZW50LmlkKTtcblxuICAgIGlmIChpZGVudGljYWxDaGFuZ2UpIHtcbiAgICAgIGNvbnN0IG11c3RWaXNpdCA9IHRoaXMubXVzdFZpc2l0LmhhcyhyZWYuaWQpO1xuICAgICAgaWYgKCFtdXN0VmlzaXQpXG4gICAgICAgIHJldHVybjtcblxuICAgICAgY29uc3QgbXVzdFJlbmRlciA9IHRoaXMubXVzdFJlbmRlci5oYXMocmVmLmlkKTtcblxuICAgICAgaWYgKCFtdXN0UmVuZGVyKSB7XG4gICAgICAgIHRoaXMuc2tpcENvbW1pdChwcmV2KVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgdGhpcy52aXNpdCh0YXNrKTtcbiAgfVxuXG4gIHdvcmsoKSB7XG4gICAgY29uc3QgdGFzayA9IHRoaXMucGVuZGluZ1Rhc2tzLnBvcCgpO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICB0aGlzLnByb2Nlc3NUYXNrKHRhc2spO1xuICAgICAgdGFzay5mcmVlKCk7XG4gICAgfSBlbHNlIGlmICghdGhpcy5kb25lKSB7XG4gICAgICB0aGlzLnN0YXJ0TmV4dFBhc3MoKTtcbiAgICB9XG4gIH1cblxuICBzdGFydE5leHRQYXNzKCkge1xuICAgIHRoaXMucGVuZGluZ1Rhc2tzID0gW107XG4gICAgdGhpcy5tdXN0UmVuZGVyLmNsZWFyKCk7XG4gICAgdGhpcy5tdXN0VmlzaXQuY2xlYXIoKTtcbiAgICB0aGlzLnZpc2l0ZWQuY2xlYXIoKTtcblxuICAgIHRoaXMucGFzc2VzKys7XG5cbiAgICBjb25zdCBtaXNzZWRDb21taXQgPSBbLi4udGhpcy5taXNzZWRdXG4gICAgICAubWFwKGlkID0+IHRoaXMudHJlZS5jb21taXRzLmdldChpZCkpXG4gICAgICAuZmlsdGVyKHggPT4gISF4KVxuICAgICAgLnNvcnQoKGEsIGIpID0+IGEucmVmLmxlbmd0aCAtIGIucmVmLmxlbmd0aCk7XG5cbiAgICBjb25zdCB1bm1vdW50aW5nUmVmcyA9IG5ldyBNYXAoWy4uLnRoaXMudW5tb3VudE1pc3NlZF1cbiAgICAgIC5tYXAoaWQgPT4gdGhpcy50cmVlLmNvbW1pdHMuZ2V0KGlkKSlcbiAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXG4gICAgICAubWFwKGMgPT4gW2MucmVmLmlkLCBjLnJlZl0pXG4gICAgKSBcblxuICAgIGZvciAoY29uc3QgY29tbWl0UmVmIG9mIHVubW91bnRpbmdSZWZzLnZhbHVlcygpKSB7XG4gICAgICB0aGlzLnF1ZXVlKHsgdHlwZTogJ3VubW91bnQnLCByZWY6IGNvbW1pdFJlZiB9KTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGNvbW1pdCBvZiBtaXNzZWRDb21taXQpIHtcbiAgICAgIGlmIChjb21taXQucmVmLmZpbmQocmVmID0+IHVubW91bnRpbmdSZWZzLmhhcyhyZWYuaWQpKSlcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIHRoaXMucXVldWUoeyB0eXBlOiAndGFyZ2V0JywgcmVmOiBjb21taXQucmVmIH0pO1xuICAgIH1cbiAgICB0aGlzLm1pc3NlZC5jbGVhcigpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQ29tbWl0SUQsIENvbW1pdFJlZjIgfSBmcm9tIFwiLi9jb21taXQudHNcIjtcbmltcG9ydCB7IE9wYXF1ZUlELCBEZXBzLCBFZmZlY3RDbGVhbnVwLCBDb250ZXh0SUQsIEhvb2tJbXBsZW1lbnRhdGlvbiwgY3JlYXRlSWQsIEJvdW5kYXJ5UHJvcHMgfSBmcm9tICdAbHVrZWthYWxpbS9hY3QnO1xuaW1wb3J0IHsgQ29tbWl0VHJlZTIgfSBmcm9tIFwiLi90cmVlLnRzXCI7XG5cbmV4cG9ydCB0eXBlIEhvb2tJRCA9IG51bWJlcjtcbmV4cG9ydCB0eXBlIEVmZmVjdElEID0gT3BhcXVlSUQ8XCJFZmZlY3RJRFwiPjtcbmV4cG9ydCB0eXBlIEVmZmVjdFRhc2sgPSB7XG4gIHJlZjogQ29tbWl0UmVmMixcbiAgaWQ6IEVmZmVjdElELFxuICBmdW5jOiAoKSA9PiB2b2lkLFxufVxuXG5leHBvcnQgdHlwZSBDb21wb25lbnRTdGF0ZSA9IHtcbiAgcmVmOiBDb21taXRSZWYyO1xuXG4gIHVubW91bnRlZDogYm9vbGVhbixcblxuICBob29rSW5kZXg6IEhvb2tJRCxcbiAgaG9va3M6IG51bGwgfCBIb29rSW1wbGVtZW50YXRpb24sXG4gIGVmZmVjdFRhc2tzOiBudWxsIHwgRWZmZWN0VGFza1tdLFxuXG4gIHZhbHVlczogICBNYXA8SG9va0lELCB1bmtub3duPjtcbiAgZGVwczogICAgIE1hcDxIb29rSUQsIERlcHM+O1xuICBlZmZlY3RzOiAgTWFwPEhvb2tJRCwgRWZmZWN0SUQ+O1xuICBjbGVhbnVwczogIE1hcDxIb29rSUQsIEVmZmVjdENsZWFudXA+O1xuXG4gIHJlamVjdGlvbjogbnVsbCB8IHsgdmFsdWU6IHVua25vd24gfTtcbiAgYm91bmRhcnk6IG51bGwgfCBCb3VuZGFyeVN0YXRlO1xuXG4gIHByb3ZpZGVyczogIE1hcDxIb29rSUQsIG51bGwgfCBDb250ZXh0U3RhdGU8dW5rbm93bj4+O1xufTtcblxuZXhwb3J0IHR5cGUgQ29udGV4dFN0YXRlPFQ+ID0ge1xuICBpZDogQ29tbWl0SUQsXG4gIGNvbnRleHRJZDogQ29udGV4dElELFxuICBjb25zdW1lcnM6IE1hcDxDb21taXRJRCwgQ29tbWl0UmVmMj4sXG4gIHZhbHVlOiBULFxufVxuXG5leHBvcnQgdHlwZSBCb3VuZGFyeUlEID0gT3BhcXVlSUQ8XCJCb3VuZGFyeUlEXCI+O1xuXG5leHBvcnQgY2xhc3MgQm91bmRhcnlTdGF0ZSB7XG4gIHRyZWU6IENvbW1pdFRyZWUyO1xuXG4gIGlkOiBCb3VuZGFyeUlEO1xuICByZWY6IENvbW1pdFJlZjI7XG5cbiAgLyoqXG4gICAqIFdoZW4gdGhlIGJvdW5kYXJ5IGlzIGluIFwiZmFsbGJhY2tcIlxuICAgKiBtb2RlLCB0aGlzIHNob3VsZCByZWZlcmVuY2UgdGhlIGltbWVkaWF0ZVxuICAgKiBmYWxsYmFjayBub2RlIHRoYXQgd2FzIGdlbmVyYXRlZC5cbiAgICovXG4gIGZhbGxiYWNrUmVmOiBudWxsIHwgQ29tbWl0UmVmMiA9IG51bGw7XG5cbiAgdmFsdWVzOiBNYXA8Q29tbWl0SUQsIHVua25vd24+ID0gbmV3IE1hcCgpO1xuXG4gIGdldCBtb2RlKCk6ICdub3JtYWwnIHwgJ2ZhbGxiYWNrJyB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzLnNpemUgPT09IDBcbiAgICAgID8gJ25vcm1hbCdcbiAgICAgIDogJ2ZhbGxiYWNrJ1xuICB9XG5cbiAgY29uc3RydWN0b3IodHJlZTogQ29tbWl0VHJlZTIsIHJlZjogQ29tbWl0UmVmMikge1xuICAgIHRoaXMudHJlZSA9IHRyZWU7XG4gICAgdGhpcy5yZWYgPSByZWY7XG4gICAgdGhpcy5pZCA9IGNyZWF0ZUlkKFwiQm91bmRhcnlJRFwiKTtcbiAgfVxuXG4gIGFkZFRocm93KHJlZjogQ29tbWl0UmVmMiwgdGhyb3duVmFsdWU6IHVua25vd24pIHtcbiAgICBpZiAodGhpcy5tb2RlID09PSAnbm9ybWFsJylcbiAgICAgIHRoaXMudHJlZS5yZWNvbmNpbGVyLnJlbmRlcih0aGlzLnJlZik7XG4gICAgXG4gICAgdGhpcy52YWx1ZXMuc2V0KHJlZi5pZCwgdGhyb3duVmFsdWUpO1xuXG4gICAgY29uc3QgY29tbWl0ID0gdGhpcy50cmVlLmNvbW1pdHMuZ2V0KHRoaXMucmVmLmlkKTtcbiAgICBpZiAoY29tbWl0KSB7XG4gICAgICBjb25zdCBvblRocm93ID0gKGNvbW1pdC5lbGVtZW50LnByb3BzIGFzIEJvdW5kYXJ5UHJvcHMpLm9uVGhyb3c7XG4gICAgICBpZiAob25UaHJvdylcbiAgICAgICAgb25UaHJvdyh0aHJvd25WYWx1ZSwgWy4uLnRoaXMudmFsdWVzLnZhbHVlcygpXSk7XG4gICAgfVxuICB9XG4gIFxuICBjbGVhclRocm93KHJlZjogQ29tbWl0UmVmMikge1xuICAgIHRoaXMudmFsdWVzLmRlbGV0ZShyZWYuaWQpO1xuXG4gICAgaWYgKHRoaXMubW9kZSA9PT0gJ25vcm1hbCcpXG4gICAgICB0aGlzLnRyZWUucmVjb25jaWxlci5yZW5kZXIodGhpcy5yZWYpO1xuXG4gICAgY29uc3QgY29tbWl0ID0gdGhpcy50cmVlLmNvbW1pdHMuZ2V0KHRoaXMucmVmLmlkKTtcbiAgICBpZiAoY29tbWl0KSB7XG4gICAgICBjb25zdCBvbkNsZWFyID0gKGNvbW1pdC5lbGVtZW50LnByb3BzIGFzIEJvdW5kYXJ5UHJvcHMpLm9uQ2xlYXI7XG4gICAgICBpZiAob25DbGVhcilcbiAgICAgICAgb25DbGVhcigpO1xuICAgIH1cbiAgfVxufSIsICJpbXBvcnQgeyBDb250ZXh0SUQsIEVsZW1lbnQsIHNwZWNpYWxOb2RlVHlwZXMgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5pbXBvcnQgeyBDb21taXQyLCBDb21taXRJRCwgQ29tbWl0UmVmMiB9IGZyb20gXCIuL2NvbW1pdC50c1wiO1xuaW1wb3J0IHsgRWxlbWVudE91dHB1dDIgfSBmcm9tIFwiLi9lbGVtZW50LnRzXCI7XG5pbXBvcnQgeyBCb3VuZGFyeVN0YXRlLCBDb21wb25lbnRTdGF0ZSwgQ29udGV4dFN0YXRlLCBFZmZlY3RJRCB9IGZyb20gXCIuL3N0YXRlLnRzXCI7XG5pbXBvcnQgeyBSZWNvbmNpbGVyMiB9IGZyb20gXCIuL3JlY29uY2lsZXIudHNcIjtcbmltcG9ydCB7IGxhc3QgfSBmcm9tIFwiLi9hbGdvcml0aG1zLnRzXCI7XG5cbi8qKlxuICogVGhlIENvbW1pdFRyZWUgaXMgcmVzcG9uc2libGUgZm9yIGtlZXBpbmcgdHJhY2tcbiAqIG9mIGFjdCdzIFwiY2Fub25cIiB1bmRlcnN0YW5kaW5nIG9mIHRoZSBhcHBsaWNhdGlvbiB0cmVlLFxuICogaW5jbHVkaW5nIHJlZmVyZW5jZXMgdG8gYWxsIGxpdmUgY29tbWl0cywgYWxsIGNvbXBvbmVudFxuICogc3RhdGUsIGFsbCBjb250ZXh0IHN0YXRlIGFuZCBzdWNoLlxuICogXG4gKiBUaGUga2V5IG1ldGhvZHMgaGVyZSBhcmUgXCJwcm9jZXNzRWxlbWVudFwiLCB3aGljaFxuICogaXMgdGhlIGdhdGV3YXkgaW50byBnZXR0aW5nIGFuIGVsZW1lbnQgaW50byB0aGUgdHJlZSxcbiAqIGFuZCBcInVubW91bnRDb21taXRcIiwgd2hpY2ggY2xlYXJzIGFsbCB0aGUgcmVmZXJlbmNlc1xuICogZnJvbSBhIHBhcnRpY3VsYXIgY29tbWl0LlxuICogXG4gKiBXaGlsZSBjaGFuZ2VzIGRvbmUgaGVyZSBhcmUgaW1tZWRpYXRlICh5b3UgYWx3YXlzIGdldFxuICogdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHRyZWUpLCB0aGUgcmVuZGVyZXIgd29uJ3Qgc2VlIGFueVxuICogaW50ZXJtZWRpYXRlIHN0YXRlcyAtIHRoZSByZXR1cm4gdmFsdWVzIG9mIFwicHJvY2Vzc1wiIGFuZCBcInVubW91bnRcIlxuICogaXMgbGF0ZXIgYWRkZWQgdG8gdGhlIFdvcmtUaHJlYWQncyBcIkRlbHRhXCIsIHdoaWNoIGlzIHRoZVxuICogYWN0dWFsIHZhbHVlIHBhc3NlcyB0byByZW5kZXJlcnMuXG4gKiBcbiAqIERvbid0IGZvcmdldCAtIGNvbW1pdHMgYXJlIG11dGFibGUhIE9uY2UgeW91IGdldCBhIHJlZmVyZW5jZVxuICogdG8gYSBjb21taXQsIHlvdSBhbHdheXMgaGF2ZSB0aGUgbGF0ZXN0IGNvcHkgb2YgaXQuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21taXRUcmVlMiB7XG4gIHJlY29uY2lsZXI6IFJlY29uY2lsZXIyO1xuXG4gIGNvbXBvbmVudHM6IE1hcDxDb21taXRJRCwgQ29tcG9uZW50U3RhdGU+ID0gbmV3IE1hcCgpO1xuICBjb250ZXh0czogTWFwPENvbW1pdElELCBDb250ZXh0U3RhdGU8dW5rbm93bj4+ID0gbmV3IE1hcCgpO1xuICBib3VuZGFyaWVzOiBNYXA8Q29tbWl0SUQsIEJvdW5kYXJ5U3RhdGU+ID0gbmV3IE1hcCgpO1xuXG4gIGNvbW1pdHM6IE1hcDxDb21taXRJRCwgQ29tbWl0Mj4gPSBuZXcgTWFwKCk7XG4gIHJvb3RzOiBTZXQ8Q29tbWl0SUQ+ID0gbmV3IFNldCgpO1xuXG4gIGNvbnN0cnVjdG9yKHJlY29uY2lsZXI6IFJlY29uY2lsZXIyKSB7XG4gICAgdGhpcy5yZWNvbmNpbGVyID0gcmVjb25jaWxlcjtcbiAgfVxuXG4gIGdldE9yQ3JlYXRlQ29tcG9uZW50U3RhdGUocmVmOiBDb21taXRSZWYyKSB7XG4gICAgbGV0IHN0YXRlID0gdGhpcy5jb21wb25lbnRzLmdldChyZWYuaWQpO1xuICAgIGlmICghc3RhdGUpIHtcbiAgICAgIHN0YXRlID0ge1xuICAgICAgICB1bm1vdW50ZWQ6IGZhbHNlLFxuICAgICAgICByZWYsXG4gICAgICAgIGhvb2tJbmRleDogMCxcbiAgICAgICAgcmVqZWN0aW9uOiBudWxsLFxuICAgICAgICBib3VuZGFyeTogbnVsbCxcbiAgICAgICAgaG9va3M6IG51bGwsXG4gICAgICAgIGVmZmVjdFRhc2tzOiBbXSxcbiAgICAgICAgY2xlYW51cHM6IG5ldyBNYXAoKSxcbiAgICAgICAgcHJvdmlkZXJzOiBuZXcgTWFwKCksXG4gICAgICAgIHZhbHVlczogbmV3IE1hcCgpLFxuICAgICAgICBkZXBzOiBuZXcgTWFwKCksXG4gICAgICAgIGVmZmVjdHM6IG5ldyBNYXAoKSxcbiAgICAgIH1cbiAgICAgIHRoaXMuY29tcG9uZW50cy5zZXQocmVmLmlkLCBzdGF0ZSk7XG4gICAgfVxuICAgIHJldHVybiBzdGF0ZTtcbiAgfVxuXG4gIGdldE9yQ3JlYXRlUHJvdmlkZXJTdGF0ZShyZWY6IENvbW1pdFJlZjIsIGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICBsZXQgc3RhdGUgPSB0aGlzLmNvbnRleHRzLmdldChyZWYuaWQpO1xuICAgIGlmICghc3RhdGUpIHtcbiAgICAgIHN0YXRlID0ge1xuICAgICAgICBpZDogcmVmLmlkLFxuICAgICAgICBjb250ZXh0SWQ6IGVsZW1lbnQucHJvcHMuaWQgYXMgQ29udGV4dElELFxuICAgICAgICB2YWx1ZTogZWxlbWVudC5wcm9wcy52YWx1ZSxcbiAgICAgICAgY29uc3VtZXJzOiBuZXcgTWFwKCksXG4gICAgICB9XG4gICAgICB0aGlzLmNvbnRleHRzLnNldChyZWYuaWQsIHN0YXRlKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0YXRlO1xuICB9XG4gIGdldE9yQ3JlYXRlQm91bmRhcnlTdGF0ZShyZWY6IENvbW1pdFJlZjIpIHtcbiAgICBsZXQgc3RhdGUgPSB0aGlzLmJvdW5kYXJpZXMuZ2V0KHJlZi5pZCk7XG4gICAgaWYgKCFzdGF0ZSkge1xuICAgICAgc3RhdGUgPSBuZXcgQm91bmRhcnlTdGF0ZSh0aGlzLCByZWYpO1xuICAgICAgdGhpcy5ib3VuZGFyaWVzLnNldChyZWYuaWQsIHN0YXRlKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0YXRlO1xuICB9XG5cbiAgZmluZENsb3Nlc3RCb3VuZGFyeShyZWY6IENvbW1pdFJlZjIpIHtcbiAgICBsZXQgYW5jZXN0b3I6IENvbW1pdFJlZjIgfCBudWxsID0gcmVmO1xuICAgIGxldCBsYXN0QW5jZXN0b3I6IENvbW1pdFJlZjIgfCBudWxsID0gbnVsbDtcblxuICAgIHdoaWxlIChhbmNlc3Rvcikge1xuICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzLmJvdW5kYXJpZXMuZ2V0KGFuY2VzdG9yLmlkKTtcbiAgICAgIGlmIChzdGF0ZSkge1xuICAgICAgICBpZiAoc3RhdGUubW9kZSA9PT0gJ2ZhbGxiYWNrJyAmJiBzdGF0ZS5mYWxsYmFja1JlZikge1xuICAgICAgICAgIC8vIG5lZWQgdG8gY2hlY2sgdGhhdCB3ZSBhcmUgbm90IFwiaW5cIiB0aGUgZmFsbGJhY2tcbiAgICAgICAgICBpZiAobGFzdEFuY2VzdG9yICYmIGxhc3RBbmNlc3Rvci5pZCA9PT0gc3RhdGUuZmFsbGJhY2tSZWYuaWQpIHtcbiAgICAgICAgICAgIC8vIHdlIGFyZSBpbiB0aGUgZmFsbGJhY2sgLSBjb250aW51ZSB0byBuZXh0IGFuY2VzdG9yXG4gICAgICAgICAgICBsYXN0QW5jZXN0b3IgPSBhbmNlc3RvcjtcbiAgICAgICAgICAgIGFuY2VzdG9yID0gYW5jZXN0b3IucGFyZW50O1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gb3RoZXJ3aXNlLCB3ZSd2ZSBmb3VuZCBvdXIgY2xvc2VzdCBib3VuZGFyeVxuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICB9XG5cbiAgICAgIGxhc3RBbmNlc3RvciA9IGFuY2VzdG9yO1xuICAgICAgYW5jZXN0b3IgPSBhbmNlc3Rvci5wYXJlbnQ7XG4gICAgfVxuICB9XG5cblxuICB1bm1vdW50Q29tbWl0KHByZXY6IENvbW1pdDIpIHtcbiAgICBjb25zdCBvdXRwdXQgPSBuZXcgRWxlbWVudE91dHB1dDIocHJldi5yZWYpO1xuICAgIG91dHB1dC5wcmV2Q2hpbGRyZW4gPSBwcmV2LmNoaWxkcmVuLm1hcChjID0+IHRoaXMuY29tbWl0cy5nZXQoYy5pZCkgYXMgQ29tbWl0Mik7XG4gIFxuICAgIHN3aXRjaCAodHlwZW9mIHByZXYuZWxlbWVudC50eXBlKSB7XG4gICAgICBjYXNlICdzeW1ib2wnOiB7XG4gICAgICAgIHN3aXRjaCAocHJldi5lbGVtZW50LnR5cGUpIHtcbiAgICAgICAgICBjYXNlIHNwZWNpYWxOb2RlVHlwZXMucHJvdmlkZXI6XG4gICAgICAgICAgICB0aGlzLmNvbnRleHRzLmRlbGV0ZShwcmV2LnJlZi5pZCk7XG4gICAgICAgICAgICAvLyB5b3UgbWlnaHQgdGhpbmsgd2UgaGF2ZSB0byBkbyBzb21lXG4gICAgICAgICAgICAvLyBzcGVjaWFsIGxvZ2ljIGFib3V0IG5vdGlmeWluZyBzdWJzY3JpYmVyc1xuICAgICAgICAgICAgLy8gdGhhdCB0aGUgY29udGV4dCBkaWVkLCBidXQgdGhlIHN1YnNjcmliZXJzIGFyZVxuICAgICAgICAgICAgLy8gYWxzbyBhYm91dCB0byBkaWUgc28gaXRzIG9rIVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBzcGVjaWFsTm9kZVR5cGVzLmJvdW5kYXJ5OlxuICAgICAgICAgICAgdGhpcy5ib3VuZGFyaWVzLmRlbGV0ZShwcmV2LnJlZi5pZCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ2Z1bmN0aW9uJzoge1xuICAgICAgICBjb25zdCBjb21wb25lbnRTdGF0ZSA9IHRoaXMuY29tcG9uZW50cy5nZXQocHJldi5yZWYuaWQpIGFzIENvbXBvbmVudFN0YXRlO1xuICAgICAgICBjb21wb25lbnRTdGF0ZS51bm1vdW50ZWQgPSB0cnVlO1xuICAgICAgICBmb3IgKGNvbnN0IHByb3ZpZGVyIG9mIGNvbXBvbmVudFN0YXRlLnByb3ZpZGVycy52YWx1ZXMoKSkge1xuICAgICAgICAgIGlmIChwcm92aWRlcilcbiAgICAgICAgICAgIHByb3ZpZGVyLmNvbnN1bWVycy5kZWxldGUocHJldi5yZWYuaWQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb21wb25lbnRTdGF0ZS5ib3VuZGFyeSAmJiBjb21wb25lbnRTdGF0ZS5yZWplY3Rpb24pIHtcbiAgICAgICAgICBjb21wb25lbnRTdGF0ZS5ib3VuZGFyeS5jbGVhclRocm93KHByZXYucmVmKTtcbiAgICAgICAgfVxuICAgICAgICBvdXRwdXQuY2xlYW51cHMgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBbaW5kZXgsIGNsZWFudXBdIG9mIGNvbXBvbmVudFN0YXRlLmNsZWFudXBzKSB7XG4gICAgICAgICAgaWYgKCFjbGVhbnVwKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgY29uc3QgaWQgPSBjb21wb25lbnRTdGF0ZS5lZmZlY3RzLmdldChpbmRleCkgYXMgRWZmZWN0SUQ7XG4gICAgICAgICAgb3V0cHV0LmNsZWFudXBzLnB1c2goe1xuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICByZWY6IHByZXYucmVmLFxuICAgICAgICAgICAgZnVuYzogY2xlYW51cFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29tcG9uZW50cy5kZWxldGUocHJldi5yZWYuaWQpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBvdXRwdXQuY2FsY3VsYXRlRGlmZigpO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cblxuICBwcm9jZXNzRWxlbWVudChlbGVtZW50OiBFbGVtZW50LCByZWY6IENvbW1pdFJlZjIsIGNvbW1pdDogKENvbW1pdDIgfCBudWxsKSkge1xuICAgIGNvbnN0IG91dHB1dCA9IG5ldyBFbGVtZW50T3V0cHV0MihyZWYpO1xuXG4gICAgaWYgKGNvbW1pdClcbiAgICAgIG91dHB1dC5wcmV2Q2hpbGRyZW4gPSBjb21taXQuY2hpbGRyZW4ubWFwKGMgPT4gdGhpcy5jb21taXRzLmdldChjLmlkKSBhcyBDb21taXQyKTtcblxuICAgIHN3aXRjaCAodHlwZW9mIGVsZW1lbnQudHlwZSkge1xuICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgb3V0cHV0LnByb2Nlc3NQcmltaXRpdmUoZWxlbWVudCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc3ltYm9sJzoge1xuICAgICAgICBzd2l0Y2ggKGVsZW1lbnQudHlwZSkge1xuICAgICAgICAgIGNhc2Ugc3BlY2lhbE5vZGVUeXBlcy5wcm92aWRlcjoge1xuICAgICAgICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzLmdldE9yQ3JlYXRlUHJvdmlkZXJTdGF0ZShyZWYsIGVsZW1lbnQpO1xuICAgICAgICAgICAgb3V0cHV0LnByb2Nlc3NQcm92aWRlcihlbGVtZW50LCBzdGF0ZSlcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYXNlIHNwZWNpYWxOb2RlVHlwZXMuYm91bmRhcnk6IHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5nZXRPckNyZWF0ZUJvdW5kYXJ5U3RhdGUocmVmKTtcbiAgICAgICAgICAgIG91dHB1dC5wcm9jZXNzQm91bmRhcnkoZWxlbWVudCwgc3RhdGUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNhc2Ugc3BlY2lhbE5vZGVUeXBlcy5yZW5kZXI6XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIG91dHB1dC5wcm9jZXNzUHJpbWl0aXZlKGVsZW1lbnQpXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ2Z1bmN0aW9uJzoge1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHRoaXMuZ2V0T3JDcmVhdGVDb21wb25lbnRTdGF0ZShyZWYpO1xuICAgICAgICBvdXRwdXQucHJvY2Vzc0NvbXBvbmVudChlbGVtZW50LnR5cGUsIGVsZW1lbnQsIHRoaXMsIHN0YXRlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxufVxuXG4iLCAiaW1wb3J0IHsgY29udmVydE5vZGVUb0VsZW1lbnQsIGgsIE5vZGUsIHByaW1pdGl2ZU5vZGVUeXBlcyB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcbmltcG9ydCB7IENvbW1pdDIsIENvbW1pdFJlZjIgfSBmcm9tIFwiLi9jb21taXRcIjtcbmltcG9ydCB7IFdvcmtUaHJlYWQyIH0gZnJvbSBcIi4vdGhyZWFkXCJcbmltcG9ydCB7IENvbW1pdFRyZWUyIH0gZnJvbSBcIi4vdHJlZVwiO1xuaW1wb3J0IHsgU2NoZWR1bGVyIH0gZnJvbSBcIi4vc2NoZWR1bGVyXCI7XG5pbXBvcnQgeyBEZWx0YSB9IGZyb20gXCIuL2RlbHRhXCI7XG5pbXBvcnQgeyBXb3JrVGFzayB9IGZyb20gXCIuL3VwZGF0ZVwiO1xuXG4vKipcbiAqIFRoZSBSZWNvbmNpbGVyIEV2ZW50IEJ1cyBpcyBhIHN0cnVjdHVyZSB0aGF0IGNvbnRhaW5zIGNhbGxiYWNrc1xuICogZm9yIHNwZWNpZmljIHJlY29uY2lsZXIgZXZlbnRzLlxuICogXG4gKiBTeXN0ZW1zIGxpa2UgcmVuZGVyZXJzIG9yIHNwZWNpZmljIGRlYnVnIGludGVyY2VwdG9ycyBzaG91bGRcbiAqIGltcGxlbWVudCB0aGUgYnVzIGZ1bmN0aW9ucywgYW5kIHRoZW4gcGFzcyB0aGVpciBpbnN0YW5jZVxuICogb2YgdGhlIEJ1cyB0byB0aGUgcmVjb25jaWxlci5cbiAqL1xuZXhwb3J0IHR5cGUgUmVjb25jaWxlckV2ZW50QnVzID0ge1xuICByZW5kZXIoZGVsdGE6IERlbHRhKTogdm9pZCxcbn07XG5cbi8qKlxuICogVGhlIFJlY29uY2lsZXIgaXMgdGhlIG1haW4gb2JqZWN0IHRoYXRcbiAqIG93bnMgdGhlIENvbW1pdFRyZWUsIGFuZCBjb29yZGluYXRlcyB3aXRoIGl0J3NcbiAqIHRocmVhZCB0byBwZXJmb3JtIGNoYW5nZXMgcmVxdWVzdGVkIHZpYSBgbW91bnRgIGFuZCBgcmVuZGVyYC5cbiAqIFxuICogVGhlIHJlY29uY2lsZXIsIHVwb24gcmVjZWl2aW5nIHN1Y2ggYSByZXF1ZXN0XG4gKi9cbmV4cG9ydCBjbGFzcyBSZWNvbmNpbGVyMiB7XG4gIHRyZWU6IENvbW1pdFRyZWUyO1xuICBzY2hlZHVsZXI6IFNjaGVkdWxlcjtcblxuICBidXM6IFJlY29uY2lsZXJFdmVudEJ1cyA9IHtcbiAgICByZW5kZXI6ICgpID0+IHt9XG4gIH07XG4gIC8vIGluIHRoZSBmdXR1cmUgLSBtYXliZSBtb3JlIHRoYW4gb25lIHRocmVhZD9cbiAgdGhyZWFkOiBXb3JrVGhyZWFkMjtcblxuICBwb29scyA9IHtcbiAgICBjb21taXQ6IENvbW1pdDIucG9vbCgpLFxuICB9XG5cbiAgY29uc3RydWN0b3Ioc2NoZWR1bGVyOiBTY2hlZHVsZXIpIHtcbiAgICB0aGlzLnNjaGVkdWxlciA9IHNjaGVkdWxlcjtcbiAgICB0aGlzLnRyZWUgPSBuZXcgQ29tbWl0VHJlZTIodGhpcyk7XG4gICAgdGhpcy50aHJlYWQgPSBuZXcgV29ya1RocmVhZDIodGhpcy50cmVlKTtcblxuICAgIHRoaXMuc2NoZWR1bGVyLnNldENhbGxiYWNrRnVuYygoKSA9PiB0aGlzLndvcmsoKSk7XG4gICAgdGhpcy5wb29scy5jb21taXQubWF4U2l6ZSA9IDIwNDhcbiAgfVxuXG4gIHN1Ym1pdFRocmVhZCgpIHtcbiAgICBjb25zdCBjdXJyZW50VGhyZWFkID0gdGhpcy50aHJlYWQ7XG4gICAgLy8gU3RhcnQgYSBuZXcgdGhyZWFkXG4gICAgdGhpcy50aHJlYWQgPSBuZXcgV29ya1RocmVhZDIodGhpcy50cmVlKTtcblxuICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuXG4gICAgLy8gc2VuZCBkZWx0YSByZWFkeVxuICAgIHRoaXMuYnVzLnJlbmRlcihjdXJyZW50VGhyZWFkLmRlbHRhKTtcblxuICAgIC8vIHJ1biBlZmZlY3RzXG4gICAgZm9yIChjb25zdCBjbGVhbnVwIG9mIGN1cnJlbnRUaHJlYWQuZGVsdGEuY2xlYW51cHMudmFsdWVzKCkpXG4gICAgICBjbGVhbnVwLmZ1bmMoKTtcbiAgICBmb3IgKGNvbnN0IGVmZmVjdCBvZiBjdXJyZW50VGhyZWFkLmRlbHRhLmVmZmVjdHMudmFsdWVzKCkpXG4gICAgICBlZmZlY3QuZnVuYygpO1xuXG4gICAgZm9yIChjb25zdCByZW1vdmUgb2YgY3VycmVudFRocmVhZC5kZWx0YS5yZW1vdmVkLnZhbHVlcygpKVxuICAgICAgdGhpcy5wb29scy5jb21taXQucmVsZWFzZShyZW1vdmUpO1xuICB9XG5cbiAgd29yaygpIHtcbiAgICBpZiAoIXRoaXMudGhyZWFkLmRvbmUpIHtcbiAgICAgIC8vIGRvIHNvbWUgd29ya1xuICAgICAgdGhpcy50aHJlYWQud29yaygpO1xuICAgICAgdGhpcy5zY2hlZHVsZXIucmVxdWVzdENhbGxiYWNrKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3VibWl0VGhyZWFkKClcbiAgICB9XG4gIH1cbiAgcnVubmluZyA9IGZhbHNlO1xuXG4gIG1vdW50KG5vZGU6IE5vZGUpOiBDb21taXRSZWYyIHtcbiAgICBjb25zdCBlbGVtZW50ID0gY29udmVydE5vZGVUb0VsZW1lbnQobm9kZSk7XG4gICAgY29uc3QgcmVmID0gQ29tbWl0UmVmMi5mcmVzaChudWxsKTtcbiAgICB0aGlzLnRocmVhZC5xdWV1ZSh7IHR5cGU6ICdtb3VudCcsIHJlZiwgZWxlbWVudCB9KTtcblxuICAgIHRoaXMuc2NoZWR1bGVyLnJlcXVlc3RDYWxsYmFjaygpO1xuICAgIHJldHVybiByZWY7XG4gIH1cbiAgdW5tb3VudChyZWY6IENvbW1pdFJlZjIpIHtcbiAgICB0aGlzLnRocmVhZC5xdWV1ZSh7IHR5cGU6ICd1bm1vdW50JywgcmVmIH0pO1xuXG4gICAgdGhpcy5zY2hlZHVsZXIucmVxdWVzdENhbGxiYWNrKCk7XG4gIH1cbiAgcmVuZGVyKHJlZjogQ29tbWl0UmVmMik6IHZvaWQge1xuICAgIHRoaXMudGhyZWFkLnF1ZXVlKHsgdHlwZTogJ3RhcmdldCcsIHJlZiB9KTtcblxuICAgIHRoaXMuc2NoZWR1bGVyLnJlcXVlc3RDYWxsYmFjaygpO1xuICB9XG59XG4iLCAiaW1wb3J0IHtcbiAgY2FsY3VsYXRlRGVwc0NoYW5nZSxcbiAgQ29tcG9uZW50LCBDb250ZXh0LCBjcmVhdGVDb250ZXh0LCBFZmZlY3RDb25zdHJ1Y3RvciwgaCwgcHJpbWl0aXZlTm9kZVR5cGVzLCBydW5VcGRhdGVyLCBzcGVjaWFsTm9kZVR5cGVzLCBTdGF0ZVNldHRlciwgVXBkYXRlcixcbiAgdXNlQ29udGV4dCwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlLCBWYWx1ZU9yQ2FsY3VsYXRvclxufSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5cbmltcG9ydCB7IENvbW1pdElELCBDb21wb25lbnRTdGF0ZSwgSG9va0lELCB1c2VJbnRlcm5hbENvbXBvbmVudFN0YXRlIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdC1yZWNvblwiO1xuXG5leHBvcnQgdHlwZSBTU1JDb21wb25lbnREYXRhID0ge1xuICBpZDogQ29tbWl0SUQsXG4gIHZhbHVlczogTWFwPEhvb2tJRCwgSlNPTlZhbHVlPixcbiAgZGVwczogTWFwPEhvb2tJRCwgUHJpbWl0aXZlSlNPTlZhbHVlW10+LFxufTtcblxuZXhwb3J0IHR5cGUgU1NSQ29udGV4dCA9IHtcbiAgY29tcG9uZW50czogTWFwPENvbW1pdElELCBTU1JDb21wb25lbnREYXRhPixcbiAgY29udGV4dHM6IE1hcDxDb21taXRJRCwgSlNPTlZhbHVlPixcblxuICBjb21taXRzOiBNYXA8Q29tbWl0SUQsIERlaHlkcmF0ZWRDb21taXQ+LFxuICBtb3VudHM6IENvbW1pdElEW10sXG5cbiAgY29udGV4dENvbW1pdElEOiBDb21taXRJRCB8IG51bGwsXG5cbiAgbW9kZTogJ3NlcnZlcicgfCAnY2xpZW50JyxcblxuICByZWFkeUZvclNlcnZlcigpOiB2b2lkXG59O1xuLy8gdGhlIHNlcmlhbGl6YWJsZSBmb3JtIG9mIHRoZSBTU1IgY29udGV4dFxuZXhwb3J0IHR5cGUgU1NSUGF5bG9hZCA9IHtcbiAgY29udGV4dENvbW1pdElEOiBDb21taXRJRCB8IG51bGwsXG4gIGNvbW1pdHM6IERlaHlkcmF0ZWRDb21taXRbXSxcbiAgbW91bnRzOiBDb21taXRJRFtdLFxuICBjb21wb25lbnRzOiBTU1JDb21wb25lbnRQYXlsb2FkW10sXG4gIGNvbnRleHRzOiBbQ29tbWl0SUQsIEpTT05WYWx1ZV1bXSxcbn1cbmV4cG9ydCB0eXBlIFNTUkNvbXBvbmVudFBheWxvYWQgPSB7XG4gIGlkOiBDb21taXRJRCxcbiAgdmFsdWVzOiBbSG9va0lELCBKU09OVmFsdWVdW10sXG4gIGRlcHM6IFtIb29rSUQsIFByaW1pdGl2ZUpTT05WYWx1ZVtdXVtdLFxufVxuZXhwb3J0IGNvbnN0IHNlcmlhbGl6ZVNTUkNvbnRleHQgPSAoY29udGV4dDogU1NSQ29udGV4dCk6IFNTUlBheWxvYWQgPT4ge1xuICByZXR1cm4ge1xuICAgIGNvbnRleHRDb21taXRJRDogY29udGV4dC5jb250ZXh0Q29tbWl0SUQsXG4gICAgY29tbWl0czogWy4uLmNvbnRleHQuY29tbWl0cy52YWx1ZXMoKV0sXG4gICAgbW91bnRzOiBjb250ZXh0Lm1vdW50cyxcbiAgICBjb21wb25lbnRzOiBbLi4uY29udGV4dC5jb21wb25lbnRzLnZhbHVlcygpXS5tYXAoY29tcG9uZW50ID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlkOiBjb21wb25lbnQuaWQsXG4gICAgICAgIHZhbHVlczogWy4uLmNvbXBvbmVudC52YWx1ZXMuZW50cmllcygpXSxcbiAgICAgICAgZGVwczogWy4uLmNvbXBvbmVudC5kZXBzLmVudHJpZXMoKV0sXG4gICAgICB9IGFzIFNTUkNvbXBvbmVudFBheWxvYWRcbiAgICB9KSxcbiAgICBjb250ZXh0czogWy4uLmNvbnRleHQuY29udGV4dHMuZW50cmllcygpXVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBkZXNlcmlhbGl6ZVNTUlBheWxvYWQgPSAocGF5bG9hZDogU1NSUGF5bG9hZCwgbW9kZTogJ3NlcnZlcicgfCAnY2xpZW50JywgcmVhZHlGb3JTZXJ2ZXI6ICgpID0+IHZvaWQpOiBTU1JDb250ZXh0ID0+IHtcbiAgcmV0dXJuIHtcbiAgICBjb250ZXh0Q29tbWl0SUQ6IHBheWxvYWQuY29udGV4dENvbW1pdElELFxuICAgIG1vZGUsXG4gICAgcmVhZHlGb3JTZXJ2ZXIsXG4gICAgY29tbWl0czogbmV3IE1hcChwYXlsb2FkLmNvbW1pdHMubWFwKGMgPT4gW2MuaWQsIGNdKSksXG4gICAgbW91bnRzOiBwYXlsb2FkLm1vdW50cyxcbiAgICBjb21wb25lbnRzOiBuZXcgTWFwKHBheWxvYWQuY29tcG9uZW50cy5tYXAoYyA9PiAoW2MuaWQsIHtcbiAgICAgIGlkOiBjLmlkLFxuICAgICAgdmFsdWVzOiBuZXcgTWFwKGMudmFsdWVzKSxcbiAgICAgIGRlcHM6IG5ldyBNYXAoYy5kZXBzKSxcbiAgICB9IGFzIFNTUkNvbXBvbmVudERhdGFdKSkpLFxuICAgIGNvbnRleHRzOiBuZXcgTWFwKHBheWxvYWQuY29udGV4dHMpXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IFNTUkNvbnRleHQgPSBjcmVhdGVDb250ZXh0PFNTUkNvbnRleHQgfCBudWxsPihudWxsKTtcblxuY29uc3QgdXNlU1NSQ29tcG9uZW50U3RhdGUgPSAoZGF0YTogU1NSQ29udGV4dCwgc3RhdGU6IENvbXBvbmVudFN0YXRlKSA9PiB7XG4gIHJldHVybiB1c2VNZW1vKCgpID0+IHtcbiAgICBsZXQgc3NyQ29tcG9uZW50U3RhdGUgPSBkYXRhLmNvbXBvbmVudHMuZ2V0KHN0YXRlLnJlZi5pZCk7XG4gICAgaWYgKCFzc3JDb21wb25lbnRTdGF0ZSkge1xuICAgICAgc3NyQ29tcG9uZW50U3RhdGUgPSB7XG4gICAgICAgIGlkOiBzdGF0ZS5yZWYuaWQsXG4gICAgICAgIHZhbHVlczogbmV3IE1hcCgpLFxuICAgICAgICBkZXBzOiBuZXcgTWFwKCksXG4gICAgICB9XG4gICAgICBkYXRhLmNvbXBvbmVudHMuc2V0KHN0YXRlLnJlZi5pZCwgc3NyQ29tcG9uZW50U3RhdGUpO1xuICAgIH1cblxuICAgIHJldHVybiBzc3JDb21wb25lbnRTdGF0ZTtcbiAgfSwgW10pO1xufVxuXG5leHBvcnQgY29uc3Qgc3NyID0ge1xuICB1c2VTdGF0ZTxUIGV4dGVuZHMgSlNPTlZhbHVlPihpbml0aWFsVmFsdWU6IFZhbHVlT3JDYWxjdWxhdG9yPFQ+KTogW3ZhbHVlOiBULCBzZXR0ZXI6IFN0YXRlU2V0dGVyPFQ+XSB7XG4gICAgY29uc3Qgc3RhdGUgPSB1c2VJbnRlcm5hbENvbXBvbmVudFN0YXRlKCk7XG4gICAgY29uc3Qgc3NyRGF0YSA9IHNzci51c2VTU1JDb250ZXh0KCk7XG4gICAgY29uc3Qgc3NyQ29tcG9uZW50U3RhdGUgPSB1c2VTU1JDb21wb25lbnRTdGF0ZShzc3JEYXRhLCBzdGF0ZSk7XG5cbiAgICAvLyB0aGlzIHZhbHVlIHdpbGwgbGl0ZXJhbGx5IGNoYW5nZVxuICAgIC8vIGFzIHdlIGdvIGRvd24gdGhlc2Ugb3RoZXIgaG9va3MsXG4gICAgLy8gYnV0IHNob3VsZCBzdGF5IFwicmVsYXRpdmVseVwiIHN0YWJsZVxuICAgIGNvbnN0IGhvb2tJbmRleCA9IHN0YXRlLmhvb2tJbmRleDtcblxuICAgIC8vIElmIHdlIGFyZSBhIGNsaWVudCwgdHJ5IHRvIGdldCB0aGUgc2VydmVyJ3MgY29weSBvZiB0aGUgdmFsdWVcbiAgICBjb25zdCBpbml0aWFsU2VydmVyVmFsdWUgPSB1c2VNZW1vKCgpID0+IHtcbiAgICAgIGlmIChzc3JEYXRhLm1vZGUgPT09ICdzZXJ2ZXInKVxuICAgICAgICByZXR1cm4gaW5pdGlhbFZhbHVlO1xuXG4gICAgICBpZiAoIXNzckNvbXBvbmVudFN0YXRlLnZhbHVlcy5oYXMoaG9va0luZGV4KSlcbiAgICAgICAgcmV0dXJuIGluaXRpYWxWYWx1ZTtcblxuICAgICAgcmV0dXJuIHNzckNvbXBvbmVudFN0YXRlLnZhbHVlcy5nZXQoaG9va0luZGV4KSBhcyBWYWx1ZU9yQ2FsY3VsYXRvcjxUPjtcbiAgICB9LCBbXSlcblxuICAgIC8vIFRoZSBpbm5lciBzZXRTdGF0ZVxuICAgIGNvbnN0IFt2YWx1ZSwgaW5uZXJTZXR0ZXJdID0gdXNlU3RhdGU8VD4oaW5pdGlhbFNlcnZlclZhbHVlKTtcblxuICAgIGNvbnN0IHNldHRlciA9IHVzZU1lbW8oKCkgPT4ge1xuICAgICAgaWYgKHNzckRhdGEubW9kZSA9PT0gJ2NsaWVudCcpXG4gICAgICAgIHJldHVybiBpbm5lclNldHRlcjtcbiAgICAgIFxuICAgICAgLy8gaW50ZXJjZXB0IHVwZGF0ZXMgb24gc2VydmVyIHRvIHdyaXRlIHRvIFNTUkNvbXBvbmVudERhdGFcbiAgICAgIHJldHVybiAodXBkYXRlcjogVXBkYXRlcjxUPikgPT4ge1xuICAgICAgICBpbm5lclNldHRlcihwcmV2VmFsdWUgPT4ge1xuICAgICAgICAgIGNvbnN0IG5leHRWYWx1ZSA9IHJ1blVwZGF0ZXI8VD4ocHJldlZhbHVlLCB1cGRhdGVyKTtcbiAgICAgICAgICBzc3JDb21wb25lbnRTdGF0ZS52YWx1ZXMuc2V0KGhvb2tJbmRleCwgbmV4dFZhbHVlKTtcbiAgICAgICAgICByZXR1cm4gbmV4dFZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LCBbXSk7XG5cbiAgICByZXR1cm4gW3ZhbHVlLCBzZXR0ZXJdXG4gIH0sXG4gIHVzZUVmZmVjdChlZmZlY3Q6IEVmZmVjdENvbnN0cnVjdG9yLCBkZXBzOiBQcmltaXRpdmVKU09OVmFsdWVbXSkge1xuICAgIGNvbnN0IGxpdmVTdGF0ZSA9IHVzZUludGVybmFsQ29tcG9uZW50U3RhdGUoKTtcbiAgICBjb25zdCBzc3JEYXRhID0gc3NyLnVzZVNTUkNvbnRleHQoKTtcbiAgICBjb25zdCBzc3JDb21wb25lbnRTdGF0ZSA9IHVzZVNTUkNvbXBvbmVudFN0YXRlKHNzckRhdGEsIGxpdmVTdGF0ZSk7XG5cbiAgICBjb25zdCBob29rSW5kZXggPSBsaXZlU3RhdGUuaG9va0luZGV4O1xuXG4gICAgbGV0IGZpcnN0UnVuID0gdXNlUmVmKHRydWUpO1xuXG4gICAgdXNlTWVtbygoKSA9PiB7XG4gICAgICBpZiAoc3NyRGF0YS5tb2RlID09PSAnY2xpZW50JylcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICAvLyByZWNvcmQgdGhlIGxhc3Qgc2VydmVyIHNldCBvZiBkZXBzXG4gICAgICBzc3JDb21wb25lbnRTdGF0ZS5kZXBzLnNldChob29rSW5kZXgsIGRlcHMpO1xuICAgIH0sIGRlcHMpXG5cbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgaWYgKCFmaXJzdFJ1bi5jdXJyZW50IHx8IHNzckRhdGEubW9kZSA9PT0gJ3NlcnZlcicpXG4gICAgICAgIHJldHVybiBlZmZlY3QoKTtcblxuICAgICAgZmlyc3RSdW4uY3VycmVudCA9IGZhbHNlO1xuXG4gICAgICAvLyBmb3IgdGhlIHZlcnkgZmlyc3QgcnVuIG9uIGEgY2xpZW50LCBjaGVjayBhZ2FpbnN0XG4gICAgICAvLyB0aGUgc2VydmVyIHByb3BzIHRvIHNlZSBpZiB3ZSBuZWVkIHRvIHJlLXJlbmRlclxuICAgICAgY29uc3QgcHJldkRlcHMgPSBzc3JDb21wb25lbnRTdGF0ZS5kZXBzLmdldChob29rSW5kZXgpO1xuICAgICAgXG4gICAgICAvLyBvbmx5IHJ1biB0aGUgZWZmZWN0IGlmIHRoZSBkZXBzIGNoYW5nZSAob3IgaWYgd2UgZG9uJ3QgaGF2ZSBhIGNvcHkgb2YgcGFzdCBkZXBzIGFueXdheSlcbiAgICAgIGlmICghcHJldkRlcHMgfHwgY2FsY3VsYXRlRGVwc0NoYW5nZShwcmV2RGVwcywgZGVwcykpIHtcbiAgICAgICAgcmV0dXJuIGVmZmVjdCgpO1xuICAgICAgfVxuICAgIH0sIGRlcHMpO1xuXG4gIH0sXG4gIC8vIFRoaXMgbmVlZHMgc3BlY2lhbCByZWh5ZHJhdGlvbiBlZmZvcnRzIHRvIHJlc3RvcmVcbiAgY3JlYXRlQ29udGV4dDxUIGV4dGVuZHMgSlNPTlZhbHVlPihkZWZhdWx0VmFsdWU6IFQpOiBDb250ZXh0PFQ+IHtcbiAgICBjb25zdCBpbm5lckNvbnRleHQgPSBjcmVhdGVDb250ZXh0KGRlZmF1bHRWYWx1ZSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgLi4uaW5uZXJDb250ZXh0LFxuICAgICAgUHJvdmlkZXIoeyB2YWx1ZSwgY2hpbGRyZW4gfSkge1xuICAgICAgICBjb25zdCBsaXZlU3RhdGUgPSB1c2VJbnRlcm5hbENvbXBvbmVudFN0YXRlKCk7XG4gICAgICAgIGNvbnN0IHNzckRhdGEgPSBzc3IudXNlU1NSQ29udGV4dCgpO1xuXG4gICAgICAgIHVzZU1lbW8oKCkgPT4ge1xuICAgICAgICAgIGlmIChzc3JEYXRhLm1vZGUgPT09IFwiY2xpZW50XCIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgLy8gcmVjb3JkIHRoZSB2YWx1ZVxuICAgICAgICAgIHNzckRhdGEuY29udGV4dHMuc2V0KGxpdmVTdGF0ZS5yZWYuaWQsIHZhbHVlKTtcbiAgICAgICAgfSwgW3ZhbHVlXSk7XG5cbiAgICAgICAgcmV0dXJuIGgoc3BlY2lhbE5vZGVUeXBlcy5wcm92aWRlciwgeyBpZDogaW5uZXJDb250ZXh0LmlkLCB2YWx1ZSB9LCBjaGlsZHJlbik7XG4gICAgICB9LFxuICAgIH1cbiAgfSxcbiAgdXNlU1NSUmVhZHkoKSB7XG4gICAgY29uc3Qgc3NyRGF0YSA9IHNzci51c2VTU1JDb250ZXh0KCk7XG5cbiAgICByZXR1cm4gc3NyRGF0YS5yZWFkeUZvclNlcnZlcjtcbiAgfSxcbiAgdXNlU1NSQ29udGV4dCgpIHtcbiAgICBjb25zdCBzc3JDb250ZXh0ID0gdXNlQ29udGV4dChTU1JDb250ZXh0KTtcbiAgICBpZiAoIXNzckNvbnRleHQpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgU1NSIEJ1bmRsZSBDb250ZXh0IScpXG4gICAgcmV0dXJuIHNzckNvbnRleHQ7XG4gIH0sXG59O1xuXG5cbmV4cG9ydCB0eXBlIERlaHlkcmF0ZWRDb21taXQgPSB7XG4gIGlkOiBDb21taXRJRCxcbiAgZWxlbWVudFR5cGU6IHN0cmluZyxcbiAgcGFyZW50OiBDb21taXRJRCB8IG51bGwsXG4gIGRpc3RhbmNlOiBudW1iZXIsXG4gIGtleTogc3RyaW5nIHwgbnVsbCxcbiAgY2hpbGRyZW46IENvbW1pdElEW10sXG4gIHByb3BzOiBbc3RyaW5nLCBKU09OVmFsdWVdW10sXG59XG5cbmV4cG9ydCB0eXBlIERlaHlkcmF0ZWRUcmVlID0ge1xuICBjb21taXRzOiBEZWh5ZHJhdGVkQ29tbWl0W10sXG4gIG1vdW50czogQ29tbWl0SURbXSxcbn1cblxuZXhwb3J0IHR5cGUgUHJpbWl0aXZlSlNPTlZhbHVlID1cbiAgfCBzdHJpbmdcbiAgfCBudW1iZXJcbiAgfCBib29sZWFuXG4gIHwgbnVsbFxuXG5leHBvcnQgdHlwZSBDb21wb3VuZEpTT05WYWx1ZSA9XG4gIHwgUmVhZG9ubHlBcnJheTxKU09OVmFsdWU+XG4gIHwgeyByZWFkb25seSBba2V5OiBzdHJpbmddOiBKU09OVmFsdWUgfVxuXG5leHBvcnQgdHlwZSBKU09OVmFsdWUgPVxuICB8IFByaW1pdGl2ZUpTT05WYWx1ZVxuICB8IENvbXBvdW5kSlNPTlZhbHVlO1xuXG5leHBvcnQgdHlwZSBSZWh5ZHJhdGFibGVQcm9wcyA9IHsgW2tleTogc3RyaW5nXTogSlNPTlZhbHVlIH07XG5cbmV4cG9ydCB0eXBlIFJlaHlkcmF0YWJsZUNvbXBvbmVudCA9IENvbXBvbmVudDxSZWh5ZHJhdGFibGVQcm9wcz47XG5cbmV4cG9ydCBjb25zdCBzc3JTdHJpbmdUb1N5bWJvbE1hcDogUmVjb3JkPHN0cmluZywgc3ltYm9sPiA9IHtcbiAgJ3ByaW1pdGl2ZTpzdHJpbmcnOiBwcmltaXRpdmVOb2RlVHlwZXMuc3RyaW5nLFxuICAncHJpbWl0aXZlOm51bWJlcic6IHByaW1pdGl2ZU5vZGVUeXBlcy5udW1iZXIsXG4gICdwcmltaXRpdmU6bnVsbCc6IHByaW1pdGl2ZU5vZGVUeXBlcy5udWxsLFxuICAncHJpbWl0aXZlOmJvb2xlYW4nOiBwcmltaXRpdmVOb2RlVHlwZXMuYm9vbGVhbixcbiAgJ3ByaW1pdGl2ZTphcnJheSc6IHByaW1pdGl2ZU5vZGVUeXBlcy5hcnJheSxcblxuXG4gIFtwcmltaXRpdmVOb2RlVHlwZXMuc3RyaW5nXTogICdwcmltaXRpdmU6c3RyaW5nJyxcbiAgW3ByaW1pdGl2ZU5vZGVUeXBlcy5udW1iZXJdOiAgJ3ByaW1pdGl2ZTpudW1iZXInLFxuICBbcHJpbWl0aXZlTm9kZVR5cGVzLm51bGxdOiAgICAncHJpbWl0aXZlOm51bGwnLFxuICBbcHJpbWl0aXZlTm9kZVR5cGVzLmJvb2xlYW5dOiAncHJpbWl0aXZlOmJvb2xlYW4nLFxuICBbcHJpbWl0aXZlTm9kZVR5cGVzLmFycmF5XTogICAncHJpbWl0aXZlOmFycmF5JyxcblxuICAnc3BlY2lhbDpwbGFjZWhvbGRlcic6IHNwZWNpYWxOb2RlVHlwZXMucGxhY2Vob2xkZXIsXG4gICdzcGVjaWFsOmJvdW5kYXJ5Jzogc3BlY2lhbE5vZGVUeXBlcy5ib3VuZGFyeSxcbiAgJ3NwZWNpYWw6ZmFsbGJhY2snOiBzcGVjaWFsTm9kZVR5cGVzLmZhbGxiYWNrLFxuICAnc3BlY2lhbDpwcm92aWRlcic6IHNwZWNpYWxOb2RlVHlwZXMucHJvdmlkZXIsXG4gICdzcGVjaWFsOnN1c3BlbmQnOiBzcGVjaWFsTm9kZVR5cGVzLnN1c3BlbmQsXG4gICdzcGVjaWFsOnJlbmRlcic6IHNwZWNpYWxOb2RlVHlwZXMucmVuZGVyLFxuXG4gIFtzcGVjaWFsTm9kZVR5cGVzLnBsYWNlaG9sZGVyXTogJ3NwZWNpYWw6cGxhY2Vob2xkZXInLFxuICBbc3BlY2lhbE5vZGVUeXBlcy5ib3VuZGFyeV06ICdzcGVjaWFsOmJvdW5kYXJ5JyxcbiAgW3NwZWNpYWxOb2RlVHlwZXMuZmFsbGJhY2tdOiAnc3BlY2lhbDpmYWxsYmFjaycsXG4gIFtzcGVjaWFsTm9kZVR5cGVzLnByb3ZpZGVyXTogJ3NwZWNpYWw6cHJvdmlkZXInLFxuICBbc3BlY2lhbE5vZGVUeXBlcy5zdXNwZW5kXTogJ3NwZWNpYWw6c3VzcGVuZCcsXG4gIFtzcGVjaWFsTm9kZVR5cGVzLnJlbmRlcl06ICdzcGVjaWFsOnJlbmRlcicsXG59XG5leHBvcnQgY29uc3Qgc3NyU3ltYm9sVG9TdHJpbmdNYXA6IFJlY29yZDxzeW1ib2wsIHN0cmluZz4gPSBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXMoc3NyU3RyaW5nVG9TeW1ib2xNYXApXG4gIC5tYXAoKFtrZXksIHZhbHVlXSkgPT4gW3ZhbHVlLCBrZXldKSlcbiIsICJpbXBvcnQgeyBjcmVhdGVJZCwgRWxlbWVudCwgRWxlbWVudFR5cGUsIGgsIHByaW1pdGl2ZU5vZGVUeXBlcywgc3BlY2lhbE5vZGVUeXBlcyB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcbmltcG9ydCB7IENvbW1pdElELCBDb21taXRSZWYyLCBSZWNvbmNpbGVyMiB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3QtcmVjb25cIjtcbmltcG9ydCB7IGRlc2VyaWFsaXplU1NSUGF5bG9hZCwgUmVoeWRyYXRhYmxlQ29tcG9uZW50LCBTU1JDb250ZXh0LCBTU1JQYXlsb2FkLCBzc3JTdHJpbmdUb1N5bWJvbE1hcCB9IGZyb20gXCIuL3NzclwiO1xuaW1wb3J0IHsgUmVuZGVyU3BhY2UyIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdC1iYWNrc3RhZ2VcIjtcblxuXG5leHBvcnQgY29uc3QgcmVoeWRyYXRlID0gKFxuICB0YXJnZXRzOiB7IFtrZXk6IHN0cmluZ106IFJlaHlkcmF0YWJsZUNvbXBvbmVudCB9LFxuICByZWNvbmNpbGVyOiBSZWNvbmNpbGVyMixcbiAgc3BhY2U6IFJlbmRlclNwYWNlMjxIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQgfCBUZXh0LCAnd2ViOmh0bWwnIHwgJ3dlYjpzdmcnPixcbiAgcGF5bG9hZDogU1NSUGF5bG9hZFxuKSA9PiB7XG4gIGNvbnN0IGNvbnRleHQgPSBkZXNlcmlhbGl6ZVNTUlBheWxvYWQocGF5bG9hZCwgXCJjbGllbnRcIiwgKCkgPT4ge30pO1xuXG4gIGNvbnN0IHJlZnMgPSBuZXcgTWFwPENvbW1pdElELCBDb21taXRSZWYyPigpO1xuICBjb25zdCBlbGVtZW50cyA9IG5ldyBNYXA8Q29tbWl0SUQsIEVsZW1lbnQ+KCk7XG4gIGNvbnN0IHJvb3RzID0gW10gYXMgQ29tbWl0UmVmMltdXG4gIGNvbnN0IHRhcmdldFJlZnMgPSBbXSBhcyBDb21taXRSZWYyW11cblxuICBmb3IgKGNvbnN0IGNvbW1pdCBvZiBjb250ZXh0LmNvbW1pdHMudmFsdWVzKCkpIHtcbiAgICBjb25zdCByZWYgPSBDb21taXRSZWYyLnJlaHlkcmF0ZShjcmVhdGVJZChcIkNvbW1pdElEXCIpLCBjb21taXQuZGlzdGFuY2UpO1xuICAgIHJlZnMuc2V0KGNvbW1pdC5pZCwgcmVmKTtcblxuICAgIGlmIChjb21taXQuZWxlbWVudFR5cGUuc3RhcnRzV2l0aCgnc3BlY2lhbDptb3VudDonKSkge1xuICAgICAgY29uc3QgdGFyZ2V0TmFtZSA9IGNvbW1pdC5lbGVtZW50VHlwZS5zbGljZSgnc3BlY2lhbDptb3VudDonLmxlbmd0aCk7XG4gICAgICBjb25zdCB0YXJnZXQgPSB0YXJnZXRzW3RhcmdldE5hbWVdO1xuXG4gICAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5mcm9tRW50cmllcyhjb21taXQucHJvcHMpO1xuICAgICAgY29uc3QgZWxlbWVudCA9IGgodGFyZ2V0LCBwcm9wcylcbiAgICAgIGVsZW1lbnRzLnNldChjb21taXQuaWQsIGVsZW1lbnQpO1xuXG4gICAgICB0YXJnZXRSZWZzLnB1c2gocmVmKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZWxlbWVudFR5cGUgPSAoc3NyU3RyaW5nVG9TeW1ib2xNYXBbY29tbWl0LmVsZW1lbnRUeXBlXVxuICAgICAgICB8fCBjb21taXQuZWxlbWVudFR5cGVcbiAgICAgICAgfHwgc3BlY2lhbE5vZGVUeXBlcy5wbGFjZWhvbGRlcikgYXMgc3RyaW5nIHwgc3ltYm9sXG5cbiAgICAgIHN3aXRjaCAoZWxlbWVudFR5cGUpIHtcbiAgICAgICAgY2FzZSBwcmltaXRpdmVOb2RlVHlwZXMuc3RyaW5nOlxuICAgICAgICBjYXNlIHByaW1pdGl2ZU5vZGVUeXBlcy5udW1iZXI6XG4gICAgICAgIGNhc2UgcHJpbWl0aXZlTm9kZVR5cGVzLmJvb2xlYW46XG4gICAgICAgICAgZWxlbWVudHMuc2V0KGNvbW1pdC5pZCwgaChwcmltaXRpdmVOb2RlVHlwZXMubnVsbCkpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBjYXNlIHNwZWNpYWxOb2RlVHlwZXMucHJvdmlkZXI6XG4gICAgICAgICAgaWYgKGNvbW1pdC5pZCA9PT0gY29udGV4dC5jb250ZXh0Q29tbWl0SUQpIHtcbiAgICAgICAgICAgIGVsZW1lbnRzLnNldChjb21taXQuaWQsIGgoc3BlY2lhbE5vZGVUeXBlcy5wcm92aWRlciwgeyBpZDogU1NSQ29udGV4dC5pZCwgdmFsdWU6IGNvbnRleHQgfSkpO1xuICAgICAgICAgICAgcmVjb25jaWxlci50cmVlLmNvbnRleHRzLnNldChyZWYuaWQsIHtcbiAgICAgICAgICAgICAgaWQ6IHJlZi5pZCxcbiAgICAgICAgICAgICAgY29udGV4dElkOiBTU1JDb250ZXh0LmlkLFxuICAgICAgICAgICAgICB2YWx1ZTogY29udGV4dCxcbiAgICAgICAgICAgICAgY29uc3VtZXJzOiBuZXcgTWFwKClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmZyb21FbnRyaWVzKGNvbW1pdC5wcm9wcyk7XG4gICAgICAgICAgZWxlbWVudHMuc2V0KGNvbW1pdC5pZCwgaChlbGVtZW50VHlwZSwgcHJvcHMpKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZm9yIChjb25zdCBkZWh5ZHJhdGVkQ29tbWl0IG9mIGNvbnRleHQuY29tbWl0cy52YWx1ZXMoKSkge1xuICAgIGNvbnN0IHJlZiA9IHJlZnMuZ2V0KGRlaHlkcmF0ZWRDb21taXQuaWQpIGFzIENvbW1pdFJlZjI7XG4gICAgcmVmLnBhcmVudCA9IChkZWh5ZHJhdGVkQ29tbWl0LnBhcmVudCAmJiByZWZzLmdldChkZWh5ZHJhdGVkQ29tbWl0LnBhcmVudCkpIHx8IG51bGw7XG5cbiAgICBjb25zdCBjaGlsZHJlbiA9IGRlaHlkcmF0ZWRDb21taXQuY2hpbGRyZW4ubWFwKGMgPT4gcmVmcy5nZXQoYykpLmZpbHRlcih4ID0+ICEheCk7XG4gICAgY29uc3QgZWxlbWVudCA9IGVsZW1lbnRzLmdldChkZWh5ZHJhdGVkQ29tbWl0LmlkKSBhcyBFbGVtZW50O1xuICAgIGVsZW1lbnQuY2hpbGRyZW4gPSBjaGlsZHJlbi5tYXAoYyA9PiBlbGVtZW50cy5nZXQoYy5pZCkgYXMgRWxlbWVudClcblxuICAgIGlmICghcmVmLnBhcmVudCkge1xuICAgICAgcm9vdHMucHVzaChyZWYpO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbW1pdCA9IHJlY29uY2lsZXIucG9vbHMuY29tbWl0LmFjcXVpcmUocmVmLFxuICAgICAgZWxlbWVudCxcbiAgICAgIGNoaWxkcmVuXG4gICAgKTtcblxuICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1jb21taXQtaWQ9XCIke2RlaHlkcmF0ZWRDb21taXQuaWR9XCJdYClcbiAgICBpZiAobm9kZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICBzcGFjZS5ub2RlQnlDb21taXQuc2V0KGNvbW1pdC5yZWYuaWQsIG5vZGUpO1xuICAgICAgc3BhY2UuY29tbWl0QnlOb2RlLnNldChub2RlLCBjb21taXQpO1xuICAgIH1cbiAgICBpZiAoY29tbWl0LmVsZW1lbnQudHlwZSA9PT0gc3BlY2lhbE5vZGVUeXBlcy5yZW5kZXIpIHtcbiAgICAgIHNwYWNlLnJvb3RzLnNldChjb21taXQucmVmLmlkLCBjb21taXQpO1xuICAgIH1cblxuICAgIHJlY29uY2lsZXIudHJlZS5jb21taXRzLnNldChjb21taXQucmVmLmlkLCBjb21taXQpXG4gIH1cblxuICByZWNvbmNpbGVyLmJ1cy5yZW5kZXIgPSAoZGVsdGEpID0+IHtcbiAgICBjb25zb2xlLmxvZyh7IGRlbHRhIH0pXG4gICAgc3BhY2UuYnVzLnJlbmRlcihkZWx0YSlcbiAgfTtcblxuICBmb3IgKGNvbnN0IHJlZiBvZiB0YXJnZXRSZWZzLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiBsZWZ0Lmxlbmd0aCAtIHJpZ2h0Lmxlbmd0aCkpIHtcbiAgICByZWNvbmNpbGVyLnJlbmRlcihyZWYpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgaCwgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcbmltcG9ydCB7IHNzciB9IGZyb20gJ0BsdWtla2FhbGltL2FjdC13ZWInO1xuXG5jb25zdCBDaGlsZENvbXBvbmVudCA9ICgpID0+IHtcbiAgY29uc3QgW2NsaWNrZWQsIHNldENsaWNrZWRdID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IGJhY2tncm91bmQgPSBgaHNsKCR7TWF0aC5yYW5kb20oKSAqIDM2MH1kZWcgIDUwJSA1MCUpYDtcblxuICBmdW5jdGlvbiBvbkNsaWNrKCkge1xuICAgIHNldENsaWNrZWQoYyA9PiBjICsgMSlcbiAgfVxuXG4gIHJldHVybiBoKCdidXR0b24nLCB7IHN0eWxlOiB7IGJhY2tncm91bmQgfSwgb25DbGljayB9LCBgQ2xpY2tlZCAke2NsaWNrZWR9IHRpbWVzIWApXG59XG5cbmV4cG9ydCB0eXBlIEpTT05WYWx1ZSA9XG4gIHwgc3RyaW5nXG4gIHwgbnVtYmVyXG4gIHwgYm9vbGVhblxuICB8IG51bGxcbiAgfCBSZWFkb25seUFycmF5PEpTT05WYWx1ZT5cbiAgfCB7IFtrZXk6IHN0cmluZ106IEpTT05WYWx1ZSB9XG5cbmV4cG9ydCBjb25zdCBBcHAgPSAoKSA9PiB7XG4gIGNvbnN0IFtuYW1lLCBzZXROYW1lXSA9IHNzci51c2VTdGF0ZTxzdHJpbmc+KFwiV29ybGRcIik7XG4gIGNvbnN0IFtiZWVyVHlwZSwgc2V0QmVlclR5cGVdID0gc3NyLnVzZVN0YXRlPCdhbGUnIHwgJ3N0b3V0cyc+KCdhbGUnKTtcbiAgY29uc3QgW2JlZXJzLCBzZXRCZWVyc10gPSBzc3IudXNlU3RhdGU8c3RyaW5nW10+KFtdKTtcblxuICBjb25zdCByZWFkeSA9IHNzci51c2VTU1JSZWFkeSgpO1xuXG4gIGZ1bmN0aW9uIG9uSW5wdXQgKGV2ZW50OiBFdmVudCkge1xuICAgIHNldE5hbWUoKGV2ZW50LnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSlcbiAgfVxuICBmdW5jdGlvbiBvbkJlZXJUeXBlSW5wdXQgKGV2ZW50OiBFdmVudCkge1xuICAgIHNldEJlZXJUeXBlKChldmVudC50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUgYXMgJ2FsZScgfCAnc3RvdXRzJylcbiAgfVxuXG4gIHNzci51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGZldGNoKGBodHRwczovL2FwaS5zYW1wbGVhcGlzLmNvbS9iZWVycy8ke2JlZXJUeXBlfWApXG4gICAgICAudGhlbihyID0+IHIuanNvbigpKVxuICAgICAgLnRoZW4oKHBheWxvYWQ6IHsgbmFtZTogc3RyaW5nIH1bXSkgPT4gc2V0QmVlcnMocGF5bG9hZC5tYXAoZCA9PiBkLm5hbWUpKSlcbiAgfSwgW2JlZXJUeXBlXSlcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChiZWVycy5sZW5ndGggPiAwKVxuICAgICAgcmVhZHkoKTtcbiAgfSwgW2JlZXJzXSlcblxuICByZXR1cm4gaCgnYXJ0aWNsZScsIHt9LCBbXG4gICAgaCgnaDEnLCB7fSwgYEhlbGxvLCAke25hbWV9YCksXG4gICAgaChDaGlsZENvbXBvbmVudCksXG4gICAgaCgnaW5wdXQnLCB7IHR5cGU6ICd0ZXh0JywgdmFsdWU6IG5hbWUsIG9uSW5wdXQgfSksXG4gICAgaCgnc2VsZWN0JywgeyBvbklucHV0OiBvbkJlZXJUeXBlSW5wdXQgfSwgW1xuICAgICAgaCgnb3B0aW9uJywgeyB2YWx1ZTogJ2FsZScsIHNlbGVjdGVkOiAnYWxlJyA9PT0gYmVlclR5cGUgfSwgWydhbGUnXSksXG4gICAgICBoKCdvcHRpb24nLCB7IHZhbHVlOiAnc3RvdXRzJywgc2VsZWN0ZWQ6ICdzdG91dHMnID09PSBiZWVyVHlwZSB9LCAnc3RvdXRzJyksXG4gICAgXSksXG4gICAgaCgnb2wnLCB7fSwgYmVlcnMubWFwKGJlZXIgPT4gaCgnbGknLCB7fSwgYmVlcikpKVxuICBdKVxufTsiLCAiaW1wb3J0IHtcbiAgRWxlbWVudCxcbiAgc3BlY2lhbE5vZGVUeXBlcyxcbiAgcHJpbWl0aXZlTm9kZVR5cGVzLFxufSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5cbmV4cG9ydCBjb25zdCBnZXRFbGVtZW50TmFtZSA9IChlbGVtZW50OiBFbGVtZW50KSA9PiB7XG4gIGlmICh0eXBlb2YgZWxlbWVudC50eXBlID09PSAnZnVuY3Rpb24nKVxuICAgIHJldHVybiBgPGNvbXBvbmVudCgke2VsZW1lbnQudHlwZS5uYW1lfSk+YDtcbiAgaWYgKHR5cGVvZiBlbGVtZW50LnR5cGUgPT09ICdzeW1ib2wnKVxuICAgIHN3aXRjaCAoZWxlbWVudC50eXBlKSB7XG4gICAgICBjYXNlIHByaW1pdGl2ZU5vZGVUeXBlcy5udW1iZXI6XG4gICAgICAgIHJldHVybiBgPG51bWJlciB2YWx1ZT17JHtlbGVtZW50LnByb3BzLnZhbHVlfX0+YFxuICAgICAgY2FzZSBwcmltaXRpdmVOb2RlVHlwZXMuc3RyaW5nOlxuICAgICAgICByZXR1cm4gYDxzdHJpbmcgdmFsdWU9XCIke2VsZW1lbnQucHJvcHMudmFsdWV9XCI+YFxuICAgICAgY2FzZSBwcmltaXRpdmVOb2RlVHlwZXMuYm9vbGVhbjpcbiAgICAgICAgcmV0dXJuIGA8Ym9vbGVhbiB2YWx1ZT1cIiR7ZWxlbWVudC5wcm9wcy52YWx1ZX1cIj5gXG4gICAgICBjYXNlIHByaW1pdGl2ZU5vZGVUeXBlcy5hcnJheTpcbiAgICAgICAgcmV0dXJuIGA8YXJyYXk+YFxuICAgICAgY2FzZSBwcmltaXRpdmVOb2RlVHlwZXMubnVsbDpcbiAgICAgICAgcmV0dXJuIGA8bnVsbD5gXG4gICAgICBjYXNlIHNwZWNpYWxOb2RlVHlwZXMuZmFsbGJhY2s6XG4gICAgICAgIHJldHVybiBgPGZhbGxiYWNrPmA7XG4gICAgICBjYXNlIHNwZWNpYWxOb2RlVHlwZXMuc3VzcGVuZDpcbiAgICAgICAgcmV0dXJuIGA8c3VzcGVuZD5gO1xuICAgICAgY2FzZSBzcGVjaWFsTm9kZVR5cGVzLnJlbmRlcjpcbiAgICAgICAgcmV0dXJuIGA8cmVuZGVyIHR5cGU9XCIke2VsZW1lbnQucHJvcHMudHlwZX1cIj5gO1xuICAgICAgY2FzZSBzcGVjaWFsTm9kZVR5cGVzLnByb3ZpZGVyOlxuICAgICAgICByZXR1cm4gYDxjb250ZXh0IGlkPVwiJHtlbGVtZW50LnByb3BzLmlkfVwiPmA7XG4gICAgICBjYXNlIHNwZWNpYWxOb2RlVHlwZXMuYm91bmRhcnk6XG4gICAgICAgIHJldHVybiBgPGJvdW5kYXJ5PmA7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gYDxzeW1ib2w+YFxuICAgIH1cbiAgaWYgKGVsZW1lbnQudHlwZSlcbiAgICByZXR1cm4gYDwke2VsZW1lbnQudHlwZX0+YDtcbiAgcmV0dXJuICc8bm9uZT4nO1xufVxuIiwgImltcG9ydCB7IEVsZW1lbnQsIEVsZW1lbnRJRCwgT3BhcXVlSUQgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5pbXBvcnQgeyBDb21taXQyLCBDb21taXRJRCwgQ29tbWl0VHJlZTIsIENvbW1pdFZlcnNpb24sIENvbXBvbmVudFN0YXRlLCBEZWx0YSwgV29ya1JlYXNvbiwgV29ya1Rhc2ssIFdvcmtUaHJlYWQyIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdC1yZWNvblwiO1xuaW1wb3J0IHsgZ2V0RWxlbWVudE5hbWUgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG4vKipcbiAqIFwiUmVwb3J0c1wiIGFyZSBzZXJpYWxpemVkIHZlcnNpb25zIG9mIHRoZWlyIFwibmF0aXZlXCJcbiAqIGNvdW50ZXJwYXJ0cyAtIHJlYWR5IGZvciB0cmFuc3BvcnQgYWNyb3NzIHByb2Nlc3MvY29udGV4dFxuICogYm91bmRhcmllcy5cbiAqL1xuXG5leHBvcnQgdHlwZSBWYWx1ZVJlcG9ydCA9XG4gIHwgeyB0eXBlOiAndW5kZWZpbmVkJyB9XG4gIHwgeyB0eXBlOiAncHJpbWl0aXZlJywgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBudWxsIH1cbiAgfCB7IHR5cGU6ICdjb21wbGV4JywgbmFtZTogc3RyaW5nIH1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZVZhbHVlUmVwb3J0ID0gKHZhbHVlOiB1bmtub3duKTogVmFsdWVSZXBvcnQgPT4ge1xuICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgY2FzZSAnbnVtYmVyJzpcbiAgICBjYXNlICdib29sZWFuJzpcbiAgICAgIHJldHVybiB7IHR5cGU6ICdwcmltaXRpdmUnLCB2YWx1ZSB9O1xuICAgIGNhc2UgJ2JpZ2ludCc6XG4gICAgICByZXR1cm4geyB0eXBlOiAnY29tcGxleCcsIG5hbWU6IGBiaWdpbnQoJHt2YWx1ZS50b1N0cmluZygpfSlgIH1cbiAgICBjYXNlICdvYmplY3QnOlxuICAgICAgaWYgKCF2YWx1ZSlcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogJ3ByaW1pdGl2ZScsIHZhbHVlIH07XG4gICAgICBpZiAodmFsdWUuY29uc3RydWN0b3IpXG4gICAgICAgIHJldHVybiB7IHR5cGU6ICdjb21wbGV4JywgbmFtZTogdmFsdWUuY29uc3RydWN0b3IubmFtZSB9XG4gICAgICByZXR1cm4geyB0eXBlOiAnY29tcGxleCcsIG5hbWU6ICc/Pz8nIH1cbiAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICByZXR1cm4geyB0eXBlOiAnY29tcGxleCcsIG5hbWU6IGBmdW5jdGlvbigke3ZhbHVlLm5hbWV9KWAgfTtcbiAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgcmV0dXJuIHsgdHlwZTogJ2NvbXBsZXgnLCBuYW1lOiB2YWx1ZS5kZXNjcmlwdGlvbiB8fCAnc3ltYm9sJyB9XG4gICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgIHJldHVybiB7IHR5cGU6ICd1bmRlZmluZWQnIH1cbiAgfVxufTtcblxuZXhwb3J0IHR5cGUgQ29tcG9uZW50U3RhdGVSZXBvcnQgPSB7XG4gIHN0YXRlVmFsdWVzOiB7IGhvb2tJbmRleDogbnVtYmVyLCB2YWx1ZTogVmFsdWVSZXBvcnQgfVtdXG59XG5cbmV4cG9ydCB0eXBlIENvbW1pdERldGFpbHNSZXBvcnQgPSB7XG4gIGNvbW1pdDogQ29tbWl0UmVwb3J0LFxuICBwcm9wczogUmVjb3JkPHN0cmluZywgVmFsdWVSZXBvcnQ+LFxuXG4gIGNvbXBvbmVudDogbnVsbCB8IENvbXBvbmVudFN0YXRlUmVwb3J0LFxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlQ29tbWl0RGV0YWlsc1JlcG9ydCA9IChjb21taXQ6IENvbW1pdDIsIHRyZWU6IENvbW1pdFRyZWUyKTogQ29tbWl0RGV0YWlsc1JlcG9ydCA9PiB7XG4gIGNvbnN0IHByb3BzOiBSZWNvcmQ8c3RyaW5nLCBWYWx1ZVJlcG9ydD4gPSB7fTtcblxuICBmb3IgKGNvbnN0IGtleSBpbiBjb21taXQuZWxlbWVudC5wcm9wcykge1xuICAgIHByb3BzW2tleV0gPSBjcmVhdGVWYWx1ZVJlcG9ydChjb21taXQuZWxlbWVudC5wcm9wc1trZXldKTtcbiAgfVxuICBjb25zdCBjb21wb25lbnRTdGF0ZSA9IHRyZWUuY29tcG9uZW50cy5nZXQoY29tbWl0LnJlZi5pZCk7XG5cbiAgY29uc3QgY29tcG9uZW50ID0gY29tcG9uZW50U3RhdGUgJiYge1xuICAgIHN0YXRlVmFsdWVzOiBbLi4uY29tcG9uZW50U3RhdGUudmFsdWVzLmVudHJpZXMoKV0ubWFwKChbaG9va0luZGV4LCB2YWx1ZV0pID0+ICh7XG4gICAgICBob29rSW5kZXgsXG4gICAgICB2YWx1ZTogY3JlYXRlVmFsdWVSZXBvcnQodmFsdWUpLFxuICAgIH0pKVxuICB9IHx8IG51bGw7XG5cbiAgcmV0dXJuIHtcbiAgICBjb21taXQ6IGNyZWF0ZUNvbW1pdFJlcG9ydChjb21taXQpLFxuICAgIHByb3BzLFxuICAgIGNvbXBvbmVudCxcbiAgfVxufVxuXG5cblxuZXhwb3J0IHR5cGUgRWxlbWVudFJlcG9ydCA9IHtcbiAgdHlwZTogc3RyaW5nLFxuICAvL3Byb3BzOiBSZWNvcmQ8c3RyaW5nLCBWYWx1ZVJlcG9ydD4sXG4gIGlkOiBFbGVtZW50SUQ7XG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVFbGVtZW50UmVwb3J0ID0gKGVsZW1lbnQ6IEVsZW1lbnQpOiBFbGVtZW50UmVwb3J0ID0+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogZWxlbWVudC5pZCxcbiAgICAvL3Byb3BzOiBPYmplY3QuZW50cmllcyhlbGVtZW50LnByb3BzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IFtuYW1lLCBjcmVhdGVWYWx1ZVJlcG9ydCh2YWx1ZSldKVxuICAgIHR5cGU6IGdldEVsZW1lbnROYW1lKGVsZW1lbnQpLFxuICB9XG59XG5cbmV4cG9ydCB0eXBlIENvbW1pdFJlcG9ydCA9IHtcbiAgaWQ6IENvbW1pdElELFxuICBwYXJlbnQ6IENvbW1pdElEIHwgbnVsbCxcbiAgZGlzdGFuY2U6IG51bWJlcixcblxuICB2ZXJzaW9uOiBDb21taXRWZXJzaW9uO1xuICBlbGVtZW50OiBFbGVtZW50UmVwb3J0O1xuICBjaGlsZHJlbjogQ29tbWl0SURbXTtcbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZUNvbW1pdFJlcG9ydCA9IChjb21taXQ6IENvbW1pdDIpOiBDb21taXRSZXBvcnQgPT4ge1xuICByZXR1cm4ge1xuICAgIGlkOiBjb21taXQucmVmLmlkLFxuICAgIHBhcmVudDogY29tbWl0LnJlZi5wYXJlbnQgPyBjb21taXQucmVmLnBhcmVudC5pZCA6IG51bGwsXG4gICAgZGlzdGFuY2U6IGNvbW1pdC5yZWYubGVuZ3RoLFxuXG4gICAgZWxlbWVudDogY3JlYXRlRWxlbWVudFJlcG9ydChjb21taXQuZWxlbWVudCksXG4gICAgdmVyc2lvbjogY29tbWl0LnZlcnNpb24sXG4gICAgY2hpbGRyZW46IGNvbW1pdC5jaGlsZHJlbi5tYXAoY2hpbGQgPT4gY2hpbGQuaWQpXG4gIH1cbn1cblxuXG5leHBvcnQgdHlwZSBEZWx0YVJlcG9ydCA9IHtcbiAgY3JlYXRlZDogQ29tbWl0UmVwb3J0W10sXG4gIHJlbW92ZWQ6IENvbW1pdFJlcG9ydFtdLFxuICB1cGRhdGVkOiBDb21taXRSZXBvcnRbXVxufVxuZXhwb3J0IGNvbnN0IGNyZWF0ZURlbHRhUmVwb3J0ID0gKGRlbHRhOiBEZWx0YSk6IERlbHRhUmVwb3J0ID0+IHtcbiAgY29uc3QgcmVwb3J0OiBEZWx0YVJlcG9ydCA9IHtcbiAgICBjcmVhdGVkOiBbXSxcbiAgICByZW1vdmVkOiBbXSxcbiAgICB1cGRhdGVkOiBbXSxcbiAgfVxuICBmb3IgKGNvbnN0IGNvbW1pdCBvZiBkZWx0YS5mcmVzaC52YWx1ZXMoKSlcbiAgICByZXBvcnQuY3JlYXRlZC5wdXNoKGNyZWF0ZUNvbW1pdFJlcG9ydChjb21taXQpKTtcbiAgZm9yIChjb25zdCB7IG5leHQgfSBvZiBkZWx0YS5jaGFuZ2VkLnZhbHVlcygpKVxuICAgIHJlcG9ydC51cGRhdGVkLnB1c2goY3JlYXRlQ29tbWl0UmVwb3J0KG5leHQpKTtcbiAgZm9yIChjb25zdCBjb21taXQgb2YgZGVsdGEucmVtb3ZlZC52YWx1ZXMoKSlcbiAgICByZXBvcnQucmVtb3ZlZC5wdXNoKGNyZWF0ZUNvbW1pdFJlcG9ydChjb21taXQpKTtcblxuICByZXR1cm4gcmVwb3J0O1xufVxuXG5leHBvcnQgdHlwZSBXb3JrVGFza1JlcG9ydCA9IHtcbiAgZWxlbWVudDogbnVsbCB8IEVsZW1lbnRSZXBvcnQsXG4gIHByZXY6IG51bGwgfCBDb21taXRSZXBvcnQsXG4gIG1vdmVkOiBib29sZWFuLFxuXG4gIHBhcmVudDogbnVsbCB8IENvbW1pdElELFxuICBpZDogQ29tbWl0SUQsXG59XG5leHBvcnQgY29uc3QgY3JlYXRlV29ya1Rhc2tSZXBvcnQgPSAodGFzazogV29ya1Rhc2spOiBXb3JrVGFza1JlcG9ydCA9PiB7XG4gIHJldHVybiB7XG4gICAgZWxlbWVudDogdGFzay5uZXh0ICYmIGNyZWF0ZUVsZW1lbnRSZXBvcnQodGFzay5uZXh0KSxcbiAgICBwcmV2OiB0YXNrLnByZXYgJiYgY3JlYXRlQ29tbWl0UmVwb3J0KHRhc2sucHJldiksXG4gICAgbW92ZWQ6IHRhc2subW92ZWQsXG5cbiAgICBwYXJlbnQ6IHRhc2sucmVmLnBhcmVudCAmJiB0YXNrLnJlZi5wYXJlbnQuaWQsXG4gICAgaWQ6IHRhc2sucmVmLmlkLFxuICB9XG59XG5cbmV4cG9ydCB0eXBlIFRocmVhZFJlcG9ydCA9IHtcbiAgbWlzc2VkOiBDb21taXRJRFtdLFxuICB2aXNpdGVkOiBDb21taXRJRFtdLFxuICBtdXN0VmlzaXQ6IENvbW1pdElEW10sXG4gIG11c3RSZW5kZXI6IENvbW1pdElEW10sXG5cbiAgcGVuZGluZ1Rhc2tzOiBXb3JrVGFza1JlcG9ydFtdLFxuICByZWFzb25zOiBXb3JrUmVhc29uUmVwb3J0W10sXG5cbiAgaWQ6IE9wYXF1ZUlEPFwiVGhyZWFkSURcIj4sXG4gIHBhc3NlczogbnVtYmVyLFxuICBkb25lOiBib29sZWFuLFxufTtcblxuZXhwb3J0IHR5cGUgV29ya1JlYXNvblJlcG9ydCA9IHsgdGFyZ2V0OiBDb21taXRJRCwgZWxlbWVudDogRWxlbWVudFJlcG9ydCB8IG51bGwgfTtcbmV4cG9ydCBjb25zdCBjcmVhdGVXb3JrUmVhc29uUmVwb3J0ID0gKHJlYXNvbjogV29ya1JlYXNvbik6IFdvcmtSZWFzb25SZXBvcnQgPT4ge1xuICBpZiAocmVhc29uLnR5cGUgPT09ICdtb3VudCcpXG4gICAgcmV0dXJuIHsgdGFyZ2V0OiByZWFzb24ucmVmLmlkLCBlbGVtZW50OiBjcmVhdGVFbGVtZW50UmVwb3J0KHJlYXNvbi5lbGVtZW50KSB9XG4gIHJldHVybiB7IHRhcmdldDogcmVhc29uLnJlZi5pZCwgZWxlbWVudDogbnVsbCB9XG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVUaHJlYWRSZXBvcnQgPSAodGhyZWFkOiBXb3JrVGhyZWFkMik6IFRocmVhZFJlcG9ydCA9PiB7XG4gIHJldHVybiB7XG4gICAgdmlzaXRlZDogWy4uLnRocmVhZC52aXNpdGVkXSxcbiAgICBtdXN0VmlzaXQ6IFsuLi50aHJlYWQubXVzdFZpc2l0XSxcbiAgICBtdXN0UmVuZGVyOiBbLi4udGhyZWFkLm11c3RSZW5kZXJdLFxuICAgIG1pc3NlZDogWy4uLnRocmVhZC5taXNzZWRdLFxuXG4gICAgcGVuZGluZ1Rhc2tzOiB0aHJlYWQucGVuZGluZ1Rhc2tzLm1hcChjcmVhdGVXb3JrVGFza1JlcG9ydCksXG4gICAgcmVhc29uczogdGhyZWFkLnJlYXNvbnMubWFwKGNyZWF0ZVdvcmtSZWFzb25SZXBvcnQpLFxuICAgIGlkOiB0aHJlYWQuaWQsXG4gICAgcGFzc2VzOiB0aHJlYWQucGFzc2VzLFxuICAgIGRvbmU6IHRocmVhZC5kb25lLFxuICB9XG59XG5cbmV4cG9ydCB0eXBlIFRyZWVSZXBvcnQgPSB7XG4gIGNvbW1pdHM6IENvbW1pdFJlcG9ydFtdLFxuICByb290czogQ29tbWl0SURbXVxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlVHJlZVJlcG9ydCA9ICh0cmVlOiBDb21taXRUcmVlMikgPT4ge1xuICBjb25zdCByZXBvcnQ6IFRyZWVSZXBvcnQgPSB7IGNvbW1pdHM6IFtdLCByb290czogW10gfTtcblxuICBmb3IgKGNvbnN0IGNvbW1pdCBvZiB0cmVlLmNvbW1pdHMudmFsdWVzKCkpIHtcbiAgICByZXBvcnQuY29tbWl0cy5wdXNoKGNyZWF0ZUNvbW1pdFJlcG9ydChjb21taXQpKTtcbiAgfVxuICBmb3IgKGNvbnN0IHJvb3Qgb2YgdHJlZS5yb290cykge1xuICAgIHJlcG9ydC5yb290cy5wdXNoKHJvb3QpO1xuICB9XG5cbiAgcmV0dXJuIHJlcG9ydDtcbn1cblxuZXhwb3J0IGNvbnN0IHVwZGF0ZVRyZWVSZXBvcnQgPSAodHJlZTogVHJlZVJlcG9ydCwgZGVsdGE6IERlbHRhUmVwb3J0KSA9PiB7XG4gIGNvbnN0IGNvbW1pdHMgPSBuZXcgTWFwKHRyZWUuY29tbWl0cy5tYXAoYyA9PiBbYy5pZCwgY10pKTtcbiAgY29uc3Qgcm9vdHMgPSBuZXcgU2V0KHRyZWUucm9vdHMpO1xuXG4gIGZvciAoY29uc3QgY29tbWl0IG9mIGRlbHRhLmNyZWF0ZWQudmFsdWVzKCkpIHtcbiAgICBjb21taXRzLnNldChjb21taXQuaWQsIGNvbW1pdCk7XG4gICAgaWYgKGNvbW1pdC5wYXJlbnQgPT09IG51bGwpXG4gICAgICByb290cy5hZGQoY29tbWl0LmlkKTtcbiAgfVxuICBmb3IgKGNvbnN0IGNvbW1pdCBvZiBkZWx0YS51cGRhdGVkLnZhbHVlcygpKSB7XG4gICAgY29tbWl0cy5zZXQoY29tbWl0LmlkLCBjb21taXQpO1xuICB9XG4gIGZvciAoY29uc3QgY29tbWl0IG9mIGRlbHRhLnJlbW92ZWQudmFsdWVzKCkpIHtcbiAgICBjb21taXRzLmRlbGV0ZShjb21taXQuaWQpO1xuICAgIGlmIChjb21taXQucGFyZW50ID09PSBudWxsKVxuICAgICAgcm9vdHMuZGVsZXRlKGNvbW1pdC5pZCk7XG4gIH1cblxuICB0cmVlLnJvb3RzID0gWy4uLnJvb3RzXTtcbiAgdHJlZS5jb21taXRzID0gWy4uLmNvbW1pdHMudmFsdWVzKCldXG59XG5cbiIsICJpbXBvcnQgeyBTY2hlZHVsZXIgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0LXJlY29uXCI7XG5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlRXZlbnRCdXMgPSB7XG4gIG9uSW50ZXJjZXB0RW5kKCk6IHZvaWQsXG4gIG9uSW50ZXJjZXB0U3RhcnQoKTogdm9pZCxcblxuICBvbkFmdGVyQ2FsbGJhY2tFeGVjdXRlKCk6IHZvaWQsXG59XG5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlQ29udHJvbGxlciA9IHtcbiAgc3RlcChzdHJpZGU/OiBudW1iZXIpOiB2b2lkLFxuICBjYW5jZWxJbnRlcmNlcHQoKTogdm9pZCxcblxuICBpbnRlcmNlcHQ6IGJvb2xlYW4sXG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVEZWJ1Z1NjaGVkdWxlciA9IChldmVudHM6IFNjaGVkdWxlRXZlbnRCdXMsIHNjaGVkdWxlck5hbWU6IHN0cmluZyA9IFwiU2NoZWR1bGVyXCIpOiBTY2hlZHVsZXIgJiB7IGNvbnRyb2xsZXI6IFNjaGVkdWxlQ29udHJvbGxlciB9ID0+ICB7XG4gIGxldCBjYWxsYmFja0Z1bmMgPSAoKSA9PiB7fTtcbiAgbGV0IHBlbmRpbmdfY2FsbGJhY2sgPSBmYWxzZTtcblxuICBjb25zdCBydW4gPSAobWF4V29yayA9IDEwMDAwKSA9PiB7XG4gICAgbGV0IHdvcmtDb3VudCA9IDA7XG4gICAgY29uc3Qgc3RhcnRNYXJrID0gcGVyZm9ybWFuY2UubWFyayhgJHtzY2hlZHVsZXJOYW1lfTp3b3JrOnN0YXJ0YCk7XG5cbiAgICB3aGlsZSAocGVuZGluZ19jYWxsYmFjayAmJiB3b3JrQ291bnQgPCBtYXhXb3JrKSB7XG4gICAgICBwZW5kaW5nX2NhbGxiYWNrID0gZmFsc2U7XG4gICAgICBjYWxsYmFja0Z1bmMoKTtcbiAgICAgIGV2ZW50cy5vbkFmdGVyQ2FsbGJhY2tFeGVjdXRlKCk7XG4gICAgICB3b3JrQ291bnQrKztcblxuICAgICAgaWYgKGNvbnRyb2xsZXIuaW50ZXJjZXB0ID09PSB0cnVlKVxuICAgICAgICByZXR1cm4gZXZlbnRzLm9uSW50ZXJjZXB0U3RhcnQoKTtcbiAgICB9XG4gICAgY29uc3QgZW5kTWFyayA9IHBlcmZvcm1hbmNlLm1hcmsoYCR7c2NoZWR1bGVyTmFtZX06d29yazplbmRgKTtcbiAgICBjb25zdCBtZWFzdXJlbWVudCA9IHBlcmZvcm1hbmNlLm1lYXN1cmUoYCR7c2NoZWR1bGVyTmFtZX06d29yaygke3dvcmtDb3VudH0pYCwgc3RhcnRNYXJrLm5hbWUsIGVuZE1hcmsubmFtZSk7XG4gICAgXG4gICAgaWYgKHBlbmRpbmdfY2FsbGJhY2spIHtcbiAgICAgIHRpbWVvdXRJZCA9IHdpbmRvdy5zZXRUaW1lb3V0KG9uVGltZW91dCwgMCk7XG4gICAgfSBlbHNlXG4gICAgICB0aW1lb3V0SWQgPSBudWxsO1xuICB9XG5cbiAgY29uc3QgY29udHJvbGxlcjogU2NoZWR1bGVDb250cm9sbGVyID0ge1xuICAgIGludGVyY2VwdDogZmFsc2UsXG4gICAgY2FuY2VsSW50ZXJjZXB0KCkge1xuICAgICAgY29udHJvbGxlci5pbnRlcmNlcHQgPSBmYWxzZTtcbiAgICAgIGV2ZW50cy5vbkludGVyY2VwdEVuZCgpO1xuICAgICAgcnVuKCk7XG4gICAgfSxcbiAgICBzdGVwKHN0cmlkZSA9IDEpIHtcbiAgICAgIHJ1bihzdHJpZGUpO1xuICAgICAgaWYgKCFwZW5kaW5nX2NhbGxiYWNrKSB7XG4gICAgICAgIGV2ZW50cy5vbkludGVyY2VwdEVuZCgpO1xuICAgICAgICB0aW1lb3V0SWQgPSBudWxsO1xuICAgICAgfVxuICAgIH0sXG4gIH1cbiAgY29uc3Qgb25UaW1lb3V0ID0gKCkgPT4ge1xuICAgIGlmIChjb250cm9sbGVyLmludGVyY2VwdCkge1xuICAgICAgZXZlbnRzLm9uSW50ZXJjZXB0U3RhcnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcnVuKCk7XG4gICAgfVxuICB9XG5cbiAgbGV0IHRpbWVvdXRJZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgcmV0dXJuIHtcbiAgICBjb250cm9sbGVyLFxuICAgIHNldENhbGxiYWNrRnVuYyhjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2tGdW5jID0gY2FsbGJhY2s7XG4gICAgfSxcbiAgICByZXF1ZXN0Q2FsbGJhY2soKSB7XG4gICAgICBwZW5kaW5nX2NhbGxiYWNrID0gdHJ1ZTtcblxuICAgICAgaWYgKCF0aW1lb3V0SWQpXG4gICAgICAgIHRpbWVvdXRJZCA9IHdpbmRvdy5zZXRUaW1lb3V0KG9uVGltZW91dCwgMCk7XG4gICAgfSxcbiAgICBjYW5jZWxDYWxsYmFjaygpIHtcbiAgICAgIHBlbmRpbmdfY2FsbGJhY2sgPSBmYWxzZTtcbiAgICAgIGlmICh0aW1lb3V0SWQpIHtcbiAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aW1lb3V0SWQpXG4gICAgICAgIHRpbWVvdXRJZCA9IG51bGw7XG4gICAgICB9XG4gICAgfSxcbiAgICBpc0NhbGxiYWNrUGVuZGluZygpIHtcbiAgICAgIHJldHVybiBwZW5kaW5nX2NhbGxiYWNrO1xuICAgIH0sXG4gIH1cbn07IiwgImltcG9ydCB7IENvbW1pdElELCBDb21taXRSZWYyLCBDb21taXRUcmVlMiwgUXVldWVSZXN1bHQsIFJlY29uY2lsZXIyLCBTY2hlZHVsZXIsIFdvcmtSZWFzb24sIFdvcmtUaHJlYWQyIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdC1yZWNvblwiO1xuaW1wb3J0IHsgY3JlYXRlRGVidWdTY2hlZHVsZXIsIFNjaGVkdWxlQ29udHJvbGxlciwgU2NoZWR1bGVFdmVudEJ1cyB9IGZyb20gXCIuL3NjaGVkdWxlclwiO1xuaW1wb3J0IHsgQ29tbWl0RGV0YWlsc1JlcG9ydCwgY3JlYXRlQ29tbWl0RGV0YWlsc1JlcG9ydCwgY3JlYXRlRGVsdGFSZXBvcnQsIGNyZWF0ZVRocmVhZFJlcG9ydCwgY3JlYXRlVHJlZVJlcG9ydCwgY3JlYXRlV29ya1JlYXNvblJlcG9ydCwgY3JlYXRlV29ya1Rhc2tSZXBvcnQsIERlbHRhUmVwb3J0LCBUaHJlYWRSZXBvcnQsIFRyZWVSZXBvcnQsIFdvcmtSZWFzb25SZXBvcnQsIFdvcmtUYXNrUmVwb3J0IH0gZnJvbSBcIi4vcmVwb3J0XCI7XG5pbXBvcnQgeyBOb2RlIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuXG5leHBvcnQgdHlwZSBSZWNvbmNpbGVyRGVidWdFdmVudEJ1cyA9IHtcbiAgc2NoZWR1bGVyOiBTY2hlZHVsZUV2ZW50QnVzLFxuICB0aHJlYWQ6IERlYnVnV29ya1RocmVhZEV2ZW50QnVzLFxuXG4gIG9uVGhyZWFkRG9uZSh0aHJlYWQ6IFRocmVhZFJlcG9ydCwgZGVsdGE6IERlbHRhUmVwb3J0KTogdm9pZCxcbn07XG5leHBvcnQgdHlwZSBSZWNvbmNpbGVyRGVidWdDb250cm9sbGVyID0ge1xuICBzY2hlZHVsZXI6IFNjaGVkdWxlQ29udHJvbGxlcixcblxuICBnZXRUcmVlKCk6IFRyZWVSZXBvcnQsXG4gIGdldFRocmVhZCgpOiBUaHJlYWRSZXBvcnQsXG4gIGdldERlbHRhKCk6IERlbHRhUmVwb3J0LFxuXG4gIGdldERldGFpbHMoY29tbWl0SWQ6IENvbW1pdElEKTogQ29tbWl0RGV0YWlsc1JlcG9ydCB8IG51bGxcbn1cblxuZXhwb3J0IGNsYXNzIERlYnVnUmVjb25jaWxlciBleHRlbmRzIFJlY29uY2lsZXIyIHtcbiAgY29udHJvbGxlcjogUmVjb25jaWxlckRlYnVnQ29udHJvbGxlcjtcbiAgZGVidWdCdXM6IFJlY29uY2lsZXJEZWJ1Z0V2ZW50QnVzO1xuXG4gIHN0YXJ0ZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBjb25zdCBkZWJ1Z0J1czogUmVjb25jaWxlckRlYnVnRXZlbnRCdXMgPSB7XG4gICAgICBzY2hlZHVsZXI6IHtcbiAgICAgICAgb25BZnRlckNhbGxiYWNrRXhlY3V0ZSgpIHt9LFxuICAgICAgICBvbkludGVyY2VwdFN0YXJ0KCkge30sXG4gICAgICAgIG9uSW50ZXJjZXB0RW5kKCkge30sXG4gICAgICB9LFxuICAgICAgdGhyZWFkOiB7XG4gICAgICAgIG9uUXVldWUoKSB7fSxcbiAgICAgICAgb25TdGFydFBhc3MoKSB7fSxcbiAgICAgICAgb25Xb3JrKCkge30sXG4gICAgICAgIG9uUmVuZGVyKCkge30sXG4gICAgICB9LFxuICAgICAgb25UaHJlYWREb25lKCkge30sXG4gICAgfTtcblxuICAgIGNvbnN0IHNjaGVkdWxlciA9IGNyZWF0ZURlYnVnU2NoZWR1bGVyKGRlYnVnQnVzLnNjaGVkdWxlcik7XG4gICAgc3VwZXIoc2NoZWR1bGVyKTtcbiAgICB0aGlzLmRlYnVnQnVzID0gZGVidWdCdXM7XG4gICAgXG4gICAgY29uc3QgbWUgPSB0aGlzO1xuXG4gICAgdGhpcy5jb250cm9sbGVyID0ge1xuICAgICAgc2NoZWR1bGVyOiBzY2hlZHVsZXIuY29udHJvbGxlcixcbiAgICAgIGdldFRyZWUoKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVUcmVlUmVwb3J0KG1lLnRyZWUpXG4gICAgICB9LFxuICAgICAgZ2V0VGhyZWFkKCkge1xuICAgICAgICByZXR1cm4gY3JlYXRlVGhyZWFkUmVwb3J0KG1lLnRocmVhZClcbiAgICAgIH0sXG4gICAgICBnZXREZWx0YSgpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZURlbHRhUmVwb3J0KG1lLnRocmVhZC5kZWx0YSk7XG4gICAgICB9LFxuICAgICAgZ2V0RGV0YWlscyhjb21taXRJZCkge1xuICAgICAgICBjb25zdCBjb21taXQgPSBtZS50cmVlLmNvbW1pdHMuZ2V0KGNvbW1pdElkKTtcbiAgICAgICAgaWYgKCFjb21taXQpXG4gICAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgcmV0dXJuIGNyZWF0ZUNvbW1pdERldGFpbHNSZXBvcnQoY29tbWl0LCBtZS50cmVlKSB8fCBudWxsO1xuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy50aHJlYWQgPSBuZXcgRGVidWdXb3JrVGhyZWFkKHRoaXMudHJlZSwgZGVidWdCdXMudGhyZWFkKTsgXG4gIH1cbiAgc3VibWl0VGhyZWFkKCk6IHZvaWQge1xuICAgIGNvbnN0IHN1Ym1pdHRlZFRocmVhZCA9IHRoaXMudGhyZWFkO1xuICAgIGNvbnN0IHsgaWQsIHZpc2l0ZWQsIHBhc3NlcyB9ID0gc3VibWl0dGVkVGhyZWFkO1xuXG4gICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XG4gICAgY29uc3QgZGVsdGEgPSBjcmVhdGVEZWx0YVJlcG9ydChzdWJtaXR0ZWRUaHJlYWQuZGVsdGEpO1xuICAgIHRoaXMuZGVidWdCdXMub25UaHJlYWREb25lKGNyZWF0ZVRocmVhZFJlcG9ydChzdWJtaXR0ZWRUaHJlYWQpLCBkZWx0YSlcblxuICAgIC8vIFN0YXJ0IGEgbmV3IHRocmVhZFxuICAgIHRoaXMudGhyZWFkID0gbmV3IERlYnVnV29ya1RocmVhZCh0aGlzLnRyZWUsIHRoaXMuZGVidWdCdXMudGhyZWFkKTtcblxuICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuXG4gICAgLy8gc2VuZCBkZWx0YSByZWFkeVxuICAgIHRoaXMuYnVzLnJlbmRlcihzdWJtaXR0ZWRUaHJlYWQuZGVsdGEpO1xuXG4gICAgLy8gcnVuIGVmZmVjdHNcbiAgICBmb3IgKGNvbnN0IGNsZWFudXAgb2Ygc3VibWl0dGVkVGhyZWFkLmRlbHRhLmNsZWFudXBzLnZhbHVlcygpKVxuICAgICAgY2xlYW51cC5mdW5jKCk7XG4gICAgZm9yIChjb25zdCBlZmZlY3Qgb2Ygc3VibWl0dGVkVGhyZWFkLmRlbHRhLmVmZmVjdHMudmFsdWVzKCkpXG4gICAgICBlZmZlY3QuZnVuYygpO1xuXG4gICAgZm9yIChjb25zdCByZW1vdmUgb2Ygc3VibWl0dGVkVGhyZWFkLmRlbHRhLnJlbW92ZWQudmFsdWVzKCkpXG4gICAgICB0aGlzLnBvb2xzLmNvbW1pdC5yZWxlYXNlKHJlbW92ZSk7XG4gICAgXG4gICAgXG4gICAgcGVyZm9ybWFuY2UubWFyayhgcmVjb25jaWxlcjp0aHJlYWQoJHtpZH0pOmVuZGApO1xuICAgIHBlcmZvcm1hbmNlLm1lYXN1cmUoYHJlY29uY2lsZXI6dGhyZWFkKCR7aWR9LCB2aXNpdGVkPSR7dmlzaXRlZC5zaXplfSlgLFxuICAgICAgYHJlY29uY2lsZXI6dGhyZWFkKCR7aWR9KTpzdGFydGAsXG4gICAgICBgcmVjb25jaWxlcjp0aHJlYWQoJHtpZH0pOmVuZGAsXG4gICAgKVxuICAgIGNvbnNvbGUuaW5mbyhgW1JlY29uY2lsZXJdIFRocmVhZCAke2lkfSB2aXNpdGVkICR7dmlzaXRlZC5zaXplfSBub2RlcywgaW4gJHtwYXNzZXN9IHBhc3Nlc2ApO1xuICB9XG5cbiAgbW91bnQobm9kZTogTm9kZSkge1xuICAgIGlmICghdGhpcy5zdGFydGVkKSB7XG4gICAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgcGVyZm9ybWFuY2UubWFyayhgcmVjb25jaWxlcjp0aHJlYWQoJHt0aGlzLnRocmVhZC5pZH0pOnN0YXJ0YCk7XG4gICAgfVxuICAgIHJldHVybiBzdXBlci5tb3VudChub2RlKTtcbiAgfVxuICB1bm1vdW50KHJlZjogQ29tbWl0UmVmMik6IHZvaWQge1xuICAgIGlmICghdGhpcy5zdGFydGVkKSB7XG4gICAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgcGVyZm9ybWFuY2UubWFyayhgcmVjb25jaWxlcjp0aHJlYWQoJHt0aGlzLnRocmVhZC5pZH0pOnN0YXJ0YCk7XG4gICAgfVxuICAgIHJldHVybiBzdXBlci51bm1vdW50KHJlZik7XG4gIH1cbiAgcmVuZGVyKHJlZjogQ29tbWl0UmVmMik6IHZvaWQge1xuICAgIGlmICghdGhpcy5zdGFydGVkKSB7XG4gICAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgcGVyZm9ybWFuY2UubWFyayhgcmVjb25jaWxlcjp0aHJlYWQoJHt0aGlzLnRocmVhZC5pZH0pOnN0YXJ0YCk7XG4gICAgfVxuICAgIHN1cGVyLnJlbmRlcihyZWYpO1xuICB9XG59XG5cbmV4cG9ydCB0eXBlIERlYnVnV29ya1RocmVhZEV2ZW50QnVzID0ge1xuICBvbldvcmsocHJldlRhc2s6IG51bGwgfCBXb3JrVGFza1JlcG9ydCwgbmV4dFRhc2s6IG51bGwgfCBXb3JrVGFza1JlcG9ydCwgZG9uZTogYm9vbGVhbik6IHZvaWQsXG4gIG9uUmVuZGVyKCk6IHZvaWQsXG5cbiAgb25TdGFydFBhc3MoKTogdm9pZCxcbiAgb25RdWV1ZShyZWFzb246IFdvcmtSZWFzb25SZXBvcnQsIHJlc3VsdDogUXVldWVSZXN1bHQpOiB2b2lkLFxufVxuXG5leHBvcnQgY2xhc3MgRGVidWdXb3JrVGhyZWFkIGV4dGVuZHMgV29ya1RocmVhZDIge1xuICBkZWJ1Z0J1czogRGVidWdXb3JrVGhyZWFkRXZlbnRCdXM7XG5cbiAgY29uc3RydWN0b3IodHJlZTogQ29tbWl0VHJlZTIsIGRlYnVnQnVzOiBEZWJ1Z1dvcmtUaHJlYWRFdmVudEJ1cykge1xuICAgIHN1cGVyKHRyZWUpO1xuICAgIHRoaXMuZGVidWdCdXMgPSBkZWJ1Z0J1cztcbiAgfVxuXG4gIHdvcmsoKTogdm9pZCB7XG4gICAgY29uc3QgcHJldlRhc2sgPSB0aGlzLnBlbmRpbmdUYXNrc1t0aGlzLnBlbmRpbmdUYXNrcy5sZW5ndGggLSAxXTtcbiAgICBzdXBlci53b3JrKCk7XG4gICAgY29uc3QgbmV4dFRhc2sgPSB0aGlzLnBlbmRpbmdUYXNrc1t0aGlzLnBlbmRpbmdUYXNrcy5sZW5ndGggLSAxXTtcbiAgICB0aGlzLmRlYnVnQnVzLm9uV29yayhcbiAgICAgIHByZXZUYXNrICYmIGNyZWF0ZVdvcmtUYXNrUmVwb3J0KHByZXZUYXNrKSB8fCBudWxsLFxuICAgICAgbmV4dFRhc2sgJiYgY3JlYXRlV29ya1Rhc2tSZXBvcnQobmV4dFRhc2spIHx8IG51bGwsXG4gICAgICB0aGlzLmRvbmVcbiAgICApXG4gIH1cblxuICBxdWV1ZShyZWFzb246IFdvcmtSZWFzb24pOiBRdWV1ZVJlc3VsdCB7XG4gICAgY29uc3QgcmVzdWx0ID0gc3VwZXIucXVldWUocmVhc29uKTtcblxuICAgIHRoaXMuZGVidWdCdXMub25RdWV1ZShjcmVhdGVXb3JrUmVhc29uUmVwb3J0KHJlYXNvbiksIHJlc3VsdCk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgc3RhcnROZXh0UGFzcygpOiB2b2lkIHtcblxuICAgIHN1cGVyLnN0YXJ0TmV4dFBhc3MoKVxuICAgIHRoaXMuZGVidWdCdXMub25TdGFydFBhc3MoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGNyZWF0ZVdlYk5vZGVCdWlsZGVyLCByZWh5ZHJhdGUsIFNTUlBheWxvYWQgfSBmcm9tICdAbHVrZWthYWxpbS9hY3Qtd2ViJztcbmltcG9ydCB7IEFwcCB9IGZyb20gJy4vYXBwJztcbmltcG9ydCB7IGNyZWF0ZURlYnVnUG9wdXAgfSBmcm9tICdAbHVrZWthYWxpbS9hY3QtaW5zaWdodCc7XG5pbXBvcnQgeyBEZWJ1Z1JlY29uY2lsZXIgfSBmcm9tICdAbHVrZWthYWxpbS9hY3QtZGVidWcnO1xuaW1wb3J0IHsgUmVuZGVyU3BhY2UyIH0gZnJvbSAnQGx1a2VrYWFsaW0vYWN0LWJhY2tzdGFnZSc7XG5cblxuY29uc3QgbWFpbiA9IGFzeW5jICgpID0+IHtcbiAgY29uc3QgZGF0YUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnU1NSLURBVEEnKVxuICBjb25zdCByb290RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdTU1ItUk9PVCcpXG4gIGlmICghZGF0YUVsZW1lbnQgfHwgIXJvb3RFbGVtZW50KVxuICAgIHJldHVybjtcblxuICBjb25zdCBwYXlsb2FkID0gSlNPTi5wYXJzZShkYXRhRWxlbWVudC5pbm5lclRleHQpIGFzIFNTUlBheWxvYWQ7XG5cbiAgY29uc3QgcmVjb25jaWxlciA9IG5ldyBEZWJ1Z1JlY29uY2lsZXIoKTtcbiAgY29uc3Qgc3BhY2UgPSBuZXcgUmVuZGVyU3BhY2UyKHJlY29uY2lsZXIudHJlZSwgY3JlYXRlV2ViTm9kZUJ1aWxkZXIocm9vdEVsZW1lbnQpKVxuXG4gIC8vYXdhaXQgY3JlYXRlRGVidWdQb3B1cChyZWNvbmNpbGVyKVxuXG4gIGNvbnNvbGUubG9nKCdSZWh5ZHJhdGluZycpO1xuXG4gIHJlaHlkcmF0ZSh7IEFwcCB9LCByZWNvbmNpbGVyLCBzcGFjZSwgcGF5bG9hZCk7XG59XG5cbm1haW4oKTsiXSwKICAibWFwcGluZ3MiOiAiOzs7QUFPQSxNQUFNLGdCQUNOO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFhRSxLQUFLO0FBRUEsTUFBTSwwQkFBTixjQUFzQyxNQUFNO0FBQUEsSUFDakQsY0FBYztBQUNaLFlBQU0sYUFBYTtBQUFBLElBQ3JCO0FBQUEsRUFDRjtBQUdBLE1BQU0scUJBQ047QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNRSxLQUFLO0FBQ0EsTUFBTSxx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akMsV0FBSyxTQUFTLFFBQVEsdUJBQXVCLE1BQU0sR0FBRyxNQUFNO0FBRTVELGFBQU87QUFBQSxJQUNUO0FBQUEsSUFFQSxnQkFBc0I7QUFFcEIsWUFBTSxjQUFjO0FBQ3BCLFdBQUssU0FBUyxZQUFZO0FBQUEsSUFDNUI7QUFBQSxFQUNGOzs7QUNoS0EsTUFBTSxPQUFPLFlBQVk7QUFDdkIsVUFBTSxjQUFjLFNBQVMsZUFBZSxVQUFVO0FBQ3RELFVBQU0sY0FBYyxTQUFTLGVBQWUsVUFBVTtBQUN0RCxRQUFJLENBQUMsZUFBZSxDQUFDO0FBQ25CO0FBRUYsVUFBTSxVQUFVLEtBQUssTUFBTSxZQUFZLFNBQVM7QUFFaEQsVUFBTSxhQUFhLElBQUksZ0JBQWdCO0FBQ3ZDLFVBQU0sUUFBUSxJQUFJLGFBQWEsV0FBVyxNQUFNLHFCQUFxQixXQUFXLENBQUM7QUFJakYsWUFBUSxJQUFJLGFBQWE7QUFFekIsY0FBVSxFQUFFLElBQUksR0FBRyxZQUFZLE9BQU8sT0FBTztBQUFBLEVBQy9DO0FBRUEsT0FBSzsiLAogICJuYW1lcyI6IFsid2luZG93IiwgIm5leHQiLCAicHJldiIsICJ3aW5kb3ciLCAicHJldkluZGV4IiwgInVzZUNvbnRleHQiLCAicHJvdmlkZXIiLCAicmVmIiwgInVzZVN0YXRlIiwgInVzZUVmZmVjdCJdCn0K
