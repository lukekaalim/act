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
  var HTML = ({ children }) => h(renderNodeType, { type: "web:html" }, children);
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

  // ../renderers/web/element.ts
  var createSpiderElement = (type, props, children) => {
    return createElement(type, props, children);
  };
  var hs = createSpiderElement;

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

  // ../renderers/web/scheduler.ts
  var createDOMScheduler = () => {
    let id = null;
    let callbackFunc = () => console.error(`DOMScheduler got callback before callback function was configured`);
    let synccall_available = false;
    let synccall_requested = false;
    const time_budget = 60;
    const onTimeout = () => {
      const start = performance.now();
      id = null;
      synccall_available = true;
      callbackFunc();
      while (synccall_requested) {
        synccall_requested = false;
        const now = performance.now();
        if (now - start >= time_budget) {
          synccall_available = false;
        }
        callbackFunc();
      }
      synccall_available = false;
    };
    return {
      setCallbackFunc(newCallbackFunc) {
        callbackFunc = newCallbackFunc;
      },
      isCallbackPending() {
        return id !== null;
      },
      requestCallback() {
        if (synccall_available) {
          synccall_requested = true;
        } else if (!id) {
          id = globalThis.setTimeout(onTimeout, 0);
        }
      },
      cancelCallback() {
        if (id !== null)
          globalThis.clearTimeout(id);
      }
    };
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
    function useState3(initialValue) {
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
    return { useContext: useContext2, useState: useState3, useEffect: useEffect2 };
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

  // ../renderers/web/render.ts
  var render = (node, root, options = {}) => {
    const scheduler = createDOMScheduler();
    const reconciler = new Reconciler2(scheduler);
    const space = new RenderSpace2(reconciler.tree, createWebNodeBuilder(root, options.window));
    reconciler.bus = space.bus;
    const ref = reconciler.mount(h(HTML, {}, node));
    return { reconciler, space, ref };
  };

  // ../renderers/web/ssr.ts
  var deserializeSSRPayload = (payload, mode, readyForServer) => {
    return {
      contextCommitID: payload.contextCommitID,
      mode,
      readyForServer,
      commitIdRemap: new Map(payload.commitIdRemap),
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
      let id;
      if (data.mode === "client") {
        const remappedId = data.commitIdRemap.get(state.ref.id);
        if (!remappedId)
          throw new Error(`Missing map from Server CommitID => Client CommitID for ${state.ref.id}`);
        id = remappedId;
      } else {
        id = state.ref.id;
      }
      let ssrComponentState = data.components.get(id);
      if (!ssrComponentState) {
        ssrComponentState = {
          id,
          values: /* @__PURE__ */ new Map(),
          deps: /* @__PURE__ */ new Map()
        };
        data.components.set(id, ssrComponentState);
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
      context.commitIdRemap.set(ref.id, commit.id);
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
    const primitiveCommits = [];
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
      switch (commit.element.type) {
        case primitiveNodeTypes.string:
        case primitiveNodeTypes.boolean:
        case primitiveNodeTypes.number:
          primitiveCommits.push(commit);
      }
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
    const primitiveParent = /* @__PURE__ */ new Map();
    for (const primitiveCommit of primitiveCommits) {
      const parent = space.findParent(primitiveCommit.ref);
      if (parent.node && parent.commit) {
        primitiveParent.set(parent.commit.ref.id, parent.commit);
      }
    }
    for (const [id, commit] of primitiveParent) {
      const node = space.nodeByCommit.get(id);
      if (!node)
        continue;
      const textElements = [...node.childNodes].filter((x) => x instanceof Text);
      let queue = [...commit.children];
      let index = 0;
      let subject;
      while (subject = queue.shift()) {
        const commit2 = reconciler.tree.commits.get(subject.id);
        if (space.nodeByCommit.has(commit2.ref.id))
          continue;
        switch (commit2.element.type) {
          case primitiveNodeTypes.string:
          case primitiveNodeTypes.boolean:
          case primitiveNodeTypes.number:
            space.nodeByCommit.set(commit2.ref.id, textElements[index]);
            index++;
            continue;
        }
        queue.unshift(...commit2.children);
      }
    }
    reconciler.bus.render = (delta) => {
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
    const data = ssr.useSSRContext();
    const data2 = useInternalComponentState();
    const ready = ssr.useSSRReady();
    function onInput(event) {
      setName(event.target.value);
    }
    function onBeerTypeInput(event) {
      setBeerType(event.target.value);
    }
    ssr.useEffect(() => {
      console.log(`Downloading beers (${beerType})`);
      fetch(`https://api.sampleapis.com/beers/${beerType}`).then((r) => r.json()).then((payload) => setBeers(payload.map((d) => d.name)));
    }, [beerType]);
    useEffect(() => {
      if (beers.length > 0)
        ready();
    }, [beers]);
    const [a, setA] = useState(false);
    return h("article", {}, [
      h("h1", {}, a ? ["Hello, ", name] : ["Hello, ", name, 24]),
      h("button", { onClick: () => setA(!a) }, "a"),
      h(ChildComponent),
      h("input", { type: "text", value: name, onInput }),
      h("select", { onInput: onBeerTypeInput }, [
        h("option", { value: "ale", selected: "ale" === beerType }, ["ale"]),
        h("option", { value: "stouts", selected: "stouts" === beerType }, "stouts")
      ]),
      h("ol", {}, beers.map((beer) => h("li", {}, beer)))
    ]);
  };
  var HydrateMap = {
    App
    //ChildComponent,
  };

  // ../node_modules/@sindresorhus/fnv1a/index.js
  var FNV_PRIMES = {
    32: 16777619n,
    64: 1099511628211n,
    128: 309485009821345068724781371n,
    256: 374144419156711147060143317175368453031918731002211n,
    512: 35835915874844867368919076489095108449946327955754392558399825615420669938882575126094039892345713852759n,
    1024: 5016456510113118655434598811035278955030765345404790744303017523831112055108147451509157692220295382716162651878526895249385292291816524375083746691371804094271873160484737966720260389217684476157468082573n
  };
  var FNV_OFFSETS = {
    32: 2166136261n,
    64: 14695981039346656037n,
    128: 144066263297769815596495629667062367629n,
    256: 100029257958052580907070968620625704837092796014241193945225284501741471925557n,
    512: 9659303129496669498009435400716310466090418745672637896108374329434462657994582932197716438449813051892206539805784495328239340083876191928701583869517785n,
    1024: 14197795064947621068722070641403218320880622795441933960878474914617582723252296732303717722150864096521202355549365628174669108571814760471015076148029755969804077320157692458563003215304957150157403644460363550505412711285966361610267868082893823963790439336411086884584107735010676915n
  };
  var cachedEncoder = new globalThis.TextEncoder();
  function fnv1aUint8Array(uint8Array, size) {
    const fnvPrime = FNV_PRIMES[size];
    let hash = FNV_OFFSETS[size];
    for (let index = 0; index < uint8Array.length; index++) {
      hash ^= BigInt(uint8Array[index]);
      hash = BigInt.asUintN(size, hash * fnvPrime);
    }
    return hash;
  }
  function fnv1aEncodeInto(string, size, utf8Buffer) {
    if (utf8Buffer.length === 0) {
      throw new Error("The `utf8Buffer` option must have a length greater than zero");
    }
    const fnvPrime = FNV_PRIMES[size];
    let hash = FNV_OFFSETS[size];
    let remaining = string;
    while (remaining.length > 0) {
      const result = cachedEncoder.encodeInto(remaining, utf8Buffer);
      remaining = remaining.slice(result.read);
      for (let index = 0; index < result.written; index++) {
        hash ^= BigInt(utf8Buffer[index]);
        hash = BigInt.asUintN(size, hash * fnvPrime);
      }
    }
    return hash;
  }
  function fnv1a(value, { size = 32, utf8Buffer } = {}) {
    if (!FNV_PRIMES[size]) {
      throw new Error("The `size` option must be one of 32, 64, 128, 256, 512, or 1024");
    }
    if (typeof value === "string") {
      if (utf8Buffer) {
        return fnv1aEncodeInto(value, size, utf8Buffer);
      }
      value = cachedEncoder.encode(value);
    }
    return fnv1aUint8Array(value, size);
  }

  // ../node_modules/@sindresorhus/string-hash/index.js
  function stringHash(string) {
    return Number(fnv1a(string));
  }

  // ../tooling/insight/TreeViewer.module.css
  var TreeViewer_default = {
    elementBar: "TreeViewer_elementBar",
    elementName: "TreeViewer_elementName",
    commit: "TreeViewer_commit",
    selected: "TreeViewer_selected",
    commitList: "TreeViewer_commitList",
    top: "TreeViewer_top"
  };

  // ../tooling/insight/AttributeTag.module.css
  var AttributeTag_default = {
    commitAttributeTag: "AttributeTag_commitAttributeTag",
    commitAttributeTagName: "AttributeTag_commitAttributeTagName",
    commitAttributeTagValue: "AttributeTag_commitAttributeTagValue"
  };

  // ../tooling/insight/AttributeTag.ts
  var CommitAttributeTag = ({ name, value }) => {
    const background = `hsl(${stringHash(name) % 360}deg, 50%, 50%)`;
    return hs("span", { className: AttributeTag_default.commitAttributeTag, style: { background } }, [
      hs("span", { className: AttributeTag_default.commitAttributeTagName }, name),
      hs("span", { className: AttributeTag_default.commitAttributeTagValue }, value)
    ]);
  };

  // ../tooling/insight/TreeViewer.ts
  var CommitPreview = ({
    commit,
    depth = 0,
    attributes = [],
    renderCommit,
    color,
    onClick
  }) => {
    const background = `hsl(${depth * 22.3 % 360}deg, 50%, 80%)`;
    const elementBackground = color || `hsl(${stringHash(commit.element.type) % 360}deg, 60%, 80%)`;
    const lineColor = `hsl(${stringHash(commit.id.toString()) % 360}, 100%, 20%)`;
    return hs("div", { className: TreeViewer_default.commit, style: { position: "relative" }, id: `commit:${commit.id}` }, [
      commit.children.length > 0 && h("div", { style: {
        position: "absolute",
        top: "5px",
        height: "calc(100% - 18px)",
        width: "1px",
        background: lineColor,
        transform: `translate(20px, 0px)`
      } }),
      hs("div", { className: [TreeViewer_default.elementBar].join(" "), style: { "position": "relative" } }, [
        hs(
          "button",
          { onClick, className: TreeViewer_default.elementName, style: { background: elementBackground } },
          commit.element.type
        ),
        h(CommitAttributeTag, { name: "Id", value: commit.id.toString() }),
        attributes.map(([name, value]) => h(CommitAttributeTag, { name, value }))
        //h(CommitAttributeTag, { name: 'Version', value: commit.version.toString() }),
      ]),
      !!renderCommit && hs("ol", { className: TreeViewer_default.commitList }, commit.children.map((childId) => h("li", { key: childId, style: { position: "relative" } }, [
        renderCommit(childId),
        h("div", { style: {
          top: 0,
          width: "25px",
          height: "1px",
          "border-top": "2px dotted black",
          position: "absolute",
          transform: `translate(-22px, 15px)`
        } })
      ])))
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
        return { type: "complex", name: value.description ? `symbol(${value.description})` : "symbol" };
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
        externalUpdate() {
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

  // ../tooling/insight/ScheduleControls.ts
  var ScheduleControls = ({ controller, bus, reconciler, state, onStateChange = () => {
  } }) => {
    useEffect(() => {
      bus.onInterceptStart = () => {
        onStateChange({ ...state, paused: true });
      };
      bus.onInterceptEnd = () => {
        onStateChange({ ...state, paused: false });
      };
      bus.onAfterCallbackExecute = () => {
      };
    }, [bus, reconciler, state]);
    const onStepClick = () => {
      controller.step();
    };
    const onResumeClick = () => {
      controller.cancelIntercept();
    };
    const onChangeBreakBeforeUpdate = (event) => {
      onStateChange({ ...state, breakOnBeforeUpdate: event.target.checked });
    };
    const onChangeBreakAfterUpdate = (event) => {
      onStateChange({ ...state, breakOnAfterUpdate: event.target.checked });
    };
    return h("div", { style: { background: state.paused ? "red" : "white", padding: "8px", display: "flex", gap: "12px" } }, [
      h("div", { style: { display: "flex", "flex-direction": "column" } }, [
        h("label", { style: { "margin": "auto 0" } }, [
          h("span", {}, `Break Before Update`),
          h("input", { type: "checkbox", checked: state.breakOnBeforeUpdate, onChange: onChangeBreakBeforeUpdate })
        ]),
        h("label", { style: { "margin": "auto 0" } }, [
          h("span", {}, `Break After Update`),
          h("input", { type: "checkbox", checked: state.breakOnAfterUpdate, onChange: onChangeBreakAfterUpdate })
        ])
      ]),
      h("button", { onClick: onStepClick, disabled: !state.paused, style: { padding: "8px" } }, "Step"),
      h("button", { onClick: onResumeClick, disabled: !state.paused, style: { padding: "8px" } }, "Resume"),
      h("span", {
        style: { border: `2px solid ${state.paused ? "orange" : "black"}`, "border-radius": "8px", padding: "8px" }
      }, state.paused ? `Paused` : `Ready`)
    ]);
  };

  // ../tooling/insight/lookup.ts
  var CommitLookupCache = class {
    map = /* @__PURE__ */ new Map();
    roots = /* @__PURE__ */ new Set();
    setTree(tree) {
      this.map.clear();
      this.roots.clear();
      for (const commit of tree.commits) {
        this.map.set(commit.id, commit);
        if (!commit.parent)
          this.roots.add(commit.id);
      }
    }
    ingest(delta) {
      for (const create of delta.created) {
        this.map.set(create.id, create);
        if (!create.parent)
          this.roots.add(create.id);
      }
      for (const update of delta.updated)
        this.map.set(update.id, update);
      for (const remove of delta.removed) {
        this.map.delete(remove.id);
        this.roots.delete(remove.id);
      }
    }
  };
  var ThreadLookupCache = class {
    canon;
    report = null;
    thread = null;
    constructor(canon) {
      this.canon = canon;
    }
    roots = /* @__PURE__ */ new Set();
    created = /* @__PURE__ */ new Set();
    updated = /* @__PURE__ */ new Set();
    removed = /* @__PURE__ */ new Set();
    /**
     * An up to date map of the tree, plus deleted notes in this delta
     */
    all = /* @__PURE__ */ new Map();
    nextTask = null;
    prevTask = null;
    allTasks = /* @__PURE__ */ new Map();
    targets = /* @__PURE__ */ new Set();
    visited = /* @__PURE__ */ new Set();
    /**
     * Clear the delta cache
     */
    reset() {
      this.roots = new Set(this.canon.roots);
      this.all = new Map(this.canon.map);
      this.allTasks = /* @__PURE__ */ new Map();
      this.nextTask = null;
      this.prevTask = null;
      this.report = null;
      this.created.clear();
      this.updated.clear();
      this.removed.clear();
      this.targets.clear();
      this.visited.clear();
    }
    ingestThread(thread) {
      this.thread = thread;
      this.nextTask = thread.pendingTasks[thread.pendingTasks.length - 1];
      this.targets = new Set(thread.reasons.map((reason) => reason.target));
      this.visited = new Set(thread.visited);
      this.allTasks = new Map(thread.pendingTasks.map((task) => [task.id, task]));
    }
    ingestDelta(delta) {
      this.report = delta;
      const createdIds = new Set(delta.created.map((c) => c.id));
      for (const commit of delta.created) {
        this.created.add(commit.id);
        const children = [...new Set(commit.children.filter((c) => this.all.has(c) || createdIds.has(c)))];
        this.all.set(commit.id, { ...commit, children });
        if (!commit.parent)
          this.roots.add(commit.id);
      }
      for (const commit of delta.updated) {
        const existingCommit = this.canon.map.get(commit.id);
        const children = [.../* @__PURE__ */ new Set([
          ...commit.children.filter((c) => this.all.has(c)),
          ...existingCommit.children
        ])];
        const mergedCommitReport = { ...commit, children };
        this.updated.add(commit.id);
        this.all.set(commit.id, mergedCommitReport);
      }
      for (const commit of delta.removed) {
        this.removed.add(commit.id);
        this.all.set(commit.id, commit);
      }
    }
    getFlat() {
      const pending = [...this.roots.values()].map((root) => this.all.get(root)).filter((x) => !!x);
      const flat = [];
      while (pending.length > 0) {
        const commit = pending.pop();
        flat.push(commit);
        for (const childId of [...commit.children].reverse()) {
          const child = this.all.get(childId);
          if (child)
            pending.push(child);
        }
      }
      return flat;
    }
  };

  // ../tooling/insight/Virtual.ts
  var Virtual1D = ({ chunkSize, chunkCount, renderChunk, viewportRef: propViewportRef, windowRange }) => {
    const [start, setStart] = useState(0);
    const [end, setEnd] = useState(0);
    const localViewportRef = useRef(null);
    const viewportRef = propViewportRef || localViewportRef;
    const listRef = useRef(null);
    useEffect(() => {
      if (!viewportRef.current)
        return;
      const viewport = viewportRef.current;
      const setViewport = () => {
        const rect = viewport.getBoundingClientRect();
        setStart(Math.floor(viewport.scrollTop / chunkSize));
        setEnd(Math.ceil((viewport.scrollTop + rect.height) / chunkSize));
      };
      setViewport();
      viewport.addEventListener("scroll", setViewport);
      return () => {
        viewport.removeEventListener("scroll", setViewport);
      };
    }, [propViewportRef]);
    const renderedIndices = Array.from({ length: end - start }).map((_, i) => start + i).filter((x) => x >= 0 && x < chunkCount);
    return [
      //h('pre', {}, renderedIndices.join(', ')),
      h(
        "div",
        { ref: viewportRef, style: { overflow: "auto", height: "100%" } },
        h(
          "div",
          { ref: listRef, style: { height: chunkSize * chunkCount + "px", position: "relative" } },
          renderedIndices.map((index) => h(
            "div",
            { style: { position: "absolute", top: index * chunkSize + "px", height: chunkSize, padding: "-1", border: "1px dotted black", width: "100%" } },
            renderChunk(index)
          ))
        )
      )
    ];
  };

  // ../tooling/insight/InsightApp.ts
  var INSIGHT_SETTINGS_LOCALSTORAGE_KEY = `INSIGHT_SETTINGS`;
  var InsightApp = ({ onReady, controller, bus, document: document2 = window.document }) => {
    const [c, setRenderCounter] = useState(0);
    const storedState = useMemo(() => {
      const settings = window.localStorage.getItem(INSIGHT_SETTINGS_LOCALSTORAGE_KEY);
      if (!settings)
        return;
      return JSON.parse(settings);
    }, []);
    const [insightState, setInsightState] = useState({
      commitBreakpoints: /* @__PURE__ */ new Set(),
      breakOnAfterUpdate: storedState ? storedState.breakOnAfterUpdate : false,
      breakOnBeforeUpdate: storedState ? storedState.breakOnBeforeUpdate : false,
      paused: false
    });
    useEffect(() => {
      window.localStorage.setItem(INSIGHT_SETTINGS_LOCALSTORAGE_KEY, JSON.stringify({
        breakOnAfterUpdate: insightState.breakOnAfterUpdate,
        breakOnBeforeUpdate: insightState.breakOnBeforeUpdate
      }));
    }, [insightState]);
    const commitCache = useRef(() => new CommitLookupCache()).current;
    const deltaCache = useRef(() => new ThreadLookupCache(commitCache)).current;
    useMemo(() => {
      commitCache.setTree(controller.getTree());
      deltaCache.reset();
    }, []);
    useEffect(() => {
      console.log("[Insight] Populate Cache");
      bus.externalUpdate = () => {
        const delta = controller.getDelta();
        const thread = controller.getThread();
        commitCache.setTree(controller.getTree());
        deltaCache.ingestDelta(delta);
        deltaCache.ingestThread(thread);
        setRenderCounter((c2) => c2 + 1);
      };
      bus.onThreadDone = (thread, delta) => {
        console.log("[Insight] ThreadDone");
        commitCache.ingest(delta);
        deltaCache.ingestDelta(delta);
        deltaCache.ingestThread(thread);
        deltaCache.prevTask = null;
        setRenderCounter((c2) => c2 + 1);
        for (const subscriber of cacheSubscribers) {
          subscriber();
        }
      };
      bus.thread.onQueue = (reason) => {
        console.log("[Insight] OnQueue");
        const thread = controller.getThread();
        if (thread.reasons.length === 1) {
          if (insightState.breakOnBeforeUpdate)
            controller.scheduler.intercept = true;
          commitCache.setTree(controller.getTree());
          deltaCache.reset();
          deltaCache.ingestThread(thread);
          setRenderCounter((c2) => c2 + 1);
          for (const subscriber of cacheSubscribers) {
            subscriber();
          }
        }
      };
      bus.thread.onWork = (prevTask, nextTask, isDone) => {
        if (insightState.breakOnAfterUpdate && isDone) {
          controller.scheduler.intercept = true;
        }
        if (nextTask && insightState.commitBreakpoints.has(nextTask.id)) {
          controller.scheduler.intercept = true;
        }
        if (controller.scheduler.intercept) {
          const thread = controller.getThread();
          const delta = controller.getDelta();
          deltaCache.ingestDelta(delta);
          deltaCache.ingestThread(thread);
          setRenderCounter((c2) => c2 + 1);
          for (const subscriber of cacheSubscribers) {
            subscriber();
          }
          if (prevTask)
            deltaCache.prevTask = prevTask;
        }
      };
      onReady();
    }, [controller, bus, insightState]);
    const cacheSubscribers = useRef(/* @__PURE__ */ new Set()).current;
    const scrollToCommitIndex = useMemo(() => {
      return (index) => {
        if (!viewportRef.current)
          return;
        const viewPortRect = viewportRef.current.getBoundingClientRect();
        if (index) {
          viewportRef.current.scrollTo({
            top: index * 33 - viewPortRect.height / 2,
            behavior: "smooth"
          });
          return;
        }
      };
    }, []);
    useEffect(() => {
      const { nextTask, prevTask } = deltaCache;
      const task = nextTask || prevTask;
      const index = task && commits.findIndex((c2) => nextTask && c2.id === nextTask.id || prevTask && prevTask.id === c2.id);
      if (index && index !== -1) {
        scrollToCommitIndex(index);
      }
    }, [deltaCache.prevTask, deltaCache.nextTask, scrollToCommitIndex]);
    const renderCommit = useMemo(() => (commitId) => {
      return h(CommitComponent, { commitId });
    }, []);
    const CommitComponent = useMemo(() => ({ commitId }) => {
      const [c2, setRenderCounter2] = useState(0);
      useEffect(() => {
        const subscription = () => {
          const commit2 = deltaCache.all.get(commitId);
          const originalCommit = commitCache.map.get(commitId);
          const inTaskList = deltaCache.allTasks.has(commitId);
          if (commit2 !== originalCommit || inTaskList || deltaCache.prevTask && deltaCache.prevTask.id === commitId)
            setRenderCounter2((c3) => c3 + 1);
        };
        cacheSubscribers.add(subscription);
        subscription();
        return () => {
          console.log(`[Commit] Cleaning up ${commitId}`);
          cacheSubscribers.delete(subscription);
        };
      }, [commitId]);
      const commit = deltaCache.all.get(commitId) || null;
      if (!commit)
        return console.warn(`[Commit] Commit ${commitId} not found in delta cache`), null;
      const color = deltaCache.nextTask && deltaCache.nextTask.id === commit.id ? "#e1d600ff" : deltaCache.targets.has(commit.id) ? "#db55e7ff" : deltaCache.allTasks.has(commit.id) ? "#ea931aff" : deltaCache.created.has(commit.id) ? deltaCache.prevTask && deltaCache.prevTask.id === commit.id ? "#4bc847ff" : "#21a51cff" : deltaCache.removed.has(commit.id) ? "#f25252ff" : deltaCache.updated.has(commit.id) ? "#1ab9eaff" : deltaCache.visited.has(commit.id) ? "#6f6f97ff" : "#cacaca";
      if (!commit)
        return console.log(`[Commit] ${commitId} not ready yet??`), null;
      return useMemo(() => h(CommitPreview, { commit, renderCommit, color, onClick: () => setSelectedCommitId(commit.id) }), [
        commit.version,
        color
      ]);
    }, []);
    const reload = () => {
      commitCache.setTree(controller.getTree());
      deltaCache.reset();
      deltaCache.ingestDelta(controller.getDelta());
      deltaCache.ingestThread(controller.getThread());
      setRenderCounter((c2) => c2 + 1);
    };
    const viewportRef = useRef(null);
    const [selectedCommitId, setSelectedCommitId] = useState(null);
    const [selectedCommitDetails, setSelectedCommitDetails] = useState(null);
    useEffect(() => {
      if (!selectedCommitId)
        return;
      const details = controller.getDetails(selectedCommitId);
      setSelectedCommitDetails(details);
    }, [selectedCommitId]);
    const roots = [...deltaCache.roots.keys()];
    const commits = deltaCache.getFlat();
    const CHUNK_SIZE = 8;
    return h("div", { style: { display: "flex", "flex-direction": "column", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } }, [
      h("div", { style: { flex: 0, display: "flex" } }, [
        h(ScheduleControls, {
          controller: controller.scheduler,
          bus: bus.scheduler,
          reconciler: controller,
          state: insightState,
          onStateChange: setInsightState
        }),
        h("button", { onClick: reload }, "Reload")
      ]),
      h("div", { style: { flex: 1, overflow: "hidden", background: "#c0d7ddff", display: "flex" } }, [
        h(
          "div",
          { style: { flex: 1 } },
          //h(TreeViewer, { roots, renderCommit }),
          h(Virtual1D, { viewportRef, windowRange: 5, chunkCount: commits.length / CHUNK_SIZE, chunkSize: 33 * CHUNK_SIZE, renderChunk(index) {
            if (index < 0)
              return null;
            return Array.from({ length: CHUNK_SIZE }).map((_, chunkIndex) => {
              const report = commits[index * CHUNK_SIZE + chunkIndex];
              if (!report)
                return null;
              const color = getCommitColor(deltaCache, report.id);
              const onClick = () => {
                setSelectedCommitId(report.id);
              };
              const attributes = [
                insightState.commitBreakpoints.has(report.id) ? ["Breakpoint", "Enabled"] : null
              ].filter((x) => !!x);
              return h("div", { style: { "margin-left": (report.distance - 1) * 32 + "px", height: "33px" } }, [
                h(CommitPreview, { color, commit: report, onClick, attributes })
              ]);
            });
          } })
        ),
        h("div", { style: { "min-width": "300px", flex: 0, background: "#ffdeabff" } }, [
          deltaCache.thread && h("div", {}, [
            h("dl", {}, [
              h("dt", {}, "Thread ID"),
              h("dd", {}, deltaCache.thread.id),
              h("dt", {}, "Thread Done"),
              h("dd", {}, deltaCache.thread.done.toString()),
              h("dt", {}, "Thread Passes"),
              h("dd", {}, deltaCache.thread.passes),
              h("dt", {}, "Tasks (count)"),
              h("dd", {}, deltaCache.thread.pendingTasks.length),
              h("dt", {}, "Visited (count)"),
              h("dd", {}, deltaCache.thread.visited.length),
              h("dt", {}, "Created (count)"),
              h("dd", {}, deltaCache.created.size),
              h("dt", {}, "Updated (count)"),
              h("dd", {}, deltaCache.updated.size),
              h("dt", {}, "Removed (count)"),
              h("dd", {}, deltaCache.removed.size),
              h("dt", {}, "MustRender "),
              h("dd", {}, deltaCache.thread.mustRender.map((commitId) => {
                const commit = deltaCache.all.get(commitId);
                if (!commit)
                  return null;
                const color = getCommitColor(deltaCache, commitId);
                return h(CommitPreview, {
                  commit,
                  color,
                  onClick: () => (scrollToCommitIndex(commits.indexOf(commit)), setSelectedCommitId(commitId))
                });
              })),
              h("dt", {}, "Missed"),
              h("dd", {}, deltaCache.thread.missed.map((commitId) => {
                const commit = deltaCache.all.get(commitId);
                if (!commit)
                  return null;
                const color = getCommitColor(deltaCache, commitId);
                return h(CommitPreview, {
                  commit,
                  color,
                  onClick: () => (scrollToCommitIndex(commits.indexOf(commit)), setSelectedCommitId(commitId))
                });
              }))
            ])
          ]),
          h("hr"),
          selectedCommitDetails && [
            h(CommitPreview, {
              commit: selectedCommitDetails.commit,
              color: getCommitColor(deltaCache, selectedCommitDetails.commit.id),
              onClick: () => (scrollToCommitIndex(commits.indexOf(selectedCommitDetails.commit)), setSelectedCommitId(selectedCommitDetails.commit.id))
            }),
            h("button", { onClick: () => {
              setInsightState((state) => {
                const prev = state.commitBreakpoints;
                if (prev.has(selectedCommitDetails.commit.id)) {
                  prev.delete(selectedCommitDetails.commit.id);
                  return { ...state, commitBreakpoints: new Set(prev) };
                }
                prev.add(selectedCommitDetails.commit.id);
                return { ...state, commitBreakpoints: new Set(prev) };
              });
            } }, "Toggle Breakpoint"),
            h("h3", {}, "Parent"),
            (() => {
              const parentId = selectedCommitDetails.commit.parent;
              if (!parentId)
                return "NO PARENT";
              const parent = deltaCache.all.get(parentId);
              if (!parent)
                return h(CommitAttributeTag, { name: "ParentID", value: parentId.toString() });
              return h(CommitPreview, {
                commit: parent,
                color: getCommitColor(deltaCache, parent.id),
                onClick: () => (scrollToCommitIndex(commits.indexOf(parent)), setSelectedCommitId(parent.id))
              });
            })(),
            h("h3", {}, "Props"),
            h(
              "ul",
              {},
              Object.entries(selectedCommitDetails.props).map(([prop, value]) => {
                return h("li", {}, `${prop} = ${getTextForValue(value)}`);
              })
            )
          ]
        ])
      ])
    ]);
  };
  var getTextForValue = (value) => {
    switch (value.type) {
      case "primitive":
        switch (typeof value.value) {
          case "object":
            return `null`;
          case "string":
          case "boolean":
          case "number":
            return value.value.toString();
        }
      case "complex":
        return value.name;
      case "undefined":
        return `undefined`;
      default:
        return value;
    }
  };
  var getCommitColor = (deltaCache, commitId) => {
    const color = deltaCache.nextTask && deltaCache.nextTask.id === commitId ? "#e1d600ff" : deltaCache.targets.has(commitId) ? "#db55e7ff" : deltaCache.allTasks.has(commitId) ? "#ea931aff" : deltaCache.created.has(commitId) ? deltaCache.prevTask && deltaCache.prevTask.id === commitId ? "#4bc847ff" : "#21a51cff" : deltaCache.removed.has(commitId) ? "#f25252ff" : deltaCache.updated.has(commitId) ? "#1ab9eaff" : deltaCache.visited.has(commitId) ? "#6f6f97ff" : "#cacaca";
    return color;
  };

  // ../tooling/insight/utils.ts
  var createDebugPopup = async (reconciler) => {
    const newWindow = window.open("", "DevTools", "popup");
    if (!newWindow)
      throw new Error(`Unable to make/find new window!`);
    const body = newWindow.document.body;
    for (const child of [...body.childNodes, ...newWindow.document.head.childNodes])
      child.remove();
    for (const headElement of [...window.document.head.childNodes])
      if (headElement instanceof HTMLStyleElement)
        newWindow.document.head.appendChild(headElement.cloneNode(true));
      else if (headElement instanceof HTMLLinkElement) {
        const element = headElement.cloneNode(true);
        const src = new URL(element.href, document.location.href);
        element.href = src.href;
        newWindow.document.head.appendChild(element);
      }
    return new Promise((onReady) => {
      render(
        h(InsightApp, { controller: reconciler.controller, bus: reconciler.debugBus, document: newWindow.document, onReady }),
        body,
        { window: newWindow }
      );
    });
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
    await createDebugPopup(reconciler);
    rehydrate(HydrateMap, reconciler, space, payload);
    reconciler.debugBus.externalUpdate();
  };
  main();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vY29yZS9lcnJvcnMudHMiLCAiLi4vY29yZS9ob29rcy50cyIsICIuLi9jb3JlL2lkLnRzIiwgIi4uL2NvcmUvZWxlbWVudC50cyIsICIuLi9jb3JlL2NvbnRleHQudHMiLCAiLi4vY29yZS9ub2RlLnRzIiwgIi4uL2NvcmUvc3BlY2lhbC50cyIsICIuLi9jb3JlL21vZC50cyIsICIuLi9yZW5kZXJlcnMvd2ViL3Byb3BzLnRzIiwgIi4uL3JlbmRlcmVycy93ZWIvc3BhY2UudHMiLCAiLi4vcmVuZGVyZXJzL3dlYi9lbGVtZW50LnRzIiwgIi4uL3JlbmRlcmVycy9iYWNrc3RhZ2Uvc3BhY2UyLnRzIiwgIi4uL3JlbmRlcmVycy93ZWIvc2NoZWR1bGVyLnRzIiwgIi4uL3JlY29uL2FsZ29yaXRobXMudHMiLCAiLi4vcmVjb24vcG9vbC50cyIsICIuLi9yZWNvbi9jb21taXQudHMiLCAiLi4vcmVjb24vZGVsdGEudHMiLCAiLi4vcmVjb24vaG9va3MudHMiLCAiLi4vcmVjb24vdXBkYXRlLnRzIiwgIi4uL3JlY29uL2ludGVybmFsLnRzIiwgIi4uL3JlY29uL2VsZW1lbnQudHMiLCAiLi4vcmVjb24vdGhyZWFkLnRzIiwgIi4uL3JlY29uL3N0YXRlLnRzIiwgIi4uL3JlY29uL3RyZWUudHMiLCAiLi4vcmVjb24vcmVjb25jaWxlci50cyIsICIuLi9yZW5kZXJlcnMvd2ViL3JlbmRlci50cyIsICIuLi9yZW5kZXJlcnMvd2ViL3Nzci50cyIsICIuLi9yZW5kZXJlcnMvd2ViL3JlaHlkcmF0ZS50cyIsICJhcHAudHMiLCAiLi4vbm9kZV9tb2R1bGVzL0BzaW5kcmVzb3JodXMvZm52MWEvaW5kZXguanMiLCAiLi4vbm9kZV9tb2R1bGVzL0BzaW5kcmVzb3JodXMvc3RyaW5nLWhhc2gvaW5kZXguanMiLCAiLi4vdG9vbGluZy9pbnNpZ2h0L1RyZWVWaWV3ZXIubW9kdWxlLmNzcyIsICIuLi90b29saW5nL2luc2lnaHQvQXR0cmlidXRlVGFnLm1vZHVsZS5jc3MiLCAiLi4vdG9vbGluZy9pbnNpZ2h0L0F0dHJpYnV0ZVRhZy50cyIsICIuLi90b29saW5nL2luc2lnaHQvVHJlZVZpZXdlci50cyIsICIuLi90b29saW5nL2RlYnVnL3V0aWxzLnRzIiwgIi4uL3Rvb2xpbmcvZGVidWcvcmVwb3J0LnRzIiwgIi4uL3Rvb2xpbmcvZGVidWcvc2NoZWR1bGVyLnRzIiwgIi4uL3Rvb2xpbmcvZGVidWcvcmVjb25jaWxlci50cyIsICIuLi90b29saW5nL2luc2lnaHQvU2NoZWR1bGVDb250cm9scy50cyIsICIuLi90b29saW5nL2luc2lnaHQvbG9va3VwLnRzIiwgIi4uL3Rvb2xpbmcvaW5zaWdodC9WaXJ0dWFsLnRzIiwgIi4uL3Rvb2xpbmcvaW5zaWdodC9JbnNpZ2h0QXBwLnRzIiwgIi4uL3Rvb2xpbmcvaW5zaWdodC91dGlscy50cyIsICJjbGllbnQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImV4cG9ydCBjbGFzcyBNYWdpY0Vycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihgQWRkaXRpb25hbCBtYWdpYyBpcyBuZWVkZWQgdG8gYmUgYWJsZSB0byBydW4gdGhpcyBmdW5jdGlvbmApO1xuICB9XG59XG5cblxuY29uc3QgdW5zZXRIb29rVGV4dCA9XG5gXG5BIGhvb2sgd2FzIHJ1biwgYnV0IGl0IGRpZG50IGhhdmUgYW55IGltcGxlbWVudGF0aW9ucyBzZXQgdXAgZm9yIGl0LlxuXG5UaGlzIGVycm9yIG1pZ2h0IGJlIGNhdXNlZCBieSBtYW51YWxseSBjYWxsaW5nIGEgY29tcG9uZW50IGZ1bmN0aW9uXG4ob3IgYSBob29rIGRpcmVjdGx5KSBvdXRzaWRlIG9mIGFjdCwgb3IgYnkgbXVsdGlwbGUgY29waWVzIG9mXG5BY3QgaW4gYSBwcm9qZWN0IGF0IG9uY2UhXG5cblRoZSByZW5kZXJlciBpcyBzdXBwb3NlZCB0byBzZXQgdXAgaW1wbGVtZW50YXRpb24gZm9yIGVhY2ggaG9vayBiZWZvcmVcbml0IHJ1bnMgdGhlIGNvbXBvbmVudC5cblxuQ2hlY2sgdGhlIGxvY2F0aW9uIG9mIHRoaXMgZXJyb3IsIGFuZCB3aGljaCB2ZXJzaW9uIG9mIGFjdCB5b3VyXG5yZW5kZXJlciB1c2VzIGludGVybmFseS4gWW91IG1pZ2h0IGdldCB0aGlzIGVycm9yIGlmIHRob3NlIGFyZSB0d29cbmRpZmZlcmVudCBwYWNrYWdlcyFcbmAudHJpbSgpO1xuXG5leHBvcnQgY2xhc3MgVW5zZXRIb29rSW1wbGVtZW50YXRpb24gZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKHVuc2V0SG9va1RleHQpO1xuICB9XG59XG5cblxuY29uc3QgdW5rbm93bkVsZW1lbnRUZXh0ID1cbmBcbkVuY291bnRlcmVkIGFuIG9iamVjdCB0aGF0IGlzIG5vdCBhbnkgb2YgdGhlIGV4cGVjdGVkIG5vZGUgdHlwZXMsIGxpa2VcbnN0cmluZywgbnVtYmVyLCBib29sZWFuLCBhcnJheSwgbnVsbCwgb3IgdGhlIHJlc3VsdCBvZiBhIGNhbGwgdG8gY3JlYXRlRWxlbWVudC5cblxuTWF5YmUgc29tZXRoaW5nIHdhcyBhY2NpZGVudGFsbHkgcmV0dXJuZWQgZnJvbSBhIENvbXBvbmVudCwgb3Igd2FzIHBhc3NlZFxuYXMgYSBjaGlsZCB0byBhbiBlbGVtZW50P1xuYC50cmltKCk7XG5leHBvcnQgY2xhc3MgVW5rbm93bkVsZW1lbnRUeXBlIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcih1bmtub3duRWxlbWVudFRleHQpXG4gIH1cbn0iLCAiaW1wb3J0IHsgQ29udGV4dCB9IGZyb20gXCIuL2NvbnRleHQudHNcIjtcbmltcG9ydCB7IFVuc2V0SG9va0ltcGxlbWVudGF0aW9uIH0gZnJvbSBcIi4vZXJyb3JzLnRzXCI7XG5cbmV4cG9ydCB0eXBlIEhvb2tJbXBsZW1lbnRhdGlvbiA9IHtcbiAgdXNlU3RhdGU6IHR5cGVvZiB1c2VTdGF0ZTtcbiAgdXNlRWZmZWN0OiB0eXBlb2YgdXNlRWZmZWN0O1xuICB1c2VDb250ZXh0OiB0eXBlb2YgdXNlQ29udGV4dDtcbn07XG5jb25zdCBwbGFjZWhvbGRlckltcGxlbWVudGF0aW9uID0gKCkgPT4ge1xuICB0aHJvdyBuZXcgVW5zZXRIb29rSW1wbGVtZW50YXRpb24oKTtcbn07XG5leHBvcnQgY29uc3QgaG9va0ltcGxlbWVudGF0aW9uOiBIb29rSW1wbGVtZW50YXRpb24gPSB7XG4gIHVzZVN0YXRlOiBwbGFjZWhvbGRlckltcGxlbWVudGF0aW9uLFxuICB1c2VFZmZlY3Q6IHBsYWNlaG9sZGVySW1wbGVtZW50YXRpb24sXG4gIHVzZUNvbnRleHQ6IHBsYWNlaG9sZGVySW1wbGVtZW50YXRpb24sXG59O1xuXG5leHBvcnQgdHlwZSBEZXBzID0gdW5rbm93bltdIHwgbnVsbDtcbmV4cG9ydCB0eXBlIFZhbHVlT3JDYWxjdWxhdG9yPFQ+ID1cbiAgfCBFeGNsdWRlPFQsICguLi5hcmdzOiB1bmtub3duW10pID0+IHVua25vd24+XG4gIHwgKCgpID0+IFQpO1xuXG5leHBvcnQgY29uc3QgY2FsY3VsYXRlVmFsdWUgPSA8VD4oXG4gIHZhbHVlT3JDYWxjdWxhdG9yOiBWYWx1ZU9yQ2FsY3VsYXRvcjxUPlxuKTogVCA9PiB7XG4gIGlmICh0eXBlb2YgdmFsdWVPckNhbGN1bGF0b3IgPT09IFwiZnVuY3Rpb25cIilcbiAgICByZXR1cm4gKHZhbHVlT3JDYWxjdWxhdG9yIGFzICgpID0+IFQpKCk7XG4gIHJldHVybiB2YWx1ZU9yQ2FsY3VsYXRvcjtcbn07XG5leHBvcnQgY29uc3QgY2FsY3VsYXRlRGVwc0NoYW5nZSA9IChwcmV2OiBEZXBzLCBuZXh0OiBEZXBzKSA9PiB7XG4gIGlmICghcHJldiB8fCAhbmV4dCkgcmV0dXJuIHRydWU7XG4gIHJldHVybiAoXG4gICAgcHJldi5sZW5ndGggIT09IG5leHQubGVuZ3RoIHx8IHByZXYuc29tZSgodmFsdWUsIGkpID0+IHZhbHVlICE9PSBuZXh0W2ldKVxuICApO1xufTtcbmV4cG9ydCBjb25zdCBydW5VcGRhdGVyID0gPFQ+KFxuICBwcmV2OiBULFxuICB1cGRhdGVyOiBVcGRhdGVyPFQ+XG4pOiBUID0+IHtcbiAgaWYgKHR5cGVvZiB1cGRhdGVyID09PSBcImZ1bmN0aW9uXCIpXG4gICAgcmV0dXJuICh1cGRhdGVyIGFzIChwcmV2OiBUKSA9PiBUKShwcmV2KTtcbiAgcmV0dXJuIHVwZGF0ZXI7XG59O1xuXG4vKipcbiAqIFVzZSBTdGF0ZVxuICpcbiAqIFN0b3JlIGEgdmFsdWUgaW5zaWRlIHRoZSBjb21wb25lbnQgc3RhdGUsIGFuZCBhcXVpcmVcbiAqIGFuZCBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIHVwZGF0ZSB0aGF0IHZhbHVlLFxuICogdHJpZ2dlciBhIHJlLXJlbmRlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHVzZVN0YXRlID0gPFQ+KFxuICBpbml0aWFsVmFsdWU6IFZhbHVlT3JDYWxjdWxhdG9yPFQ+XG4pOiBbVCwgU3RhdGVTZXR0ZXI8VD5dID0+IHtcbiAgcmV0dXJuIGhvb2tJbXBsZW1lbnRhdGlvbi51c2VTdGF0ZShpbml0aWFsVmFsdWUpO1xufTtcbmV4cG9ydCB0eXBlIFN0YXRlU2V0dGVyPFQ+ID0gKHVwZGF0ZXI6IFVwZGF0ZXI8VD4pID0+IHZvaWQ7XG5leHBvcnQgdHlwZSBVcGRhdGVyPFQ+ID0gVCB8ICgocHJldjogVCkgPT4gVCk7XG5cbi8qKlxuICogVXNlIEVmZmVjdFxuICpcbiAqIFBhc3NpbmcgYSBmdW5jdGlvbiBpbnRvIHRoaXMgaG9vayBjYXVzZXMgaXQgdG8gYmUgcnVuIGFmdGVyXG4gKiBhIHJlbmRlciBhcyBhICoqc2lkZSBlZmZlY3QqKi4gWW91IGRlZmluZSBfd2hpY2hfIHJlbmRlcnMgdGhpc1xuICogc2lkZSBlZmZlY3QgdHJpZ2dlcnMgdmlhIHNlY29uZCBhcmd1bWVudCwgYSAqKkRlcHMqKiBhcnJheS5cbiAqL1xuZXhwb3J0IGNvbnN0IHVzZUVmZmVjdCA9IChlZmZlY3Q6IEVmZmVjdENvbnN0cnVjdG9yLCBkZXBzOiBEZXBzID0gW10pOiB2b2lkID0+IHtcbiAgcmV0dXJuIGhvb2tJbXBsZW1lbnRhdGlvbi51c2VFZmZlY3QoZWZmZWN0LCBkZXBzKTtcbn07XG5leHBvcnQgdHlwZSBFZmZlY3RDb25zdHJ1Y3RvciA9ICgpID0+IEVmZmVjdENsZWFudXA7XG5leHBvcnQgdHlwZSBFZmZlY3RDbGVhbnVwID0gdm9pZCB8ICgoKSA9PiB2b2lkKVxuXG4vKipcbiAqIFVzZSBDb250ZXh0XG4gKlxuICogUmV0cmlldmVzIHRoZSB2YWx1ZSB0aGF0IGEgKkNvbnRleHRQcm92aWRlciogbWF5IGhhdmUgc2V0XG4gKiBlYXJsaWVyIGluIHRoZSB0cmVlLCBvciBpZiB0aGVyZSBhcmUgbm9uZSBwcmVzZW50LFxuICogcmV0dXJucyB0aGUgY29udGV4dCdzIGRlZmF1bHQgdmFsdWUuXG4gKi9cbmV4cG9ydCBjb25zdCB1c2VDb250ZXh0ID0gPFQ+KGNvbnRleHQ6IENvbnRleHQ8VD4pOiBUID0+IHtcbiAgcmV0dXJuIGhvb2tJbXBsZW1lbnRhdGlvbi51c2VDb250ZXh0KGNvbnRleHQpO1xufTtcblxuZXhwb3J0IHR5cGUgUmVmPGluIG91dCBUPiA9IHtcbiAgY3VycmVudDogVDtcbn07XG5leHBvcnQgdHlwZSBSZWFkb25seVJlZjxvdXQgVD4gPSB7XG4gIHJlYWRvbmx5IGN1cnJlbnQ6IFQ7XG59O1xuXG5leHBvcnQgY29uc3QgcmVmU3ltYm9sID0gU3ltYm9sKCk7XG5leHBvcnQgY29uc3QgbWVtb1N5bWJvbCA9IFN5bWJvbCgpO1xuXG5leHBvcnQgY29uc3QgdXNlUmVmID0gPFQ+KGluaXRpYWxWYWx1ZTogVmFsdWVPckNhbGN1bGF0b3I8VD4pOiBSZWY8VD4gPT4ge1xuICBjb25zdCBbcmVmXSA9IHVzZVN0YXRlKCgpID0+ICh7IGN1cnJlbnQ6IGNhbGN1bGF0ZVZhbHVlKGluaXRpYWxWYWx1ZSksIFtyZWZTeW1ib2xdOiB0cnVlIH0pKTtcbiAgcmV0dXJuIHJlZjtcbn07XG5leHBvcnQgY29uc3QgdXNlTWVtbyA9IDxUPihjYWxjdWxhdGU6ICgpID0+IFQsIGRlcHM6IERlcHMpOiBUID0+IHtcbiAgY29uc3QgcHJldkRlcHMgPSB1c2VSZWYoZGVwcyk7XG4gIGNvbnN0IHZhbHVlUmVmID0gdXNlUmVmKGNhbGN1bGF0ZSk7XG5cbiAgaWYgKGNhbGN1bGF0ZURlcHNDaGFuZ2UocHJldkRlcHMuY3VycmVudCwgZGVwcykpIHtcbiAgICBwcmV2RGVwcy5jdXJyZW50ID0gZGVwcztcbiAgICB2YWx1ZVJlZi5jdXJyZW50ID0gY2FsY3VsYXRlKCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlUmVmLmN1cnJlbnQ7XG59O1xuIiwgImxldCBsYXRlc3RJZCA9IDA7XG5cbmRlY2xhcmUgY29uc3Qgb3BhcXVlVHlwZTogdW5pcXVlIHN5bWJvbDtcbmV4cG9ydCB0eXBlIE9wYXF1ZUlEPFQgZXh0ZW5kcyBzdHJpbmc+ID0gbnVtYmVyICYgeyByZWFkb25seSBbb3BhcXVlVHlwZV06IFQgfTtcblxuXG4vKipcbiAqIFByb2R1Y2VzIGEgKHJlbGF0aXZlbHkgd2l0aGluIHRoaXMgcnVudGltZSkgdW5pcXVlIGluY3JlbWVudGluZyB2YWx1ZS5cbiAqIFxuICogSWYgbmFtZXNwYWNlIGlzIHBhc3NlZCwgdGhlbiB0aGUgaW5jcmVtZW50aW5nIHZhbHVlIGlzIHVuaXF1ZSB0byB0aGVcbiAqIG5hbWVzcGFjZSAob3RoZXJ3aXNlIGlzIGdsb2JhbGx5IHNoYXJlZCB3aXRoIGFsbCBvdGhlciBpZHMpXG4gKiBcbiAqIFRoZSBcIk9wYXF1ZUlEXCIgdHlwZSBoZWxwcyBhdm9pZCBjcm9zcy1jb250YW1pbmF0aW9uIG9mIGRpZmZlcmVudCBJRCB0eXBlc1xuICogKGJlaW5nIGF1dG9tYXRpY2FsbHkgY2FzdCB0byBudW1iZXIgYW5kIHN1Y2gpIGF0IFR5cGUgdGltZSwgYnV0IHByb3ZpZGVzXG4gKiBubyBydW50aW1lIGNoZWNrcy5cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZUlkID0gPFQgZXh0ZW5kcyBzdHJpbmc+KG5hbWVzcGFjZT86IFQpOiBPcGFxdWVJRDxUPiA9PiB7XG4gIGlmIChuYW1lc3BhY2UpIHtcbiAgICBpZiAoIShuYW1lc3BhY2UgaW4gbmFtZXNwYWNlcykpXG4gICAgICBuYW1lc3BhY2VzW25hbWVzcGFjZV0gPSAwO1xuICAgXG4gICAgcmV0dXJuIG5hbWVzcGFjZXNbbmFtZXNwYWNlXSsrIGFzIE9wYXF1ZUlEPFQ+O1xuICB9XG4gIHJldHVybiBsYXRlc3RJZCsrIGFzIE9wYXF1ZUlEPFQ+O1xufTtcblxuY29uc3QgbmFtZXNwYWNlczogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuXG4oZ2xvYmFsVGhpcykuX19MVUtFS0FBTElNX0FDVF9HTE9CQUxfTkFNRVNQQUNFX0lEID0gbmFtZXNwYWNlcztcblxuZGVjbGFyZSBnbG9iYWwge1xuICB2YXIgX19MVUtFS0FBTElNX0FDVF9HTE9CQUxfTkFNRVNQQUNFX0lEOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+O1xufSIsICJpbXBvcnQgeyBDb21wb25lbnQsIEVtcHR5UHJvcHMgfSBmcm9tIFwiLi9jb21wb25lbnQudHNcIjtcbmltcG9ydCB7IGNyZWF0ZUlkLCBPcGFxdWVJRCB9IGZyb20gXCIuL2lkLnRzXCI7XG5pbXBvcnQgeyBQcm9wcyB9IGZyb20gXCIuL21vZC50c1wiO1xuaW1wb3J0IHsgTm9kZSB9IGZyb20gXCIuL25vZGUudHNcIjtcblxuLyoqXG4gKiBUaGlzIGlzIGEgdW5pcXVlIHZhbHVlIHRoYXQgaXMgZ2VuZXJhdGVkXG4gKiBldmVyeSB0aW1lIHlvdSBjYWxsIGNyZWF0ZUVsZW1lbnQgLSBpdFxuICogaXMgdXNlZCB0byBjb21wYXJlIHR3byBkaWZmZXJlbnQgZWxlbWVudHNcbiAqIGFuZCBxdWlja2x5IGRldGVybWluZSBpZiB0aGV5IGFyZSB0aGUgc2FtZS5cbiAqL1xuZXhwb3J0IHR5cGUgRWxlbWVudElEID0gT3BhcXVlSUQ8XCJFbGVtZW50SURcIj47XG5cbi8qKlxuICogVGhlIFwiRWxlbWVudFwiIGlzIHRoZSBmdW5kYW1lbnRhbCBidWlsZGluZ1xuICogYmxvY2sgb2YgYWN0IC0gQ29tcG9uZW50cyByZXR1cm4gYW4gRWxlbWVudFxuICogVHJlZSwgd2hpY2ggdGhlbiBldmVudHVhbGx5IGJlY29tZXMgYSB0cmVlXG4gKiBvZiBDb21taXRzLlxuICovXG5leHBvcnQgdHlwZSBFbGVtZW50ID0ge1xuICB0eXBlOiBFbGVtZW50VHlwZTtcbiAgaWQ6IEVsZW1lbnRJRDtcbiAgcHJvcHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICBjaGlsZHJlbjogTm9kZTtcbn07XG5cbmV4cG9ydCB0eXBlIEVsZW1lbnRUeXBlPFQgZXh0ZW5kcyBQcm9wcyA9IEVtcHR5UHJvcHM+ID0gbnVsbCB8IHN0cmluZyB8IHN5bWJvbCB8IENvbXBvbmVudDxUPjtcbmV4cG9ydCB0eXBlIEVsZW1lbnRLZXkgPSBzdHJpbmcgfCBudW1iZXIgfCBzeW1ib2w7XG5cbmNvbnN0IEVNUFRZX1BST1BTID0gT2JqZWN0LmZyZWV6ZSh7fSk7XG5cbi8qKlxuICogR2VuZXJhdGUgYSB1bmlxdWUgZWxlbWVudC4gRWFjaCBlbGVtZW50IGhhcyBhbiBpbnRlcm5hbFxuICogSUQgdG8gcXVpY2tseSB0ZWxsIGlmIGVsZW1lbnRzIGFyZSBkaWZmZXJlbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbGVtZW50PFR5cGUgZXh0ZW5kcyBFbGVtZW50VHlwZTxhbnk+PihcbiAgdHlwZTogVHlwZSxcbiAgcHJvcHM6IFR5cGUgZXh0ZW5kcyBFbGVtZW50VHlwZTxpbmZlciBYPiA/IFggJiB7IGtleT86IEVsZW1lbnRLZXkgfSA6IG5ldmVyLFxuICBjaGlsZHJlbj86IE5vZGVcbik6IEVsZW1lbnQ7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRWxlbWVudChcbiAgdHlwZTogc3RyaW5nIHwgc3ltYm9sLFxuICBwcm9wcz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+ICYgeyBrZXk/OiBFbGVtZW50S2V5IH0sXG4gIGNoaWxkcmVuPzogTm9kZVxuKTogRWxlbWVudDtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbGVtZW50PFR5cGUgZXh0ZW5kcyBDb21wb25lbnQ8RW1wdHlQcm9wcz4+KFxuICB0eXBlOiBUeXBlLFxuICBwcm9wcz86IHsga2V5PzogRWxlbWVudEtleSB9LFxuICBjaGlsZHJlbj86IE5vZGVcbik6IEVsZW1lbnQ7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRWxlbWVudChcbiAgdHlwZTogRWxlbWVudFR5cGUsXG4gIHByb3BzPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gJiB7IGtleT86IEVsZW1lbnRLZXkgfSxcbiAgY2hpbGRyZW46IE5vZGUgPSBbXVxuKTogRWxlbWVudCB7XG4gIHJldHVybiB7XG4gICAgaWQ6IGNyZWF0ZUlkKFwiRWxlbWVudElEXCIpLFxuICAgIHR5cGUsXG4gICAgcHJvcHM6IHByb3BzIHx8IEVNUFRZX1BST1BTLFxuICAgIGNoaWxkcmVuLFxuICB9IGFzIEVsZW1lbnQ7XG59XG5cbmV4cG9ydCBjb25zdCBoID0gY3JlYXRlRWxlbWVudDtcbiIsICJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi9jb21wb25lbnQudHNcIjtcbmltcG9ydCB7IGggfSBmcm9tIFwiLi9lbGVtZW50LnRzXCI7XG5pbXBvcnQgeyBNYWdpY0Vycm9yIH0gZnJvbSBcIi4vZXJyb3JzLnRzXCI7XG5pbXBvcnQgeyBPcGFxdWVJRCwgY3JlYXRlSWQgfSBmcm9tIFwiLi9pZC50c1wiO1xuXG5leHBvcnQgdHlwZSBDb250ZXh0SUQgPSBPcGFxdWVJRDxcIkNvbnRleHRJRFwiPjtcbmV4cG9ydCB0eXBlIENvbnRleHQ8VD4gPSB7XG4gIFByb3ZpZGVyOiBDb21wb25lbnQ8eyB2YWx1ZTogVCB9PixcbiAgZGVmYXVsdFZhbHVlOiBULFxuICBpZDogQ29udGV4dElELFxufVxuXG5leHBvcnQgY29uc3QgcHJvdmlkZXJOb2RlVHlwZSA9IFN5bWJvbChcInByb3ZpZGVyXCIpO1xuXG5leHBvcnQgY29uc3QgY3JlYXRlQ29udGV4dCA9IDxUPihkZWZhdWx0VmFsdWU6IFQpOiBDb250ZXh0PFQ+ID0+IHtcbiAgY29uc3QgaWQgPSBjcmVhdGVJZDwnQ29udGV4dElEJz4oXCJDb250ZXh0SURcIik7XG4gIHJldHVybiB7XG4gICAgUHJvdmlkZXIoeyB2YWx1ZSwgY2hpbGRyZW4gfSkge1xuICAgICAgcmV0dXJuIGgocHJvdmlkZXJOb2RlVHlwZSwgeyB2YWx1ZSwgaWQgfSwgY2hpbGRyZW4pO1xuICAgIH0sXG4gICAgZGVmYXVsdFZhbHVlLFxuICAgIGlkLFxuICB9XG59O1xuIiwgImltcG9ydCB7IEVsZW1lbnQgfSBmcm9tIFwiLi9lbGVtZW50LnRzXCI7XG5pbXBvcnQgeyBVbmtub3duRWxlbWVudFR5cGUgfSBmcm9tIFwiLi9lcnJvcnMudHNcIjtcbmltcG9ydCB7IGggfSBmcm9tIFwiLi9lbGVtZW50LnRzXCI7XG5cbmV4cG9ydCB0eXBlIE5vZGUgPVxuICB8IHN0cmluZ1xuICB8IG51bWJlclxuICB8IGJvb2xlYW5cbiAgfCBudWxsXG4gIHwgRWxlbWVudFxuICB8IE5vZGVbXVxuXG5leHBvcnQgY29uc3QgcHJpbWl0aXZlTm9kZVR5cGVzID0ge1xuICBzdHJpbmc6ICAgU3ltYm9sKFwic3RyaW5nLW5vZGVcIiksXG4gIG51bWJlcjogICBTeW1ib2woXCJudW1iZXItbm9kZVwiKSxcbiAgYm9vbGVhbjogIFN5bWJvbChcImJvb2xlYW4tbm9kZVwiKSxcbiAgbnVsbDogICAgIFN5bWJvbChcIm51bGwtbm9kZVwiKSxcbiAgYXJyYXk6ICAgIFN5bWJvbChcImFycmF5LW5vZGVcIiksXG59IGFzIGNvbnN0O1xuXG4vKipcbiAqIEFueSBub2RlIHRyZWUgcmVwcmVzZW50cyBvbmUgb3IgbW9yZSBlbGVtZW50c1xuICovXG5leHBvcnQgY29uc3QgY29udmVydE5vZGVUb0VsZW1lbnRzID0gKG5vZGU6IE5vZGUpOiBFbGVtZW50W10gPT4ge1xuICBjb25zdCBub2RlQXJyYXkgPSBBcnJheS5pc0FycmF5KG5vZGUpID8gbm9kZSA6IFtub2RlXTtcblxuICByZXR1cm4gbm9kZUFycmF5Lm1hcChjb252ZXJ0Tm9kZVRvRWxlbWVudCk7XG59XG5cbmV4cG9ydCBjb25zdCBjb252ZXJ0Tm9kZVRvRWxlbWVudCA9IChub2RlOiBOb2RlKTogRWxlbWVudCA9PiB7XG4gIHN3aXRjaCAodHlwZW9mIG5vZGUpIHtcbiAgICBjYXNlICdib29sZWFuJzpcbiAgICAgIHJldHVybiBoKHByaW1pdGl2ZU5vZGVUeXBlcy5ib29sZWFuLCB7IHZhbHVlOiBub2RlIH0pO1xuICAgIGNhc2UgJ251bWJlcic6XG4gICAgICByZXR1cm4gaChwcmltaXRpdmVOb2RlVHlwZXMubnVtYmVyLCB7IHZhbHVlOiBub2RlIH0pO1xuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICByZXR1cm4gaChwcmltaXRpdmVOb2RlVHlwZXMuc3RyaW5nLCB7IHZhbHVlOiBub2RlIH0pO1xuXG4gICAgY2FzZSAnb2JqZWN0JzogXG4gICAgICBpZiAobm9kZSA9PT0gbnVsbClcbiAgICAgICAgcmV0dXJuIGgocHJpbWl0aXZlTm9kZVR5cGVzLm51bGwpO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkobm9kZSkpXG4gICAgICAgIHJldHVybiBoKHByaW1pdGl2ZU5vZGVUeXBlcy5hcnJheSwge30sIG5vZGUpO1xuICAgICAgXG4gICAgICByZXR1cm4gbm9kZTtcbiAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5kZWZpbmVkIGlzIG5vdCBhIHZhbGlkIGFjdCBlbGVtZW50IWApO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgVW5rbm93bkVsZW1lbnRUeXBlKClcbiAgfVxufSIsICJpbXBvcnQgeyBDb21wb25lbnQsIEVsZW1lbnRUeXBlLCBSZWYgfSBmcm9tIFwiLi9tb2RcIjtcbmltcG9ydCB7IHByb3ZpZGVyTm9kZVR5cGUgfSBmcm9tICcuL2NvbnRleHQnO1xuaW1wb3J0IHsgTm9kZSB9IGZyb20gJy4vbm9kZSc7XG5cbmV4cG9ydCBjb25zdCBib3VuZGFyeU5vZGVUeXBlID0gU3ltYm9sKCdib3VuZGFyeScpO1xuZXhwb3J0IGNvbnN0IGZhbGxiYWNrTm9kZVR5cGUgPSBTeW1ib2woJ2ZhbGxiYWNrJyk7XG5leHBvcnQgY29uc3Qgc3VzcGVuZE5vZGVUeXBlID0gU3ltYm9sKCdzdXNwZW5kJyk7XG5leHBvcnQgY29uc3QgcmVuZGVyTm9kZVR5cGUgPSBTeW1ib2woJ3JlbmRlcicpO1xuZXhwb3J0IGNvbnN0IHBsYWNlaG9sZGVyTm9kZVR5cGUgPSBTeW1ib2woJ3BsYWNlaG9sZGVyJyk7XG5cbmV4cG9ydCB0eXBlIEJvdW5kYXJ5UHJvcHMgPSB7XG4gIGZhbGxiYWNrPzogTm9kZSxcblxuICBvblRocm93PzogKHZhbHVlOiB1bmtub3duLCBhbGxWYWx1ZXM6IHVua25vd25bXSkgPT4gdW5rbm93bixcbiAgb25DbGVhcj86ICgpID0+IHVua25vd24sXG5cbiAgcmVmPzogUmVmPG51bGwgfCB7IGNsZWFyOiAoKSA9PiB2b2lkIH0+XG59XG5leHBvcnQgdHlwZSBSZW5kZXJSb290UHJvcHMgPSB7XG4gIHR5cGU6IHN0cmluZyB8IHN5bWJvbCxcbn1cbmV4cG9ydCB0eXBlIFN1c3BlbmRQcm9wcyA9IHtcbiAgc3VzcGVuZGVkOiBib29sZWFuLFxufVxuXG5leHBvcnQgY29uc3QgQm91bmRhcnk6IENvbXBvbmVudDxCb3VuZGFyeVByb3BzPiA9IGJvdW5kYXJ5Tm9kZVR5cGUgYXMgYW55O1xuZXhwb3J0IGNvbnN0IFJlbmRlclJvb3Q6IENvbXBvbmVudDxSZW5kZXJSb290UHJvcHM+ID0gcmVuZGVyTm9kZVR5cGUgYXMgYW55O1xuZXhwb3J0IGNvbnN0IEZhbGxiYWNrOiBDb21wb25lbnQgPSBmYWxsYmFja05vZGVUeXBlIGFzIGFueTtcbmV4cG9ydCBjb25zdCBTdXNwZW5kOiBDb21wb25lbnQ8U3VzcGVuZFByb3BzPiA9IHN1c3BlbmROb2RlVHlwZSBhcyBhbnk7XG5cbmV4cG9ydCB0eXBlIFNwZWNpYWxOb2RlVHlwZSA9XG4gIHwgdHlwZW9mIGJvdW5kYXJ5Tm9kZVR5cGVcbiAgfCB0eXBlb2YgcmVuZGVyTm9kZVR5cGVcbiAgfCB0eXBlb2YgcHJvdmlkZXJOb2RlVHlwZVxuICB8IHR5cGVvZiBmYWxsYmFja05vZGVUeXBlXG4gIHwgdHlwZW9mIHN1c3BlbmROb2RlVHlwZVxuICB8IHR5cGVvZiBwbGFjZWhvbGRlck5vZGVUeXBlXG5cbmV4cG9ydCBjb25zdCBzcGVjaWFsTm9kZVR5cGVzID0ge1xuICBib3VuZGFyeTogYm91bmRhcnlOb2RlVHlwZSxcbiAgcmVuZGVyOiByZW5kZXJOb2RlVHlwZSxcbiAgcHJvdmlkZXI6IHByb3ZpZGVyTm9kZVR5cGUsXG4gIGZhbGxiYWNrOiBmYWxsYmFja05vZGVUeXBlLFxuICBzdXNwZW5kOiBzdXNwZW5kTm9kZVR5cGUsXG4gIHBsYWNlaG9sZGVyOiBwbGFjZWhvbGRlck5vZGVUeXBlLFxufSIsICJleHBvcnQgKiBmcm9tICcuL2NvbXBvbmVudC50cyc7XG5leHBvcnQgKiBmcm9tICcuL2hvb2tzLnRzJztcbmV4cG9ydCAqIGZyb20gJy4vY29udGV4dC50cyc7XG5leHBvcnQgKiBmcm9tICcuL2Vycm9ycy50cyc7XG5cbmV4cG9ydCAqIGZyb20gJy4vZWxlbWVudC50cyc7XG5leHBvcnQgKiBmcm9tICcuL25vZGUudHMnO1xuZXhwb3J0ICogZnJvbSAnLi9pZC50cyc7XG5leHBvcnQgKiBmcm9tICcuL3NwZWNpYWwudHMnO1xuXG5kZWNsYXJlIGdsb2JhbCB7XG4gIHZhciBfX0xVS0VLQUFMSU1fQUNUX0dMT0JBTF9DSEVDSzogbnVtYmVyO1xufVxuXG5pZiAoZ2xvYmFsVGhpc1snX19MVUtFS0FBTElNX0FDVF9HTE9CQUxfQ0hFQ0snXSkge1xuICBjb25zb2xlLndhcm4oYFRoZXJlIGFyZSBtdWx0aXBsZSAoYXQgbGVhc3QgJHtnbG9iYWxUaGlzLl9fTFVLRUtBQUxJTV9BQ1RfR0xPQkFMX0NIRUNLfSkgY29waWVzIG9mIEFjdCBydW5uaW5nIWApXG4gIGdsb2JhbFRoaXMuX19MVUtFS0FBTElNX0FDVF9HTE9CQUxfQ0hFQ0srKztcbn0gZWxzZSB7XG4gIGdsb2JhbFRoaXMuX19MVUtFS0FBTElNX0FDVF9HTE9CQUxfQ0hFQ0sgPSAxO1xufVxuIiwgImltcG9ydCAqIGFzIGFjdCBmcm9tICdAbHVrZWthYWxpbS9hY3QnO1xuXG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBXaW5kb3cge1xuICAgIEhUTUxFbGVtZW50OiB0eXBlb2YgSFRNTEVsZW1lbnQsXG4gICAgU1ZHRWxlbWVudDogdHlwZW9mIFNWR0VsZW1lbnQsXG4gICAgVGV4dDogdHlwZW9mIFRleHQsXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHNldFByb3BzID0gKFxuICB3aW5kb3c6IFdpbmRvdyxcbiAgbm9kZTogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50IHwgVGV4dCxcbiAgXG4gIG5leHQ6IGFjdC5FbGVtZW50LFxuICBwcmV2OiBudWxsIHwgYWN0LkVsZW1lbnRcbikgPT4ge1xuICBpZiAobm9kZSBpbnN0YW5jZW9mIHdpbmRvdy5IVE1MRWxlbWVudCkge1xuICAgIHNldEhUTUxFbGVtZW50UHJvcHMobm9kZSwgbmV4dCwgcHJldik7XG4gIH1cbiAgaWYgKG5vZGUgaW5zdGFuY2VvZiB3aW5kb3cuU1ZHRWxlbWVudCkge1xuICAgIHNldFNWR0VsZW1lbnRQcm9wcyhub2RlLCBuZXh0LCBwcmV2KTtcbiAgfVxuICBpZiAobm9kZSBpbnN0YW5jZW9mIHdpbmRvdy5UZXh0KSB7XG4gICAgaWYgKG5vZGUudGV4dENvbnRlbnQgIT09IG5leHQucHJvcHMudmFsdWUpXG4gICAgICBub2RlLnRleHRDb250ZW50ID0gbmV4dC5wcm9wcy52YWx1ZSBhcyBzdHJpbmdcbiAgfVxufVxuXG5leHBvcnQgY29uc3Qgc2V0U1ZHRWxlbWVudFByb3BzID0gKFxuICBub2RlOiBTVkdFbGVtZW50LFxuICBcbiAgbmV4dDogYWN0LkVsZW1lbnQsXG4gIHByZXY6IG51bGwgfCBhY3QuRWxlbWVudFxuKSA9PiB7XG4gIHNldFByb3BPYmplY3Qobm9kZSBhcyBhbnksIG5leHQucHJvcHMsIHByZXYgJiYgcHJldi5wcm9wcywgKG5hbWUsIG5leHQsIHByZXYpID0+IHtcbiAgICBpZiAobmFtZS5zdGFydHNXaXRoKCdvbicpKSB7XG4gICAgICBjb25zdCBldmVudE5hbWUgPSBuYW1lLnNsaWNlKDIpLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICBzZXRFdmVudFByb3Aobm9kZSBhcyBhbnksIGV2ZW50TmFtZSwgbmV4dCwgcHJldik7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICBjYXNlICdyZWYnOlxuICAgICAgICAobmV4dCBhcyBhbnkpLmN1cnJlbnQgPSBub2RlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGNhc2UgJ3N0eWxlJzpcbiAgICAgICAgcmV0dXJuIChzZXRTdHlsZVByb3Aobm9kZS5zdHlsZSwgbmV4dCBhcyBhbnksIHByZXYgYXMgYW55KSwgdHJ1ZSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShuYW1lLCBuZXh0IGFzIGFueSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gIH0pO1xufVxuXG5leHBvcnQgY29uc3Qgc2V0SFRNTEVsZW1lbnRQcm9wcyA9IChcbiAgbm9kZTogSFRNTEVsZW1lbnQsXG4gIFxuICBuZXh0OiBhY3QuRWxlbWVudCxcbiAgcHJldjogbnVsbCB8IGFjdC5FbGVtZW50XG4pID0+IHtcbiAgc2V0UHJvcE9iamVjdChub2RlIGFzIGFueSwgbmV4dC5wcm9wcywgcHJldiAmJiBwcmV2LnByb3BzLCAobmFtZSwgbmV4dCwgcHJldikgPT4ge1xuICAgIGlmIChuYW1lLnN0YXJ0c1dpdGgoJ29uJykpIHtcbiAgICAgIGNvbnN0IGV2ZW50TmFtZSA9IG5hbWUuc2xpY2UoMikudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICAgIHNldEV2ZW50UHJvcChub2RlIGFzIGFueSwgZXZlbnROYW1lLCBuZXh0LCBwcmV2KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAobmFtZS5zdGFydHNXaXRoKCdkYXRhLScpKSB7XG4gICAgICBpZiAobmV4dCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAgIGVsc2VcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUobmFtZSwgbmV4dCBhcyBzdHJpbmcpO1xuICAgIH1cbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgJ3JlZic6XG4gICAgICAgIChuZXh0IGFzIGFueSkuY3VycmVudCA9IG5vZGU7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgY2FzZSAnc3R5bGUnOlxuICAgICAgICByZXR1cm4gKHNldFN0eWxlUHJvcChub2RlLnN0eWxlLCBuZXh0IGFzIGFueSwgcHJldiBhcyBhbnkpLCB0cnVlKTtcbiAgICAgIGNhc2UgJ2NsYXNzTmFtZSc6XG4gICAgICAgIG5vZGUuY2xhc3NOYW1lID0gbmV4dCBhcyBzdHJpbmc7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgY2FzZSAnY2xhc3NMaXN0JzpcbiAgICAgICAgY29uc3QgY2xhc3NOYW1lcyA9IChuZXh0IGFzIHN0cmluZ1tdKS5maWx0ZXIoQm9vbGVhbikuam9pbignICcpO1xuICAgICAgICBub2RlLmNsYXNzTmFtZSA9IGNsYXNzTmFtZXM7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSlcbn1cblxuZXhwb3J0IGNvbnN0IHNldEV2ZW50UHJvcCA9IChcbiAgbm9kZTogRXZlbnRTb3VyY2UsXG4gIHR5cGU6IHN0cmluZyxcbiAgbmV4dDogdW5rbm93bixcbiAgcHJldjogdW5rbm93bixcbikgPT4ge1xuICBpZiAocHJldiA9PT0gbmV4dClcbiAgICByZXR1cm47XG4gIGlmIChwcmV2KSB7XG4gICAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIHByZXYgYXMgYW55KVxuICB9XG4gIGlmIChuZXh0KSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKHR5cGUsIG5leHQgYXMgYW55KVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBzZXRTdHlsZVByb3AgPSAoXG4gIG5vZGU6IENTU1N0eWxlRGVjbGFyYXRpb24sXG4gIHN0eWxlOiBudWxsIHwgUmVjb3JkPGtleW9mIENTU1N0eWxlRGVjbGFyYXRpb24sIHN0cmluZyB8IG51bWJlcj4sXG4gIHByZXZTdHlsZTogbnVsbCB8IFJlY29yZDxrZXlvZiBDU1NTdHlsZURlY2xhcmF0aW9uLCBzdHJpbmcgfCBudW1iZXI+LFxuKSA9PiB7XG4gIHNldFByb3BPYmplY3Qobm9kZSBhcyBhbnksIHN0eWxlLCBwcmV2U3R5bGUsIChuYW1lLCB2YWx1ZSkgPT5cbiAgICAobm9kZS5zZXRQcm9wZXJ0eShuYW1lLCB2YWx1ZSBhcyBzdHJpbmcpLCB0cnVlKSlcbn1cblxuY29uc3Qgc2V0UHJvcE9iamVjdCA9IChcbiAgdGFyZ2V0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgbmV4dDogbnVsbCB8IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICBwcmV2OiBudWxsIHwgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gIGFzc2lnbjogbnVsbCB8ICgobmFtZTogc3RyaW5nLCBuZXh0OiB1bmtub3duLCBwcmV2OiB1bmtub3duKSA9PiBib29sZWFuKSA9IG51bGwsIFxuKSA9PiB7XG4gIGNvbnN0IG5hbWVzID0gbmV3IFNldChbXG4gICAgLi4uT2JqZWN0LmtleXMobmV4dCB8fCB7fSksXG4gICAgLi4uT2JqZWN0LmtleXMocHJldiB8fCB7fSlcbiAgXSk7XG5cbiAgZm9yIChjb25zdCBuYW1lIG9mIG5hbWVzKSB7XG4gICAgY29uc3QgbmV4dFZhbHVlID0gKG5leHQgfHwge30pW25hbWVdO1xuICAgIGNvbnN0IHN1Y2Nlc3NmdWxBc3NpZ24gPSBhc3NpZ24gJiYgYXNzaWduKG5hbWUsIG5leHRWYWx1ZSwgKHByZXYgfHwge30pW25hbWVdKTtcbiAgICBpZiAoIXN1Y2Nlc3NmdWxBc3NpZ24pIHtcbiAgICAgIGlmICh0YXJnZXRbbmFtZV0gIT09IG5leHRWYWx1ZSkge1xuICAgICAgICB0YXJnZXRbbmFtZV0gPSBuZXh0VmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG59IiwgImltcG9ydCAqIGFzIGFjdCBmcm9tICdAbHVrZWthYWxpbS9hY3QnO1xuXG5pbXBvcnQgeyBzZXRQcm9wcyB9IGZyb20gJy4vcHJvcHMudHMnO1xuaW1wb3J0IHsgTm9kZUJ1aWxkZXIgfSBmcm9tICdAbHVrZWthYWxpbS9hY3QtYmFja3N0YWdlJztcblxuZXhwb3J0IGNvbnN0IEhUTUw6IGFjdC5Db21wb25lbnQgPSAoeyBjaGlsZHJlbiB9KSA9PiBhY3QuaChhY3QucmVuZGVyTm9kZVR5cGUsIHsgdHlwZTogJ3dlYjpodG1sJyB9LCBjaGlsZHJlbik7XG5leHBvcnQgY29uc3QgU1ZHOiBhY3QuQ29tcG9uZW50ID0gKHsgY2hpbGRyZW4gfSkgPT4gYWN0LmgoYWN0LnJlbmRlck5vZGVUeXBlLCB7IHR5cGU6ICd3ZWI6c3ZnJyB9LCBjaGlsZHJlbik7XG5cbmNvbnN0IGRlZmF1bHRXaW5kb3cgPSAoZ2xvYmFsVGhpcy53aW5kb3cpO1xuXG5leHBvcnQgY29uc3QgY3JlYXRlV2ViTm9kZUJ1aWxkZXIgPSAoXG4gIHJvb3Q6IEhUTUxFbGVtZW50LFxuICB3aW5kb3c6IFdpbmRvdyA9IGRlZmF1bHRXaW5kb3dcbik6IE5vZGVCdWlsZGVyPEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudCB8IFRleHQsICd3ZWI6aHRtbCcgfCAnd2ViOnN2Zyc+ID0+ICh7XG4gIHJvb3RzOiBuZXcgU2V0KFsnd2ViOmh0bWwnLCAnd2ViOnN2ZyddIGFzIGNvbnN0KSxcblxuICBjcmVhdGUoZWxlbWVudCwgcm9vdFR5cGUpIHtcbiAgICBjb25zdCB0YWcgPSBlbGVtZW50LnR5cGU7XG4gICAgXG4gICAgc3dpdGNoICh0eXBlb2YgdGFnKSB7XG4gICAgICBjYXNlICdzeW1ib2wnOiB7XG4gICAgICAgIHN3aXRjaCAodGFnKSB7XG4gICAgICAgICAgY2FzZSBhY3QucHJpbWl0aXZlTm9kZVR5cGVzLnN0cmluZzpcbiAgICAgICAgICBjYXNlIGFjdC5wcmltaXRpdmVOb2RlVHlwZXMubnVtYmVyOlxuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5kb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIjxlbXB0eSB0ZXh0PlwiKTtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNhc2UgJ3N0cmluZyc6IHtcbiAgICAgICAgc3dpdGNoIChyb290VHlwZSkge1xuICAgICAgICAgIGNhc2UgJ3dlYjpodG1sJzpcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sJywgdGFnKTtcbiAgICAgICAgICBjYXNlICd3ZWI6c3ZnJzpcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIHRhZyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSxcbiAgdXBkYXRlKGVsLCBuZXh0LCBwcmV2KSB7XG4gICAgc2V0UHJvcHMod2luZG93LCBlbCwgbmV4dCwgcHJldik7XG4gIH0sXG4gIGxpbmsoZWwsIHBhcmVudCkge1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZChlbCk7XG4gIH0sXG4gIGxpbmtSb290KGNoaWxkKSB7XG4gICAgcm9vdC5hcHBlbmRDaGlsZChjaGlsZCk7XG4gIH0sXG4gIHVubGluayhlbCwgcGFyZW50KSB7XG4gICAgaWYgKGVsLnBhcmVudE5vZGUgPT09IHBhcmVudClcbiAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChlbCk7XG4gIH0sXG4gIGRlc3Ryb3koZWwpIHtcbiAgICBpZiAoZWwucGFyZW50Tm9kZSlcbiAgICAgIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpXG4gIH0sXG4gIHN1c3BlbmQoZWwsIHBhcmVudCkge1xuICAgIGlmIChlbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KVxuICAgICAgZWwuc3R5bGUub3BhY2l0eSA9IDAuNS50b1N0cmluZygpO1xuICB9LFxuICB1bnN1c3BlbmQoZWwsIHBhcmVudCkge1xuICAgIGlmIChlbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KVxuICAgICAgZWwuc3R5bGUub3BhY2l0eSA9ICgxKS50b1N0cmluZygpO1xuICB9LFxuICBzb3J0KGVsLCBuZXdDaGlsZHJlbikge1xuICAgIGlmIChlbCBpbnN0YW5jZW9mIFRleHQpXG4gICAgICByZXR1cm47XG5cbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGVsLmNoaWxkTm9kZXMpXG4gICAgICBpZiAoIW5ld0NoaWxkcmVuLmluY2x1ZGVzKGNoaWxkIGFzIEhUTUxFbGVtZW50KSlcblxuICAgIGlmIChuZXdDaGlsZHJlbi5sZW5ndGggPCAyKVxuICAgICAgcmV0dXJuO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZXdDaGlsZHJlbi5sZW5ndGg7IGkrKylcbiAgICAgIGlmIChlbC5jaGlsZHJlbltpXSAhPT0gbmV3Q2hpbGRyZW5baV0pXG4gICAgICAgIGVsLmluc2VydEJlZm9yZShuZXdDaGlsZHJlbltpXSwgZWwuY2hpbGRyZW5baV0pXG4gIH0sXG59KSIsICJpbXBvcnQgKiBhcyBhY3QgZnJvbSAnQGx1a2VrYWFsaW0vYWN0JztcbmltcG9ydCB7IEhUTUxUYWdOYW1lIH0gZnJvbSBcIi4vdGFnc1wiO1xuXG50eXBlIEV2ZW50TWFwID0ge1xuICBvbkNsaWNrOiBcImNsaWNrXCIsXG5cbiAgb25Nb3VzZUVudGVyOiBcIm1vdXNlZW50ZXJcIixcbiAgb25Nb3VzZU1vdmU6IFwibW91c2Vtb3ZlXCIsXG4gIG9uTW91c2VMZWF2ZTogXCJtb3VzZWxlYXZlXCIsXG5cbiAgb25Qb2ludGVyRW50ZXI6IFwicG9pbnRlcmVudGVyXCIsXG4gIG9uUG9pbnRlck1vdmU6IFwicG9pbnRlcm1vdmVcIixcbiAgb25Qb2ludGVyTGVhdmU6IFwicG9pbnRlcmxlYXZlXCIsXG5cbiAgb25LZXlEb3duOiBcImtleWRvd25cIixcbiAgb25LZXlVcDogXCJrZXl1cFwiLFxuXG4gIG9uRm9jdXM6IFwiZm9jdXNcIixcbiAgb25CbHVyOiAnYmx1cicsXG5cbiAgb25JbnB1dDogXCJpbnB1dFwiLFxuICBvbkNoYW5nZTogXCJjaGFuZ2VcIixcbn1cblxudHlwZSBFbGVtZW50TWFwID0ge1xuICBcImJ1dHRvblwiOiBIVE1MQnV0dG9uRWxlbWVudCxcbiAgXCJkaXZcIjogSFRNTERpdkVsZW1lbnQsXG4gIFwiZm9ybVwiOiBIVE1MRm9ybUVsZW1lbnQsXG4gIFwiaW5wdXRcIjogSFRNTElucHV0RWxlbWVudCxcbiAgXCJwcmVcIjogSFRNTFByZUVsZW1lbnQsXG4gIFwiY2FudmFzXCI6IEhUTUxDYW52YXNFbGVtZW50LFxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlU3BpZGVyRWxlbWVudCA9IDxUeXBlIGV4dGVuZHMgSFRNTFRhZ05hbWU+KFxuICB0eXBlOiBUeXBlLFxuICBwcm9wcz86IHtcbiAgICByZWY/OiBhY3QuUmVmPG51bGwgfCBIVE1MRWxlbWVudD4sXG4gICAga2V5Pzogc3RyaW5nIHwgbnVtYmVyLFxuICAgIHN0eWxlPzogeyBba2V5IGluIGtleW9mIENTU1N0eWxlRGVjbGFyYXRpb25dPzogbnVtYmVyIHwgc3RyaW5nIH0sXG4gICAgY2xhc3NMaXN0PzogcmVhZG9ubHkgKHN0cmluZyB8IGJvb2xlYW4gfCBudWxsIHwgdm9pZClbXSxcbiAgICBjbGFzc05hbWU/OiBzdHJpbmcsXG4gIH1cbiAgICAmIFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4gICAgJiB7XG4gICAgICAvL1trZXkgaW4ga2V5b2YgSFRNTEVsZW1lbnRdPzogSFRNTEVsZW1lbnRba2V5XSBleHRlbmRzIEZ1bmN0aW9uID8gbmV2ZXIgOiBIVE1MRWxlbWVudFtrZXldXG4gICAgfVxuICAgICYge1xuICAgICAgW2tleSBpbiBrZXlvZiBFdmVudE1hcF0/OiAodGhpczogSFRNTEVsZW1lbnQsIGV2OiBIVE1MRWxlbWVudEV2ZW50TWFwW0V2ZW50TWFwW2tleV1dKSA9PiB1bmtub3duXG4gICAgfSxcbiAgY2hpbGRyZW4/OiBhY3QuTm9kZSxcbik6IGFjdC5FbGVtZW50ID0+IHtcbiAgcmV0dXJuIGFjdC5jcmVhdGVFbGVtZW50KHR5cGUsIHByb3BzLCBjaGlsZHJlbilcbn07XG5cbmV4cG9ydCBjb25zdCBocyA9IGNyZWF0ZVNwaWRlckVsZW1lbnQ7XG4iLCAiaW1wb3J0IHsgcHJpbWl0aXZlTm9kZVR5cGVzLCBzcGVjaWFsTm9kZVR5cGVzLCBTdXNwZW5kUHJvcHMgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5pbXBvcnQgeyBDb21taXQyLCBDb21taXRJRCwgQ29tbWl0UmVmMiwgQ29tbWl0VHJlZTIsIERlbHRhLCBSZWNvbmNpbGVyRXZlbnRCdXMgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0LXJlY29uXCJcbmltcG9ydCB7IE5vZGVCdWlsZGVyIH0gZnJvbSBcIi4vYnVpbGRlclwiO1xuXG50eXBlIFBhcmVudFNlYXJjaFJlc3VsdDxUTm9kZT4gPSB7XG4gIC8qKlxuICAgKiBZb3UgbWlnaHQgbm90IGhhdmUgYSBwYXJlbnQgLSBub1xuICAgKiBjb21taXQgbWVhbnMgdGhlcmUgYXJlIG5vIE5vZGVzIGFib3ZlIHlvdSAtIGp1c3QgUm9vdC5cbiAgICovXG4gIGNvbW1pdDogQ29tbWl0MiB8IG51bGwsXG4gIC8qKlxuICAgKiBZb3VyIHBhcmVudCBtaWdodCBiZSBhIHZhbGlkIG5vZGUsXG4gICAqIG9yIGl0IG1pZ2h0IGJlIFwibnVsbFwiXG4gICAqL1xuICBub2RlOiBUTm9kZSB8IG51bGwsXG5cbiAgYXR0YWNoYWJsZTogYm9vbGVhbixcbn1cblxuLyoqXG4gKiBUaGUgUmVuZGVyU3BhY2UgY2xhc3NcbiAqL1xuZXhwb3J0IGNsYXNzIFJlbmRlclNwYWNlMjxUTm9kZSwgVFJvb3QgZXh0ZW5kcyBzdHJpbmcgfCBzeW1ib2w+IHtcbiAgLyoqIFRoZSBDb21taXRUcmVlIHRoaXMgcmVuZGVyIHNwYWNlIGlzIGNvbm5lY3RlZCB0byAqL1xuICB0cmVlOiBDb21taXRUcmVlMjtcblxuICAvKiogQSByZXZlcnNlIG1hcCB0byBsb29rIHVwIENvbW1pdHMgZ2l2ZW4ganVzdCB0aGUgbm9kZSB0aGV5IHJlcHJlc2VudCAqL1xuICBub2RlQnlDb21taXQ6IE1hcDxDb21taXRJRCwgVE5vZGU+ID0gbmV3IE1hcCgpO1xuICAvKiogQSByZXZlcnNlIG1hcCB0byBsb29rIHVwIENvbW1pdHMgZ2l2ZW4ganVzdCB0aGUgbm9kZSB0aGV5IHJlcHJlc2VudCAqL1xuICBjb21taXRCeU5vZGU6IE1hcDxUTm9kZSwgQ29tbWl0Mj4gPSBuZXcgTWFwKCk7XG5cbiAgLyoqIEZvciBhIGdpdmVuIENvbW1pdElELCBmaW5kIGl0J3MgY2xvc2VzdCBcInJlYWxcIiBwYXJlbnQgKGEgYW5jZXN0b3Igd2l0aCBhIG5vbi1udWxsIFROb2RlKSAqL1xuICBwYXJlbnRCeU5vZGU6IE1hcDxDb21taXRJRCwgQ29tbWl0Mj4gPSBuZXcgTWFwKCk7XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIGFsbCBzcGVjaWFsIFJvb3QgZWxlbWVudCBJRHMgaW4gdGhlIHRyZWUuXG4gICAqIEEgUm9vdCBlbGVtZW50IGhlbHBzIHRlbGwgYSByZW5kZXJlciB3aGF0IGtpbmQgb2YgZWxlbWVudFxuICAgKiB0byByZW5kZXIsIGJhc2VkIG9uIGl0J3MgY2xvc2VzdCBSb290LlxuICAgKi9cbiAgcm9vdHM6IE1hcDxDb21taXRJRCwgQ29tbWl0Mj4gPSBuZXcgTWFwKCk7XG4gIGJ1czogUmVjb25jaWxlckV2ZW50QnVzO1xuICBidWlsZGVyOiBOb2RlQnVpbGRlcjxUTm9kZSwgVFJvb3Q+O1xuXG4gIGNvbnN0cnVjdG9yKHRyZWU6IENvbW1pdFRyZWUyLCBidWlsZGVyOiBOb2RlQnVpbGRlcjxUTm9kZSwgVFJvb3Q+KSB7XG4gICAgdGhpcy50cmVlID0gdHJlZTtcbiAgICB0aGlzLmJ1cyA9IHtcbiAgICAgIHJlbmRlcjogKGRlbHRhKSA9PiB7XG4gICAgICAgIHRoaXMuY3JlYXRlKGRlbHRhKTtcbiAgICAgICAgdGhpcy51cGRhdGUoZGVsdGEpO1xuICAgICAgfSxcbiAgICB9XG4gICAgdGhpcy5idWlsZGVyID0gYnVpbGRlcjtcbiAgfVxuXG4gIGZpbmRDaGlsZHJlbihpZDogQ29tbWl0SUQsIGlnbm9yZUZpcnN0ID0gZmFsc2UsIGlnbm9yZVN1c3BlbmRlZCA9IHRydWUpOiBUTm9kZVtdIHtcbiAgICBjb25zdCBub2RlID0gdGhpcy5ub2RlQnlDb21taXQuZ2V0KGlkKTtcbiAgICBpZiAobm9kZSAmJiAhaWdub3JlRmlyc3QpXG4gICAgICByZXR1cm4gW25vZGVdO1xuXG4gICAgY29uc3QgY29tbWl0ID0gdGhpcy50cmVlLmNvbW1pdHMuZ2V0KGlkKTtcbiAgICBpZiAoIWNvbW1pdClcbiAgICAgIHJldHVybiBbXTtcbiAgICBpZiAoY29tbWl0LmVsZW1lbnQudHlwZSA9PT0gcHJpbWl0aXZlTm9kZVR5cGVzLm51bGwpXG4gICAgICByZXR1cm4gW107XG4gICAgLy8gc3VzcGVuZGVkIG5vZGVzIGRvbid0IGNvdW50IGFzIGNoaWxkcmVuXG4gICAgaWYgKGlnbm9yZVN1c3BlbmRlZCAmJiBjb21taXQuaXNTdXNwZW5kZWQoKSlcbiAgICAgIHJldHVybiBbXTtcblxuICAgIHJldHVybiBjb21taXQuY2hpbGRyZW4ubWFwKGMgPT4gdGhpcy5maW5kQ2hpbGRyZW4oYy5pZCkpLmZsYXQoMSk7XG4gIH1cblxuICAvKipcbiAgICogXCJmaW5kIHBhcmVudFwiIGNhbiByZXR1cm4gMyB0eXBlcyBvZiByZXN1bHRzOlxuICAgKiAgLSBBbiBhbmNlc3RvciBoYXMgYSBub2RlISB3ZSByZXR1cm4gdGhhdC5cbiAgICogIC0gQW4gYW5jZXN0b3IgaXMgYSBcIm51bGxcIiBub2RlIC0gd2UgcmV0dXJuIHRoZSBzcGVjaWFsIGZvcm0gb2YgXCJjb21taXQgYnV0IG5vIG5vZGVcIlxuICAgKiAgLSBObyBhbmNlc3RvciBoYXMgYSBub2RlIC0geW91IG1pZ2h0IGJlIG5lYXIgdGhlIHJvb3RcbiAgICogQHBhcmFtIHJlZiBcbiAgICogQHJldHVybnMgXG4gICAqL1xuICBmaW5kUGFyZW50KHJlZjogQ29tbWl0UmVmMik6IFBhcmVudFNlYXJjaFJlc3VsdDxUTm9kZT4ge1xuICAgIGxldCBhbmNlc3RvcjogQ29tbWl0UmVmMiB8IG51bGwgPSByZWY7XG4gICAgbGV0IGF0dGFjaGFibGUgPSB0cnVlO1xuXG4gICAgd2hpbGUgKGFuY2VzdG9yKSB7XG4gICAgICBpZiAoYW5jZXN0b3IuaWQgIT09IHJlZi5pZCkge1xuICAgICAgICBjb25zdCBjb21taXQgPSB0aGlzLnRyZWUuY29tbWl0cy5nZXQoYW5jZXN0b3IuaWQpIHx8IG51bGw7XG5cbiAgICAgICAgLy8gRWFybHkgZXhpdCBvdXQgb2YgcGFyZW50IGxvb2t1cCBpZiBzb21lb25lIG9uIHRoZSBwYXRoIGlzIG51bGw7XG4gICAgICAgIGlmIChjb21taXQgJiYgY29tbWl0LmVsZW1lbnQudHlwZSA9PT0gcHJpbWl0aXZlTm9kZVR5cGVzLm51bGwpXG4gICAgICAgICAgcmV0dXJuIHsgY29tbWl0LCBub2RlOiBudWxsLCBhdHRhY2hhYmxlOiBmYWxzZSB9O1xuXG4gICAgICAgIC8vIG1heWJlIGEgYmFkIGlkZWEuLi4gd2UnbGwgc2VlXG4gICAgICAgIGlmIChjb21taXQgJiYgY29tbWl0LmlzU3VzcGVuZGVkKCkpXG4gICAgICAgICAgYXR0YWNoYWJsZSA9IGZhbHNlO1xuXG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5vZGVCeUNvbW1pdC5nZXQoYW5jZXN0b3IuaWQpO1xuICAgICAgICAvLyBJZiB5b3UgZmluZCBhbiBlbGVtZW50IHdpdGggYSBub2RlXG4gICAgICAgIGlmIChub2RlKVxuICAgICAgICAgIHJldHVybiB7IGNvbW1pdCwgbm9kZSwgYXR0YWNoYWJsZSB9XG4gICAgICB9XG4gICAgICBhbmNlc3RvciA9IGFuY2VzdG9yLnBhcmVudDtcbiAgICB9XG5cbiAgICAvLyB0aGlzIGVsZW1lbnQgaGFzIG5vIFwibm9kZVwiIHBhcmVudHMgLSBpdCBpcyBwcm9iYWJseSBhIFwicm9vdFwiIGNvbW1pdFxuICAgIHJldHVybiB7IGNvbW1pdDogbnVsbCwgbm9kZTogbnVsbCwgYXR0YWNoYWJsZSB9O1xuICB9XG5cbiAgZmluZFJvb3QocmVmOiBDb21taXRSZWYyKSB7XG4gICAgbGV0IGFuY2VzdG9yOiBDb21taXRSZWYyIHwgbnVsbCA9IHJlZjtcblxuICAgIHdoaWxlIChhbmNlc3Rvcikge1xuICAgICAgY29uc3Qgcm9vdCA9IHRoaXMucm9vdHMuZ2V0KGFuY2VzdG9yLmlkKTtcbiAgICAgIGlmIChyb290KVxuICAgICAgICByZXR1cm4gcm9vdDtcbiAgICAgIGFuY2VzdG9yID0gYW5jZXN0b3IucGFyZW50O1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgbmV3Tm9kZXM6IFNldDxbQ29tbWl0MiwgVE5vZGVdPiA9IG5ldyBTZXQoKTtcbiAgbmVlZHNSZW9yZGVyOiBTZXQ8Q29tbWl0SUQ+ID0gbmV3IFNldCgpO1xuXG4gIGNyZWF0ZShkZWx0YXM6IERlbHRhKSB7XG4gICAgdGhpcy5uZXdOb2Rlcy5jbGVhcigpO1xuICAgIHRoaXMubmVlZHNSZW9yZGVyLmNsZWFyKCk7XG5cbiAgICBmb3IgKGNvbnN0IG5leHQgb2YgZGVsdGFzLmZyZXNoLnZhbHVlcygpKSB7XG4gICAgICBpZiAobmV4dC5lbGVtZW50LnR5cGUgPT09IHNwZWNpYWxOb2RlVHlwZXMucmVuZGVyKSB7XG4gICAgICAgIC8vIGFkZCByZW5kZXIgYm91bmRhcnlcbiAgICAgICAgdGhpcy5yb290cy5zZXQobmV4dC5yZWYuaWQsIG5leHQpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJvb3QgPSB0aGlzLmZpbmRSb290KG5leHQucmVmKTtcbiAgICAgIGlmICghcm9vdClcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGNvbnN0IHJvb3RUeXBlID0gcm9vdC5lbGVtZW50LnByb3BzWyd0eXBlJ10gYXMgVFJvb3Q7XG5cbiAgICAgIC8vIHRlc3QgdG8gc2VlIGlmIHRoaXMgZWxlbWVudFxuICAgICAgLy8gYmVsb25ncyB0byB0aGlzIFxuICAgICAgaWYgKHRoaXMuYnVpbGRlci5yb290cy5oYXMocm9vdFR5cGUpICkge1xuICAgICAgICAvLyBUcnkgdG8gY3JlYXRlIGEgPFQ+IGZvciBldmVyeSBuZXcgY29tbWl0XG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLmJ1aWxkZXIuY3JlYXRlKG5leHQuZWxlbWVudCwgcm9vdFR5cGUsIG5leHQucmVmKTtcbiAgICAgICAgLy8gTm90IGFsbCBjb21taXRzIGhhdmUgYSBjb3JyZXNwb25kaW5nIG5vZGVcbiAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICB0aGlzLm5ld05vZGVzLmFkZChbbmV4dCwgbm9kZV0pO1xuICAgICAgICAgIHRoaXMubm9kZUJ5Q29tbWl0LnNldChuZXh0LnJlZi5pZCwgbm9kZSk7XG4gICAgICAgICAgdGhpcy5jb21taXRCeU5vZGUuc2V0KG5vZGUsIG5leHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlKGRlbHRhczogRGVsdGEpIHtcbiAgICBjb25zdCB7XG4gICAgICBsaW5rLFxuICAgICAgdW5saW5rLFxuICAgICAgbGlua1Jvb3QsXG4gICAgICBzb3J0LFxuICAgICAgdXBkYXRlLFxuICAgICAgZGVzdHJveSxcbiAgICAgIHVubGlua1Jvb3QsXG4gICAgICBzdXNwZW5kID0gdW5saW5rLFxuICAgICAgdW5zdXNwZW5kID0gbGlua1xuICAgIH0gPSB0aGlzLmJ1aWxkZXI7XG5cbiAgICBpZiAobGluayB8fCBzb3J0KSB7XG4gICAgICAvLyBMb29wIHRocm91Z2ggbmV3bHkgY3JlYXRlZCBub2Rlc1xuICAgICAgZm9yIChjb25zdCBbbmV4dCwgbm9kZV0gb2YgdGhpcy5uZXdOb2Rlcykge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmZpbmRQYXJlbnQobmV4dC5yZWYpO1xuXG4gICAgICAgIGlmIChyZXN1bHQuY29tbWl0ICYmIHJlc3VsdC5ub2RlICYmIHJlc3VsdC5hdHRhY2hhYmxlKSB7XG4gICAgICAgICAgdGhpcy5uZWVkc1Jlb3JkZXIuYWRkKHJlc3VsdC5jb21taXQucmVmLmlkKVxuXG4gICAgICAgICAgaWYgKGxpbmspXG4gICAgICAgICAgICBsaW5rKG5vZGUsIHJlc3VsdC5ub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsaW5rUm9vdCAmJiAhcmVzdWx0LmNvbW1pdCAmJiByZXN1bHQuYXR0YWNoYWJsZSlcbiAgICAgICAgICBsaW5rUm9vdChub2RlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodXBkYXRlKSB7XG4gICAgICBmb3IgKGNvbnN0IHsgcHJldiwgbmV4dCwgbW92ZWQgfSBvZiBkZWx0YXMuY2hhbmdlZC52YWx1ZXMoKSkge1xuXG4gICAgICAgIC8vIHN1c3BlbnNlIGNvZGVcbiAgICAgICAgaWYgKG5leHQuZWxlbWVudC50eXBlID09PSBzcGVjaWFsTm9kZVR5cGVzLnN1c3BlbmQpIHtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmZpbmRQYXJlbnQobmV4dC5yZWYpO1xuXG4gICAgICAgICAgY29uc3Qgd2FzU3VzcGVuZGVkID0gISFwcmV2LnByb3BzLnN1c3BlbmRlZDtcbiAgICAgICAgICBjb25zdCBpc1N1c3BlbmRlZCA9ICEhbmV4dC5lbGVtZW50LnByb3BzLnN1c3BlbmRlZDtcblxuICAgICAgICAgIGNvbnN0IHN1c3BlbnNlQ2hhbmdlZCA9IHdhc1N1c3BlbmRlZCAhPT0gaXNTdXNwZW5kZWQ7XG4gICAgICAgICAgaWYgKHN1c3BlbnNlQ2hhbmdlZCAmJiByZXN1bHQuY29tbWl0ICYmIHJlc3VsdC5ub2RlKSB7XG4gICAgICAgICAgICB0aGlzLm5lZWRzUmVvcmRlci5hZGQocmVzdWx0LmNvbW1pdC5yZWYuaWQpO1xuXG4gICAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHRoaXMuZmluZENoaWxkcmVuKG5leHQucmVmLmlkLCB0cnVlLCBmYWxzZSk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgIGlmIChpc1N1c3BlbmRlZCAmJiBzdXNwZW5kKSB7XG4gICAgICAgICAgICAgICAgc3VzcGVuZChjaGlsZCwgcmVzdWx0Lm5vZGUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICBpZiAoIWlzU3VzcGVuZGVkICYmIHVuc3VzcGVuZCkge1xuICAgICAgICAgICAgICAgIHVuc3VzcGVuZChjaGlsZCwgcmVzdWx0Lm5vZGUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMubm9kZUJ5Q29tbWl0LmdldChuZXh0LnJlZi5pZCk7XG4gICAgICAgIGlmICghbm9kZSlcbiAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICB1cGRhdGUobm9kZSwgbmV4dC5lbGVtZW50LCBwcmV2LCBuZXh0LnJlZik7XG5cbiAgICAgICAgaWYgKG1vdmVkKSB7XG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5maW5kUGFyZW50KG5leHQucmVmKTtcbiAgICAgICAgICBcbiAgICAgICAgICBpZiAocmVzdWx0LmNvbW1pdCkge1xuICAgICAgICAgICAgdGhpcy5uZWVkc1Jlb3JkZXIuYWRkKHJlc3VsdC5jb21taXQucmVmLmlkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgbmV4dCBvZiBkZWx0YXMuZnJlc2gudmFsdWVzKCkpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMubm9kZUJ5Q29tbWl0LmdldChuZXh0LnJlZi5pZCk7XG4gICAgICAgIGlmIChub2RlKVxuICAgICAgICAgIHVwZGF0ZShub2RlLCBuZXh0LmVsZW1lbnQsIG51bGwsIG5leHQucmVmKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBwcmV2IG9mIGRlbHRhcy5yZW1vdmVkLnZhbHVlcygpKSB7XG4gICAgICBjb25zdCBub2RlID0gdGhpcy5ub2RlQnlDb21taXQuZ2V0KHByZXYucmVmLmlkKTtcbiAgICAgIGlmIChub2RlKSB7XG4gICAgICAgIHRoaXMubm9kZUJ5Q29tbWl0LmRlbGV0ZShwcmV2LnJlZi5pZCk7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuZmluZFBhcmVudChwcmV2LnJlZik7XG4gICAgICAgIGlmIChwYXJlbnQuY29tbWl0ICYmIHBhcmVudC5ub2RlKVxuICAgICAgICAgIHRoaXMubmVlZHNSZW9yZGVyLmFkZChwYXJlbnQuY29tbWl0LnJlZi5pZClcblxuICAgICAgICB0aGlzLmNvbW1pdEJ5Tm9kZS5kZWxldGUobm9kZSk7XG4gICAgICAgIGlmICh1bmxpbmsgJiYgcGFyZW50Lm5vZGUpXG4gICAgICAgICAgdW5saW5rKG5vZGUsIHBhcmVudC5ub2RlKTtcbiAgICAgICAgaWYgKHVubGlua1Jvb3QgJiYgIXBhcmVudC5jb21taXQpXG4gICAgICAgICAgdW5saW5rUm9vdChub2RlKVxuICAgICAgICBpZiAoZGVzdHJveSlcbiAgICAgICAgICBkZXN0cm95KG5vZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzb3J0KSB7XG4gICAgICBmb3IgKGNvbnN0IGlkIG9mIHRoaXMubmVlZHNSZW9yZGVyKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5vZGVCeUNvbW1pdC5nZXQoaWQpO1xuICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdGhpcy5maW5kQ2hpbGRyZW4oaWQsIHRydWUsIHRydWUpO1xuICAgICAgICAgIHNvcnQobm9kZSwgY2hpbGRyZW4pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCAiaW1wb3J0IHsgU2NoZWR1bGVyIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdC1yZWNvblwiO1xuXG5leHBvcnQgY29uc3QgY3JlYXRlRE9NU2NoZWR1bGVyID0gKCk6IFNjaGVkdWxlciA9PiB7XG4gIGxldCBpZDogbnVtYmVyIHwgbnVsbCB8IE5vZGVKUy5UaW1lb3V0ID0gbnVsbDtcbiAgbGV0IGNhbGxiYWNrRnVuYyA9ICgpID0+IGNvbnNvbGUuZXJyb3IoYERPTVNjaGVkdWxlciBnb3QgY2FsbGJhY2sgYmVmb3JlIGNhbGxiYWNrIGZ1bmN0aW9uIHdhcyBjb25maWd1cmVkYClcbiAgbGV0IHN5bmNjYWxsX2F2YWlsYWJsZSA9IGZhbHNlO1xuICBsZXQgc3luY2NhbGxfcmVxdWVzdGVkID0gZmFsc2U7XG4gIGNvbnN0IHRpbWVfYnVkZ2V0ID0gNjA7XG5cbiAgY29uc3Qgb25UaW1lb3V0ID0gKCkgPT4ge1xuICAgIGNvbnN0IHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgaWQgPSBudWxsO1xuXG4gICAgc3luY2NhbGxfYXZhaWxhYmxlID0gdHJ1ZTtcbiAgICAvLyBhdCBsZWFzdCAxIGNhbGxcbiAgICBjYWxsYmFja0Z1bmMoKTtcblxuICAgIC8vIGlmIGNhbGxiYWNrIGZ1bmMgcmUtcmVxdWVzdGVkIGEgY2FsbCxcbiAgICAvLyBkbyB0aGUgcmVzdCBpbiBzeW5jXG4gICAgd2hpbGUgKHN5bmNjYWxsX3JlcXVlc3RlZCkge1xuICAgICAgc3luY2NhbGxfcmVxdWVzdGVkID0gZmFsc2U7XG4gICAgICBjb25zdCBub3cgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgIFxuICAgICAgaWYgKG5vdyAtIHN0YXJ0ID49IHRpbWVfYnVkZ2V0KSB7XG4gICAgICAgIHN5bmNjYWxsX2F2YWlsYWJsZSA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgXG4gICAgICBjYWxsYmFja0Z1bmMoKTtcbiAgICB9XG4gICAgc3luY2NhbGxfYXZhaWxhYmxlID0gZmFsc2U7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHNldENhbGxiYWNrRnVuYyhuZXdDYWxsYmFja0Z1bmMpIHtcbiAgICAgIGNhbGxiYWNrRnVuYyA9IG5ld0NhbGxiYWNrRnVuYztcbiAgICB9LFxuICAgIGlzQ2FsbGJhY2tQZW5kaW5nKCkge1xuICAgICAgcmV0dXJuIGlkICE9PSBudWxsO1xuICAgIH0sXG4gICAgcmVxdWVzdENhbGxiYWNrKCkge1xuICAgICAgaWYgKHN5bmNjYWxsX2F2YWlsYWJsZSkge1xuICAgICAgICBzeW5jY2FsbF9yZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoIWlkKSB7XG4gICAgICAgIGlkID0gZ2xvYmFsVGhpcy5zZXRUaW1lb3V0KG9uVGltZW91dCwgMCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBjYW5jZWxDYWxsYmFjaygpIHtcbiAgICAgIGlmIChpZCAhPT0gbnVsbClcbiAgICAgICAgZ2xvYmFsVGhpcy5jbGVhclRpbWVvdXQoaWQpO1xuICAgIH0sXG4gIH1cbn1cbiIsICJpbXBvcnQgeyBNYWdpY0Vycm9yIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuXG4vKipcbiAqIENoYW5nZVJlcG9ydFxuICovXG5leHBvcnQgY2xhc3MgQ2hhbmdlUmVwb3J0MiB7XG4gIC8qKlxuICAgKiBUaGUgaW5kaWNlcyBvZiBlbGVtZW50cyB0aGF0IHdlcmUgcmVtb3ZlZFxuICAgKi9cbiAgcmVtb3ZlZDogbnVtYmVyW10gPSBbXTtcbiAgLyoqXG4gICAqIFRoZSBpbmRpY2VzIG9mIHRoZSBwcmV2aW91cyBwb3NpdGlvbiB0aGF0IGFuIGVsZW1lbnRcbiAgICogd2FzIGluLCBvciAtMSBpZiBpdCBkaWRuJ3QgZXhpc3QgaW4gdGhlIFwicHJldnNcIiBhcnJheS5cbiAgICovXG4gIHRyYW5zZm9ybTogbnVtYmVyW10gPSBbXTtcblxuICAvKipcbiAgICogQSAoaG9wZWZ1bGx5KSBmYXN0ZXIgc2luZ2xlLWVudHJ5IHJlcG9ydCBnZW5lcmF0b3JcbiAgICogQHBhcmFtIHByZXYgXG4gICAqIEBwYXJhbSBuZXh0IFxuICAgKiBAcGFyYW0gZXF1YWxpdHlUZXN0IFxuICAgKiBAcmV0dXJucyBcbiAgICovXG4gIHN0YXRpYyBnZW5lcmF0ZVNpbmdsZXM8UHJldiwgTmV4dD4ocHJldjogUHJldiwgbmV4dDogTmV4dCwgZXF1YWxpdHlUZXN0OiBDaGFuZ2VFcXVhbGl0eVRlc3Q8UHJldiwgTmV4dD4pIHtcbiAgICBjb25zdCByZXBvcnQgPSBuZXcgQ2hhbmdlUmVwb3J0MigpO1xuXG4gICAgaWYgKGVxdWFsaXR5VGVzdChwcmV2LCBuZXh0LCAwLCAwKSkge1xuICAgICAgcmVwb3J0LnRyYW5zZm9ybS5wdXNoKDApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXBvcnQudHJhbnNmb3JtLnB1c2goLTEpO1xuICAgICAgcmVwb3J0LnJlbW92ZWQucHVzaCgwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVwb3J0O1xuICB9XG5cbiAgc3RhdGljIGdlbmVyYXRlPFByZXYsIE5leHQ+KHByZXZzOiBQcmV2W10sIG5leHRzOiBOZXh0W10sIGVxdWFsaXR5VGVzdDogQ2hhbmdlRXF1YWxpdHlUZXN0PFByZXYsIE5leHQ+KSB7XG4gICAgaWYgKHByZXZzLmxlbmd0aCA9PT0gMCAmJiBuZXh0cy5sZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gQ2hhbmdlUmVwb3J0Mi5nZW5lcmF0ZVNpbmdsZXMocHJldnNbMF0sIG5leHRzWzBdLCBlcXVhbGl0eVRlc3QpO1xuXG4gICAgY29uc3QgcmVwb3J0ID0gbmV3IENoYW5nZVJlcG9ydDIoKTtcbiAgICBjb25zdCB2aXNpdGVkID0gbmV3IFNldCgpO1xuXG4gICAgZm9yIChsZXQgbmV4dEluZGV4ID0gMDsgbmV4dEluZGV4IDwgbmV4dHMubGVuZ3RoOyBuZXh0SW5kZXgrKykge1xuICAgICAgY29uc3QgbmV4dCA9IG5leHRzW25leHRJbmRleF07XG4gICAgICBjb25zdCBwcmV2SW5kZXggPSBwcmV2cy5maW5kSW5kZXgoKHByZXYsIHByZXZJbmRleCkgPT4gZXF1YWxpdHlUZXN0KHByZXYsIG5leHQsIHByZXZJbmRleCwgbmV4dEluZGV4KSk7XG4gICAgICByZXBvcnQudHJhbnNmb3JtLnB1c2gocHJldkluZGV4KTtcbiAgICAgIGlmIChwcmV2SW5kZXggIT09IC0xKVxuICAgICAgICB2aXNpdGVkLmFkZChwcmV2SW5kZXgpO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZXZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoIXZpc2l0ZWQuaGFzKGkpKVxuICAgICAgICByZXBvcnQucmVtb3ZlZC5wdXNoKGkpO1xuICAgIH1cblxuICAgIHJldHVybiByZXBvcnQ7XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgQ2hhbmdlRXF1YWxpdHlUZXN0PFByZXYsIE5leHQ+ID0gKHByZXY6IFByZXYsIG5leHQ6IE5leHQsIHByZXZJbmRleDogbnVtYmVyLCBuZXh0SW5kZXg6IG51bWJlcikgPT4gYm9vbGVhbjtcblxuZXhwb3J0IGNvbnN0IGZpcnN0ID0gPFgsIFk+KGFycmF5OiBSZWFkb25seUFycmF5PFg+LCBmdW5jOiAodmFsdWU6IFgsIGluZGV4OiBudW1iZXIpID0+IFkgfCBudWxsKTogWSB8IG51bGwgPT4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdmFsdWUgPSBhcnJheVtpXTtcbiAgICBjb25zdCByZXN1bHQgPSBmdW5jKHZhbHVlLCBpKTtcbiAgICBpZiAocmVzdWx0ICE9PSBudWxsKVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGNvbnN0IGxhc3QgPSA8WCwgWSBleHRlbmRzIHt9PihhcnJheTogUmVhZG9ubHlBcnJheTxYPiwgZnVuYzogKHZhbHVlOiBYLCBpbmRleDogbnVtYmVyKSA9PiBZIHwgbnVsbCB8IGZhbHNlIHwgdW5kZWZpbmVkIHwgMCk6IFkgfCBudWxsID0+IHtcbiAgZm9yIChsZXQgaSA9IGFycmF5Lmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICBjb25zdCB2YWx1ZSA9IGFycmF5W2ldO1xuICAgIGNvbnN0IHJlc3VsdCA9IGZ1bmModmFsdWUsIGkpO1xuICAgIGlmIChyZXN1bHQpXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuIiwgIlxuLyoqXG4gKiBBIHNob3J0IHV0aWxpdHkgZm9yIHJlLXVzaW5nIG9sZCBvYmplY3RzXG4gKiB0byBhdm9pZCBkb2luZyB0b28gbXVjaCBHQyB0aHJhc2hpbmcsIGF0IHRoZVxuICogY29zdCBvZiBpbmNyZWFzZWQgbWVtb3J5LlxuICogXG4gKiBEb24ndCBrbm93IHlldCBpZiB0aGUgdHJhZGUgb2ZmIGl0IHdvcnRoIGl0LlxuICovXG5leHBvcnQgdHlwZSBPYmplY3RQb29sPFQsIFRBcmdzIGV4dGVuZHMgdW5rbm93bltdPiA9IHtcbiAgbWF4U2l6ZTogbnVtYmVyLFxuICBzaXplOiBudW1iZXIsXG5cbiAgYWxsOiBUW10sXG4gIGF2YWlsYWJsZTogVFtdLFxuXG4gIGFjcXVpcmUoLi4uYXJnczogVEFyZ3MpOiBULFxuICByZWxlYXNlKHZhbHVlOiBUKTogdm9pZCxcbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZU9iamVjdFBvb2wgPSA8VCwgVEFyZ3MgZXh0ZW5kcyB1bmtub3duW10+KFxuICBidWlsZDogKC4uLmFyZ3M6IFRBcmdzKSA9PiBULFxuICBhc3NpZ246ICh2YWx1ZTogVCwgLi4uYXJnczogVEFyZ3MpID0+IHZvaWQsXG4pOiBPYmplY3RQb29sPFQsIFRBcmdzPiA9PiB7XG4gIGNvbnN0IHBvb2wgPSB7XG4gICAgbWF4U2l6ZTogMjU2LFxuICAgIGF2YWlsYWJsZTogW10gYXMgVFtdLFxuICAgIGFsbDogW10gYXMgVFtdLFxuICAgIGdldCBzaXplKCkge1xuICAgICAgcmV0dXJuIHBvb2wuYXZhaWxhYmxlLmxlbmd0aDtcbiAgICB9LFxuICAgIGFjcXVpcmUoLi4uYXJnczogVEFyZ3MpOiBUIHtcbiAgICAgIGxldCBvYmplY3QgPSBwb29sLmF2YWlsYWJsZS5wb3AoKTtcbiAgICAgIGlmICghb2JqZWN0KSB7XG4gICAgICAgIG9iamVjdCA9IGJ1aWxkKC4uLmFyZ3MpO1xuICAgICAgICBwb29sLmFsbC5wdXNoKG9iamVjdCk7XG4gICAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgICB9XG5cbiAgICAgIGFzc2lnbihvYmplY3QsIC4uLmFyZ3MpO1xuICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICB9LFxuICAgIHJlbGVhc2UodmFsdWU6IFQpIHtcbiAgICAgIC8vaWYgKHBvb2wuc2l6ZSA8IHBvb2wubWF4U2l6ZSlcbiAgICAgIHBvb2wuYXZhaWxhYmxlLnB1c2godmFsdWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcG9vbDtcbn0iLCAiaW1wb3J0IHsgY3JlYXRlSWQsIEVsZW1lbnQsIE9wYXF1ZUlELCBzcGVjaWFsTm9kZVR5cGVzLCBTdXNwZW5kUHJvcHMgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5pbXBvcnQgeyBjcmVhdGVPYmplY3RQb29sIH0gZnJvbSBcIi4vcG9vbFwiO1xuXG4vKipcbiAqIEEgc2luZ2xlIGNvbnNpc3RlbnQgaWQgcmVwcmVzZW50aW5nIGEgY29tbWl0IGluIHRoZSBhY3QgdHJlZS5cbiAqIERvZXMgbm90IGNoYW5nZS5cbiAqL1xuZXhwb3J0IHR5cGUgQ29tbWl0SUQgPSBPcGFxdWVJRDxcIkNvbW1pdElEXCI+O1xuLyoqXG4gKiBBIElEIGZvciBhIHBhcnRpY3VsYXIgX3N0YXRlXyBhICoqQ29tbWl0KiogaXMgaW4gLSBldmVyeSB0aW1lIGl0IG9yIGl0c1xuICogY2hpbGRyZW4gY2hhbmdlLCBhIGNvbW1pdCB3aXRoIHRoZSBzYW1lIElkIGJ1dCBhIG5ldyBDb21taXRWZXJzaW9uXG4gKiBpcyBhZGRlZCB0byB0aGUgdHJlZSwgcmVwbGFjaW5nIHRoZSBwcmV2aW91cy5cbiAqL1xuZXhwb3J0IHR5cGUgQ29tbWl0VmVyc2lvbiA9IE9wYXF1ZUlEPFwiQ29tbWl0VmVyc2lvblwiPjtcblxuZXhwb3J0IGNsYXNzIENvbW1pdFJlZjIge1xuICBpZDogQ29tbWl0SUQ7XG4gIHBhcmVudDogbnVsbCB8IENvbW1pdFJlZjI7XG4gIGxlbmd0aDogbnVtYmVyO1xuXG4gIHByaXZhdGUgY29uc3RydWN0b3IoaWQ6IENvbW1pdElELCBwYXJlbnQ6IENvbW1pdFJlZjIgfCBudWxsKSB7XG4gICAgdGhpcy5pZCA9IGlkO1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIGlmIChwYXJlbnQpXG4gICAgICB0aGlzLmxlbmd0aCA9IHBhcmVudC5sZW5ndGggKyAxO1xuICAgIGVsc2VcbiAgICAgIHRoaXMubGVuZ3RoID0gMTtcbiAgfVxuXG4gIC8qXG4gIFtTeW1ib2wuaXRlcmF0b3JdKCkge1xuICAgIHJldHVybiB0aGlzLmFuY2VzdG9ycygpO1xuICB9XG4gICAgKi9cbiAgXG4gIC8qKlxuICAgKiBJdGVyYXRlIHRob3VnaCBhbGwgXCJwYXJlbnRcIiBjb21taXQgcmVmcyxcbiAgICogaW5jbHVkaW5nIGl0c2VsZiBhcyB0aGUgZmlyc3QgZW50cnkuXG4gICAqIFxuICAgKiBAcmV0dXJucyBJdGVyYXRvcjxDb21taXRSZWYyPlxuICAgKi9cbiAgKmFuY2VzdG9ycygpIHtcbiAgICBsZXQgcmVmOiBDb21taXRSZWYyIHwgbnVsbCA9IHRoaXM7XG5cbiAgICB3aGlsZSAocmVmKSB7XG4gICAgICB5aWVsZCByZWY7XG4gICAgICByZWYgPSByZWYucGFyZW50O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBcbiAgICogQHBhcmFtIGNsaW1iZXIgQSBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGV2ZXJ5IGFuY2VzdG9yIGNvbW1pdCByZWYsXG4gICAqIGluY2x1ZGluZyB0aGlzIG9uZS4gUmV0dXJuIFwidHJ1ZVwiIHRvIHN0b3AgY2xpbWJpbmcgZWFybHkuXG4gICAqL1xuICBjbGltYihjbGltYmVyOiAocmVmOiBDb21taXRSZWYyKSA9PiBib29sZWFuIHwgdm9pZCkge1xuICAgIGxldCByZWY6IENvbW1pdFJlZjIgfCBudWxsID0gdGhpcztcbiAgICB3aGlsZSAocmVmKSB7XG4gICAgICBpZiAoY2xpbWJlcihyZWYpKVxuICAgICAgICByZXR1cm47XG5cbiAgICAgIHJlZiA9IHJlZi5wYXJlbnQ7XG4gICAgfVxuICB9XG5cbiAgZmluZDxUPih0ZXN0OiAoaWQ6IENvbW1pdFJlZjIpID0+IFQgfCBudWxsIHwgdW5kZWZpbmVkIHwgZmFsc2UpOiBUIHwgbnVsbCB7XG4gICAgbGV0IHJlc3VsdDogVCB8IG51bGwgPSBudWxsO1xuICAgIHRoaXMuY2xpbWIocmVmID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbnRSZXN1bHQgPSB0ZXN0KHJlZik7XG4gICAgICBpZiAoY3VycmVudFJlc3VsdCkge1xuICAgICAgICByZXN1bHQgPSBjdXJyZW50UmVzdWx0XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHN0YXRpYyBmcmVzaChwYXJlbnQ6IENvbW1pdFJlZjIgfCBudWxsKSB7XG4gICAgcmV0dXJuIG5ldyBDb21taXRSZWYyKGNyZWF0ZUlkKCdDb21taXRJRCcpLCBwYXJlbnQpO1xuICB9XG4gIHN0YXRpYyByZWh5ZHJhdGUoaWQ6IENvbW1pdElELCBsZW5ndGg6IG51bWJlcikge1xuICAgIGNvbnN0IHJlZiA9IG5ldyBDb21taXRSZWYyKGlkLCBudWxsKTtcbiAgICByZWYubGVuZ3RoID0gbGVuZ3RoO1xuICAgIHJldHVybiByZWY7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbW1pdDIge1xuICBzdGF0aWMgcG9vbCA9ICgpID0+IGNyZWF0ZU9iamVjdFBvb2w8Q29tbWl0MiwgQ29uc3RydWN0b3JQYXJhbWV0ZXJzPHR5cGVvZiBDb21taXQyPj4oXG4gICAgZnVuY3Rpb24gYWxsb2MgKHJlZiwgZWwsIGNoKSB7IHJldHVybiBuZXcgQ29tbWl0MihyZWYsIGVsLCBjaCkgfSxcbiAgICBmdW5jdGlvbiByZWFzc2lnbihjLCByZWYsIGVsLCBjaCkge1xuICAgICAgYy5yZWYgPSByZWY7XG4gICAgICBjLmVsZW1lbnQgPSBlbDtcbiAgICAgIGMuY2hpbGRyZW4gPSBjaDtcbiAgICAgIGMudmVyc2lvbiA9IGNyZWF0ZUlkKCdDb21taXRWZXJzaW9uJyk7XG4gICAgfVxuICApXG5cbiAgcmVmOiBDb21taXRSZWYyO1xuXG4gIGVsZW1lbnQ6IEVsZW1lbnQ7XG4gIGNoaWxkcmVuOiBDb21taXRSZWYyW107XG5cbiAgdmVyc2lvbjogQ29tbWl0VmVyc2lvbiA9IGNyZWF0ZUlkKCdDb21taXRWZXJzaW9uJyk7XG5cbiAgY29uc3RydWN0b3IocmVmOiBDb21taXRSZWYyLCBlbGVtZW50OiBFbGVtZW50LCBjaGlsZHJlbjogQ29tbWl0UmVmMltdKSB7XG4gICAgdGhpcy5yZWYgPSByZWY7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gIH1cblxuICB1cGRhdGUoZWxlbWVudDogbnVsbCB8IEVsZW1lbnQgPSBudWxsLCBjaGlsZHJlbjogbnVsbCB8IENvbW1pdFJlZjJbXSA9IG51bGwpIHtcbiAgICB0aGlzLnZlcnNpb24gPSBjcmVhdGVJZCgnQ29tbWl0VmVyc2lvbicpO1xuICAgIFxuICAgIGlmIChlbGVtZW50KVxuICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICBpZiAoY2hpbGRyZW4pXG4gICAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gIH1cblxuICBpc1N1c3BlbmRlZCgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5lbGVtZW50LnR5cGUgPT09IHNwZWNpYWxOb2RlVHlwZXMuc3VzcGVuZFxuICAgICAgJiYgKHRoaXMuZWxlbWVudC5wcm9wcyBhcyBTdXNwZW5kUHJvcHMpLnN1c3BlbmRlZFxuICAgICk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBFbGVtZW50IH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuaW1wb3J0IHsgQ29tbWl0MiwgQ29tbWl0SUQgfSBmcm9tIFwiLi9jb21taXQudHNcIjtcbmltcG9ydCB7IEVmZmVjdElELCBFZmZlY3RUYXNrIH0gZnJvbSBcIi4vc3RhdGUudHNcIjtcblxuLyoqXG4gKiBUaGUgRGVsdGEgY2xhc3MgcmVwcmVzZW50cyBhbiBhY2N1bXVsYXRpb25cbiAqIG9mIGNoYW5nZXMgb3ZlciB0aW1lLlxuICogXG4gKiBBIFdvcmtUaHJlYWQgbWF5IGRvIHNldmVyYWwgXCJwYXNzZXNcIiBvdmVyIHRoZSBDb21taXRUcmVlLFxuICogYnV0IGFsbCBvZiB0aG9zZSBjaGFuZ2VzIGFyZSB3cml0dGVuIHRvIHRoZSBzYW1lIERlbHRhLlxuICogXG4gKiBUaGUgRGVsdGEga2VlcHMgdHJhY2sgb2Ygb25seSB0aGUgaW1tZWRpYXRlbHkgcHJpb3Igc3RhdGUgKHRoZVxuICogbGFzdCBvbmUgdGhhdCB3YXMgc2VudCB0byB0aGUgUmVuZGVyZXIpLCBhbmQgdGhlIGZpbmFsIHN0YXRlLlxuICogXG4gKiBJZiBhIHBhc3MgY2F1c2VzIGEgY29tcG9uZW50IHRvIGJlIHJlbmRlcmVkL3VwZGF0ZWQgc2V2ZXJhbCB0aW1lcyxcbiAqIGl0IHdpbGwgb25seSBiZSByZWNvcmRlZCBpbiB0aGUgZGVsdGEgb25jZSBmb3IgaXQncyBmaW5hbCBzdGF0ZS4gU2ltaWxhcmx5LFxuICogaWYgYW4gZWxlbWVudCBpcyBjcmVhdGUgaW4gb25lIHBhc3MsIGJ1dCByZW1vdmVkIGluIGEgYW5vdGhlciwgdGhlbiBpdCB3aWxsXG4gKiBiZSBlbnRpcmVseSBleGNsdWRlZCBmcm9tIHRoZSBkZWx0YSAtIGFuZCB0aGUgcmVuZGVyZXIgd2lsbCBuZXZlciBrbm93IGl0IGV4aXN0ZWQuXG4gKiBcbiAqIFRoZSBEZWx0YSByZWNvcmRzIENvbW1pdHMgYXMgd2VsbCBhcyBFZmZlY3RzIHRoaXMgd2F5LlxuICovXG5leHBvcnQgY2xhc3MgRGVsdGEge1xuICBmcmVzaDogTWFwPENvbW1pdElELCBDb21taXQyPiA9IG5ldyBNYXAoKTtcbiAgY2hhbmdlZDogTWFwPENvbW1pdElELCB7IHByZXY6IEVsZW1lbnQsIG5leHQ6IENvbW1pdDIsIG1vdmVkOiBib29sZWFuIH0+ID0gbmV3IE1hcCgpO1xuICByZW1vdmVkOiBNYXA8Q29tbWl0SUQsIENvbW1pdDI+ID0gbmV3IE1hcCgpO1xuXG4gIGVmZmVjdHM6IE1hcDxFZmZlY3RJRCwgRWZmZWN0VGFzaz4gPSBuZXcgTWFwKCk7XG4gIGNsZWFudXBzOiBNYXA8RWZmZWN0SUQsIEVmZmVjdFRhc2s+ID0gbmV3IE1hcCgpO1xuXG4gIGdldCBzaXplKCkge1xuICAgIHJldHVybiAoXG4gICAgICArIHRoaXMuZnJlc2guc2l6ZVxuICAgICAgKyB0aGlzLmNoYW5nZWQuc2l6ZVxuICAgICAgKyB0aGlzLnJlbW92ZWQuc2l6ZVxuICAgIClcbiAgfVxuXG4gIGFkZChjb21taXQ6IENvbW1pdDIpIHtcbiAgICB0aGlzLmZyZXNoLnNldChjb21taXQucmVmLmlkLCBjb21taXQpXG4gIH1cbiAgdXBkYXRlKHByZXY6IEVsZW1lbnQsIG5leHQ6IENvbW1pdDIsIG1vdmVkOiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMuZnJlc2guaGFzKG5leHQucmVmLmlkKSkge1xuICAgICAgdGhpcy5mcmVzaC5zZXQobmV4dC5yZWYuaWQsIG5leHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjaGFuZ2UgPSB0aGlzLmNoYW5nZWQuZ2V0KG5leHQucmVmLmlkKTtcbiAgICAgIGlmIChjaGFuZ2UpIHtcbiAgICAgICAgY2hhbmdlLm5leHQgPSBuZXh0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jaGFuZ2VkLnNldChuZXh0LnJlZi5pZCwgeyBwcmV2LCBuZXh0LCBtb3ZlZCB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZGVsZXRlKGNvbW1pdDogQ29tbWl0Mikge1xuICAgIGlmICh0aGlzLmZyZXNoLmhhcyhjb21taXQucmVmLmlkKSkge1xuICAgICAgdGhpcy5mcmVzaC5kZWxldGUoY29tbWl0LnJlZi5pZCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaWYgKHRoaXMuY2hhbmdlZC5oYXMoY29tbWl0LnJlZi5pZCkpXG4gICAgICAgIHRoaXMuY2hhbmdlZC5kZWxldGUoY29tbWl0LnJlZi5pZCk7XG5cbiAgICAgIHRoaXMucmVtb3ZlZC5zZXQoY29tbWl0LnJlZi5pZCwgY29tbWl0KTtcbiAgICB9XG4gIH1cblxuICBhZGRFZmZlY3RzKHRhc2tzOiBFZmZlY3RUYXNrW10pIHtcbiAgICBmb3IgKGNvbnN0IHRhc2sgb2YgdGFza3MpIHtcbiAgICAgIHRoaXMuZWZmZWN0cy5zZXQodGFzay5pZCwgdGFzayk7XG4gICAgfVxuICB9XG5cbiAgYWRkQ2xlYW51cHModGFza3M6IEVmZmVjdFRhc2tbXSkge1xuICAgIGZvciAoY29uc3QgdGFzayBvZiB0YXNrcykge1xuICAgICAgdGhpcy5lZmZlY3RzLmRlbGV0ZSh0YXNrLmlkKTtcbiAgICAgIHRoaXMuY2xlYW51cHMuc2V0KHRhc2suaWQsIHRhc2spO1xuICAgIH1cbiAgfVxufSIsICJpbXBvcnQge1xuICBob29rSW1wbGVtZW50YXRpb24sIENvbnRleHQsXG4gIFZhbHVlT3JDYWxjdWxhdG9yLCBjYWxjdWxhdGVWYWx1ZSwgU3RhdGVTZXR0ZXIsXG4gIHJ1blVwZGF0ZXIsXG4gIGNyZWF0ZUlkLFxuICBjYWxjdWxhdGVEZXBzQ2hhbmdlLFxuICBFZmZlY3RDb25zdHJ1Y3RvcixcbiAgRGVwcyxcbiAgSG9va0ltcGxlbWVudGF0aW9uXG59IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcbmltcG9ydCB7IENvbXBvbmVudFN0YXRlLCBFZmZlY3RJRCwgRWZmZWN0VGFzayB9IGZyb20gXCIuL3N0YXRlXCI7XG5pbXBvcnQgeyBDb21taXRSZWYyIH0gZnJvbSBcIi4vY29tbWl0XCI7XG5pbXBvcnQgeyBSZWNvbmNpbGVyMiB9IGZyb20gXCIuL3JlY29uY2lsZXJcIjtcbmltcG9ydCB7IGxhc3QgfSBmcm9tIFwiLi9hbGdvcml0aG1zXCI7XG5cbi8qKlxuICogQSBmcmVzaCBzZXQgb2YgaG9vayBmdW5jdGlvbnMgaXMgY3JlYXRlZCBwZXIgY29tcG9uZW50IHJ1bi5cbiAqL1xuZXhwb3J0IGNvbnN0IGxvYWRIb29rczIgPSAoXG4gIHJlY29uY2lsZXI6IFJlY29uY2lsZXIyLFxuXG4gIHN0YXRlOiBDb21wb25lbnRTdGF0ZSxcbiAgcmVmOiBDb21taXRSZWYyXG4pOiBIb29rSW1wbGVtZW50YXRpb24gPT4ge1xuXG4gIGZ1bmN0aW9uIHVzZUNvbnRleHQ8VD4oY29udGV4dDogQ29udGV4dDxUPik6IFQge1xuICAgIGNvbnN0IHN0YXRlSW5kZXggPSBzdGF0ZS5ob29rSW5kZXgrKztcblxuICAgIGlmICghc3RhdGUucHJvdmlkZXJzLmhhcyhzdGF0ZUluZGV4KSkge1xuICAgICAgY29uc3QgcHJvdmlkZXIgPSByZWYuZmluZChyZWYgPT4ge1xuICAgICAgICBjb25zdCBwcm92aWRlciA9IHJlY29uY2lsZXIudHJlZS5jb250ZXh0cy5nZXQocmVmLmlkKVxuICAgICAgICBpZiAocHJvdmlkZXIgJiYgcHJvdmlkZXIuY29udGV4dElkID09PSBjb250ZXh0LmlkKVxuICAgICAgICAgIHJldHVybiBwcm92aWRlcjtcbiAgICAgIH0pXG4gICAgICBpZiAocHJvdmlkZXIpIHtcbiAgICAgICAgcHJvdmlkZXIuY29uc3VtZXJzLnNldChyZWYuaWQsIHJlZik7XG4gICAgICB9XG4gICAgICBzdGF0ZS5wcm92aWRlcnMuc2V0KHN0YXRlSW5kZXgsIHByb3ZpZGVyKTtcbiAgICB9XG4gICAgY29uc3QgcHJvdmlkZXIgPSBzdGF0ZS5wcm92aWRlcnMuZ2V0KHN0YXRlSW5kZXgpO1xuICAgIGlmIChwcm92aWRlcilcbiAgICAgIHJldHVybiBwcm92aWRlci52YWx1ZSBhcyBUO1xuICAgIHJldHVybiBjb250ZXh0LmRlZmF1bHRWYWx1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVzZVN0YXRlPFQ+KGluaXRpYWxWYWx1ZTogVmFsdWVPckNhbGN1bGF0b3I8VD4pOiBbVCwgU3RhdGVTZXR0ZXI8VD5dIHtcbiAgICBjb25zdCBzdGF0ZUluZGV4ID0gc3RhdGUuaG9va0luZGV4Kys7XG4gICAgaWYgKCFzdGF0ZS52YWx1ZXMuaGFzKHN0YXRlSW5kZXgpKVxuICAgICAgc3RhdGUudmFsdWVzLnNldChzdGF0ZUluZGV4LCBjYWxjdWxhdGVWYWx1ZShpbml0aWFsVmFsdWUpKTtcblxuICAgIGNvbnN0IHZhbHVlID0gc3RhdGUudmFsdWVzLmdldChzdGF0ZUluZGV4KSBhcyBUO1xuICAgIGNvbnN0IHNldFZhbHVlOiBTdGF0ZVNldHRlcjxUPiA9ICh1cGRhdGVyKSA9PiB7XG4gICAgICBpZiAoc3RhdGUudW5tb3VudGVkKVxuICAgICAgICByZXR1cm47XG4gICAgICBjb25zdCBwcmV2VmFsdWUgPSBzdGF0ZS52YWx1ZXMuZ2V0KHN0YXRlSW5kZXgpIGFzIFQ7XG4gICAgICBjb25zdCBuZXh0VmFsdWUgPSBydW5VcGRhdGVyKHByZXZWYWx1ZSwgdXBkYXRlcik7XG4gICAgICBpZiAocHJldlZhbHVlID09PSBuZXh0VmFsdWUpXG4gICAgICAgIHJldHVybjtcbiAgICAgIFxuICAgICAgc3RhdGUudmFsdWVzLnNldChzdGF0ZUluZGV4LCBuZXh0VmFsdWUpO1xuICAgICAgcmVjb25jaWxlci5yZW5kZXIocmVmKTtcbiAgICB9O1xuICAgIHJldHVybiBbdmFsdWUsIHNldFZhbHVlXTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gdXNlRWZmZWN0KGVmZmVjdDogRWZmZWN0Q29uc3RydWN0b3IsIGRlcHM6IERlcHMgPSBudWxsKSB7XG4gICAgY29uc3QgZWZmZWN0SW5kZXggPSBzdGF0ZS5ob29rSW5kZXgrKztcbiAgICBpZiAoIXN0YXRlLmVmZmVjdHMuaGFzKGVmZmVjdEluZGV4KSlcbiAgICAgIHN0YXRlLmVmZmVjdHMuc2V0KGVmZmVjdEluZGV4LCBjcmVhdGVJZChcIkVmZmVjdElEXCIpKTtcbiAgICBcbiAgICBjb25zdCBwcmV2RGVwcyA9IHN0YXRlLmRlcHMuZ2V0KGVmZmVjdEluZGV4KSB8fCBudWxsO1xuICAgIGNvbnN0IGVmZmVjdElkID0gc3RhdGUuZWZmZWN0cy5nZXQoZWZmZWN0SW5kZXgpIGFzIEVmZmVjdElEO1xuICAgIHN0YXRlLmRlcHMuc2V0KGVmZmVjdEluZGV4LCBkZXBzKTtcbiAgICBjb25zdCBkZXBzQ2hhbmdlcyA9IGNhbGN1bGF0ZURlcHNDaGFuZ2UocHJldkRlcHMsIGRlcHMpXG4gICAgXG4gICAgaWYgKGRlcHNDaGFuZ2VzKSB7XG4gICAgICBpZiAoIXN0YXRlLmVmZmVjdFRhc2tzKVxuICAgICAgICBzdGF0ZS5lZmZlY3RUYXNrcyA9IFtdO1xuICAgICAgXG4gICAgICBzdGF0ZS5lZmZlY3RUYXNrcy5wdXNoKHtcbiAgICAgICAgaWQ6IGVmZmVjdElkLFxuICAgICAgICByZWYsXG4gICAgICAgIGZ1bmMoKSB7XG4gICAgICAgICAgY29uc3QgcHJldkNsZWFudXAgPSBzdGF0ZS5jbGVhbnVwcy5nZXQoZWZmZWN0SWQpO1xuICAgICAgICAgIGlmIChwcmV2Q2xlYW51cCkge1xuICAgICAgICAgICAgc3RhdGUuY2xlYW51cHMuZGVsZXRlKGVmZmVjdElkKTtcbiAgICAgICAgICAgIHByZXZDbGVhbnVwKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0YXRlLmNsZWFudXBzLnNldChlZmZlY3RJZCwgZWZmZWN0KCkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4geyB1c2VDb250ZXh0LCB1c2VTdGF0ZSwgdXNlRWZmZWN0IH07XG59OyIsICJpbXBvcnQgeyBjb252ZXJ0Tm9kZVRvRWxlbWVudHMsIGNyZWF0ZUlkLCBFbGVtZW50LCBOb2RlLCBzcGVjaWFsTm9kZVR5cGVzIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuaW1wb3J0IHsgQ2hhbmdlRXF1YWxpdHlUZXN0LCBDaGFuZ2VSZXBvcnQyIH0gZnJvbSBcIi4vYWxnb3JpdGhtcy50c1wiO1xuaW1wb3J0IHsgQ29tbWl0MiwgQ29tbWl0SUQsIENvbW1pdFJlZjIgfSBmcm9tIFwiLi9jb21taXQudHNcIjtcbmltcG9ydCB7IGNyZWF0ZU9iamVjdFBvb2wsIE9iamVjdFBvb2wgfSBmcm9tIFwiLi9wb29sLnRzXCI7XG5cbi8qKlxuICogQSByZXF1ZXN0IHRvIHRyYW5zZm9ybSBwYXJ0IG9mIGEgdHJlZSBzcGVjaWZpZWQgYnlcbiAqIHRoZSBcInJlZlwiLiBDb250YWlucyB0aGUgaGlzdG9yeSBuZWVkZWQgdG8gcmVzb2x2ZSB0aGlzXG4gKiByZXF1ZXN0XG4gKi9cbmV4cG9ydCBjbGFzcyBXb3JrVGFzayB7XG4gIHN0YXRpYyBwb29sID0gY3JlYXRlT2JqZWN0UG9vbDxXb3JrVGFzaywgUGFyYW1ldGVyczx0eXBlb2YgdGhpcy5uZXc+PihcbiAgICAocmVmLCBwcmV2LCBuZXh0LCBtb3ZlZCkgPT4gbmV3IFdvcmtUYXNrKHJlZiwgcHJldiwgIG5leHQsIG1vdmVkKSxcbiAgICAodGFzaywgcmVmLCBwcmV2LCBuZXh0LCBtb3ZlZCA9IGZhbHNlKSA9PiB7XG4gICAgICB0YXNrLnJlZiA9IHJlZjtcbiAgICAgIHRhc2sucHJldiA9IHByZXY7XG4gICAgICB0YXNrLm5leHQgPSBuZXh0O1xuICAgICAgdGFzay5tb3ZlZCA9IG1vdmVkO1xuICAgIH1cbiAgKVxuXG4gIC8qKlxuICAgKiBUaGUgY29tbWl0IHRoYXQgc2hvdWxkIGV2YWx1YXRlIHRoaXNcbiAgICogdXBkYXRlIChpZiB0aGlzIGNvbW1pdCBkb2VzIG5vdCBleGlzdCxcbiAgICogaXQgc2hvdWxkIHVzZSB0aGlzIGFzIGl0J3MgSUQgYW5kIFBhdGgpLlxuICAgKiAqL1xuICByZWY6IENvbW1pdFJlZjI7XG5cbiAgLyoqIElmIG51bGwsIHRoaXMgdXBkYXRlIHNob3VsZCBjYXVzZVxuICAgKiB0aGlzIGNvbW1pdCB0byBiZSBjcmVhdGVkICovXG4gIHByZXY6IG51bGwgfCBDb21taXQyO1xuICAvKiogSWYgbnVsbCwgdGhpcyB1cGRhdGUgc2hvdWxkIGNhdXNlXG4gICAqIHRoaXMgY29tbWl0IHRvIGJlIHJlbW92ZWRcbiAgICovXG4gIG5leHQ6IG51bGwgfCBFbGVtZW50O1xuXG4gIC8vIFRPRE86IG1heWJlIGV4cG9zZSBwcmV2L25leHQgaW5kZXggaW5mb3JtYXRpb24/XG4gIG1vdmVkOiBib29sZWFuO1xuXG4gIHByaXZhdGUgY29uc3RydWN0b3IocmVmOiBDb21taXRSZWYyLCBwcmV2OiBudWxsIHwgQ29tbWl0MiwgbmV4dDogbnVsbCB8IEVsZW1lbnQsIG1vdmVkOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICB0aGlzLnJlZiA9IHJlZjtcbiAgICB0aGlzLnByZXYgPSBwcmV2O1xuICAgIHRoaXMubmV4dCA9IG5leHQ7XG4gICAgdGhpcy5tb3ZlZCA9IG1vdmVkO1xuICB9XG5cbiAgZnJlZSgpIHtcbiAgICBXb3JrVGFzay5wb29sLnJlbGVhc2UodGhpcyk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBuZXcocmVmOiBDb21taXRSZWYyLCBwcmV2OiBudWxsIHwgQ29tbWl0MiwgbmV4dDogbnVsbCB8IEVsZW1lbnQsIG1vdmVkOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICByZXR1cm4gdGhpcy5wb29sLmFjcXVpcmUocmVmLCBwcmV2LCBuZXh0LCBtb3ZlZClcbiAgfVxuXG4gIHN0YXRpYyBmcmVzaChyZWY6IENvbW1pdFJlZjIsIG5leHQ6IEVsZW1lbnQpIHtcbiAgICByZXR1cm4gV29ya1Rhc2submV3KHJlZiwgbnVsbCwgbmV4dClcbiAgfVxuICBzdGF0aWMgZXhpc3RpbmcocHJldjogQ29tbWl0MiwgbmV4dDogRWxlbWVudCkge1xuICAgIHJldHVybiBXb3JrVGFzay5uZXcocHJldi5yZWYsIHByZXYsIG5leHQpXG4gIH1cbiAgc3RhdGljIG1vdmUocHJldjogQ29tbWl0MiwgbmV4dDogRWxlbWVudCkge1xuICAgIHJldHVybiBXb3JrVGFzay5uZXcocHJldi5yZWYsIHByZXYsIG5leHQsIHRydWUpXG4gIH1cbiAgc3RhdGljIHJlbW92ZShwcmV2OiBDb21taXQyKSB7XG4gICAgcmV0dXJuIFdvcmtUYXNrLm5ldyhwcmV2LnJlZiwgcHJldiwgbnVsbClcbiAgfVxuICBzdGF0aWMgdmlzaXQocHJldjogQ29tbWl0Mikge1xuICAgIHJldHVybiBXb3JrVGFzay5uZXcocHJldi5yZWYsIHByZXYsIHByZXYuZWxlbWVudClcbiAgfVxufVxuXG5leHBvcnQgY29uc3Qga2V5ZWRFbGVtZW50RXF1YWxpdHlUZXN0MjogIENoYW5nZUVxdWFsaXR5VGVzdDxDb21taXQyLCBFbGVtZW50PiA9IChwcmV2LCBuZXh0LCBwcmV2X2luZGV4LCBuZXh0X2luZGV4KSA9PiB7XG4gIGNvbnN0IGNvbXBhdGlibGUgPSBwcmV2LmVsZW1lbnQudHlwZSA9PT0gbmV4dC50eXBlIHx8IHByZXYuZWxlbWVudC50eXBlID09PSBzcGVjaWFsTm9kZVR5cGVzLnBsYWNlaG9sZGVyO1xuICBpZiAoIWNvbXBhdGlibGUpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBwcmV2S2V5ID0gcHJldi5lbGVtZW50LnByb3BzLmtleTtcbiAgY29uc3QgbmV4dEtleSA9IG5leHQucHJvcHMua2V5O1xuICBpZiAocHJldktleSB8fCBuZXh0S2V5KVxuICAgIHJldHVybiBwcmV2S2V5ID09PSBuZXh0S2V5O1xuXG4gIHJldHVybiBwcmV2X2luZGV4ID09PSBuZXh0X2luZGV4O1xufVxuIiwgImltcG9ydCB7IFVuc2V0SG9va0ltcGxlbWVudGF0aW9uIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuaW1wb3J0IHsgQ29tcG9uZW50U3RhdGUgfSBmcm9tIFwiLi9zdGF0ZVwiO1xuXG5leHBvcnQgY29uc3QgdXNlSW50ZXJuYWxDb21wb25lbnRTdGF0ZSA9ICgpOiBDb21wb25lbnRTdGF0ZSA9PiB7XG4gIHJldHVybiBpbnRlcm5hbEhvb2tJbXBsZW1lbnRhdGlvbnMudXNlSW50ZXJuYWxDb21wb25lbnRTdGF0ZSgpO1xufVxuXG5leHBvcnQgY29uc3QgaW50ZXJuYWxIb29rSW1wbGVtZW50YXRpb25zID0ge1xuICB1c2VJbnRlcm5hbENvbXBvbmVudFN0YXRlKCk6IENvbXBvbmVudFN0YXRlIHtcbiAgICB0aHJvdyBuZXcgVW5zZXRIb29rSW1wbGVtZW50YXRpb24oKTtcbiAgfSxcbn0iLCAiaW1wb3J0IHtcbiAgRWxlbWVudCwgTm9kZSxcbiAgY29udmVydE5vZGVUb0VsZW1lbnRzLFxuICBDb21wb25lbnQsXG4gIGhvb2tJbXBsZW1lbnRhdGlvbixcbiAgRmFsbGJhY2ssXG4gIGgsXG4gIFN1c3BlbmQsXG59IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcbmltcG9ydCB7IENvbW1pdDIsIENvbW1pdFJlZjIgfSBmcm9tIFwiLi9jb21taXRcIjtcbmltcG9ydCB7IGxvYWRIb29rczIgfSBmcm9tIFwiLi9ob29rc1wiO1xuaW1wb3J0IHsgQm91bmRhcnlTdGF0ZSwgQ29tcG9uZW50U3RhdGUsIENvbnRleHRTdGF0ZSwgRWZmZWN0VGFzayB9IGZyb20gXCIuL3N0YXRlXCI7XG5pbXBvcnQgeyBrZXllZEVsZW1lbnRFcXVhbGl0eVRlc3QyLCBXb3JrVGFzayB9IGZyb20gXCIuL3VwZGF0ZVwiO1xuaW1wb3J0IHsgQ2hhbmdlUmVwb3J0MiB9IGZyb20gXCIuL2FsZ29yaXRobXNcIjtcbmltcG9ydCB7IENvbW1pdFRyZWUyIH0gZnJvbSBcIi4vdHJlZVwiO1xuaW1wb3J0IHsgaW50ZXJuYWxIb29rSW1wbGVtZW50YXRpb25zIH0gZnJvbSBcIi4vaW50ZXJuYWxcIjtcblxuLyoqXG4gKiBBIGRhdGEgc3RydWN0dXJlIHRoYXQgcmVwcmVzZW50cyB0aGUgaW1tZWRpYXRlIG91dHB1dFxuICogaW5zZXJ0aW5nIHNvbWV0aGluZyBpbnRvIHRoZSB0cmVlIHN1Y2ggYXM6XG4gKiAgLSBXaGF0IHRoZSBuZXcgY2hpbGRyZW4gd291bGQgYmVcbiAqICAtIEFkZGl0aW9uYWwgdGFza3MgdGhhdCBtaWdodCBuZWVkIHRvIGJlIGRvbmVcbiAqICAtIFNpZGUgZWZmZWN0cyBmcm9tIHJ1bm5pbmcgY29tcG9uZW50c1xuICogIC0gUmVqZWN0aW9uIHZhbHVlc1xuICogIC0gRXh0cmEgcmVuZGVyaW5nIHRhcmdldHMgdGhhdCBub3cgbmVlZCB0byBiZSBhY2NvdW50ZWQgZm9yXG4gKi9cbmV4cG9ydCBjbGFzcyBFbGVtZW50T3V0cHV0MiB7XG4gIGVsZW1lbnQ6IEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcmVmOiBDb21taXRSZWYyO1xuXG4gIGNoaWxkcmVuOiBFbGVtZW50W10gPSBbXTtcblxuICBwcmV2Q2hpbGRyZW46IENvbW1pdDJbXSB8IG51bGwgPSBudWxsO1xuXG4gIGNoaWxkUmVmczogQ29tbWl0UmVmMltdID0gW107XG4gIC8qKlxuICAgKiBQcm9jZXNzaW5nIGFuIGVsZW1lbnQgb2Ygc29tZSBraW5kIG9mdGVuXG4gICAqIGltcGxpZXMgY2hhbmdlcyB0byBpdCdzIGNoaWxkcmVuOiB0aGUgT3V0cHV0XG4gICAqIHdpbGwgcHJvZHVjZSBhZGRpdGlvbmFsIHRhc2tzIHRoYXQgYSB0aHJlYWQgc2hvdWxkIGVucXVldWUuXG4gICAqL1xuICB1cGRhdGVzOiBXb3JrVGFza1tdID0gW11cbiAgXG4gIGVmZmVjdHM6IG51bGwgfCBFZmZlY3RUYXNrW10gPSBudWxsO1xuICBjbGVhbnVwczogbnVsbCB8IEVmZmVjdFRhc2tbXSA9IG51bGw7XG5cbiAgZXh0cmFUYXJnZXRzOiBudWxsIHwgQ29tbWl0UmVmMltdID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihyZWY6IENvbW1pdFJlZjIpIHtcbiAgICB0aGlzLnJlZiA9IHJlZjtcbiAgfVxuXG4gIHByb2Nlc3NDb21wb25lbnQoY29tcG9uZW50OiBDb21wb25lbnQ8e30+LCBlbGVtZW50OiBFbGVtZW50LCB0cmVlOiBDb21taXRUcmVlMiwgc3RhdGU6IENvbXBvbmVudFN0YXRlKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICBzdGF0ZS5lZmZlY3RUYXNrcyA9IG51bGw7XG4gICAgXG4gICAgc3RhdGUuaG9va0luZGV4ID0gMDtcbiAgICBpZiAoIXN0YXRlLmhvb2tzKVxuICAgICAgc3RhdGUuaG9va3MgPSBsb2FkSG9va3MyKHRyZWUucmVjb25jaWxlciwgc3RhdGUsIHRoaXMucmVmKTtcblxuXG4gICAgaG9va0ltcGxlbWVudGF0aW9uLnVzZUNvbnRleHQgPSBzdGF0ZS5ob29rcy51c2VDb250ZXh0O1xuICAgIGhvb2tJbXBsZW1lbnRhdGlvbi51c2VFZmZlY3QgPSBzdGF0ZS5ob29rcy51c2VFZmZlY3Q7XG4gICAgaG9va0ltcGxlbWVudGF0aW9uLnVzZVN0YXRlID0gc3RhdGUuaG9va3MudXNlU3RhdGU7XG4gICAgaW50ZXJuYWxIb29rSW1wbGVtZW50YXRpb25zLnVzZUludGVybmFsQ29tcG9uZW50U3RhdGUgPSAoKSA9PiBzdGF0ZTtcblxuICAgIGNvbnN0IHByb3BzID0ge1xuICAgICAgLi4udGhpcy5lbGVtZW50LnByb3BzLFxuICAgICAgY2hpbGRyZW46IHRoaXMuZWxlbWVudC5jaGlsZHJlbixcbiAgICB9IGFzIFBhcmFtZXRlcnM8dHlwZW9mIGNvbXBvbmVudD5bMF07XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuc2V0Tm9kZShjb21wb25lbnQocHJvcHMpKTtcbiAgICAgIGlmIChzdGF0ZS5yZWplY3Rpb24pIHtcbiAgICAgICAgc3RhdGUucmVqZWN0aW9uID0gbnVsbDtcblxuICAgICAgICBpZiAoc3RhdGUuYm91bmRhcnkpXG4gICAgICAgICAgc3RhdGUuYm91bmRhcnkuY2xlYXJUaHJvdyh0aGlzLnJlZik7XG4gICAgICB9XG4gICAgICB0aGlzLmVmZmVjdHMgPSBzdGF0ZS5lZmZlY3RUYXNrcztcbiAgICAgIHRoaXMuY2FsY3VsYXRlRGlmZigpO1xuICAgIH0gY2F0Y2ggKHRocm93blZhbHVlKSB7XG4gICAgXG4gICAgICBpZiAoIXN0YXRlLmJvdW5kYXJ5KSB7XG4gICAgICAgIGNvbnN0IGJvdW5kYXJ5ID0gdHJlZS5maW5kQ2xvc2VzdEJvdW5kYXJ5KHRoaXMucmVmKTtcbiAgICAgICAgaWYgKCFib3VuZGFyeSlcbiAgICAgICAgICB0aHJvdyB0aHJvd25WYWx1ZTtcblxuICAgICAgICBzdGF0ZS5ib3VuZGFyeSA9IGJvdW5kYXJ5O1xuICAgICAgfVxuICAgICAgLy8gdXBkYXRlIGNvbXBvbmVudCBzdGF0ZSB0byBrbm93IHdlIHJlamVjdGVkXG4gICAgICBzdGF0ZS5yZWplY3Rpb24gPSB7IHZhbHVlOiB0aHJvd25WYWx1ZSB9O1xuICAgICAgc3RhdGUuYm91bmRhcnkuYWRkVGhyb3codGhpcy5yZWYsIHRocm93blZhbHVlKTtcblxuICAgICAgaWYgKHRoaXMucHJldkNoaWxkcmVuKVxuICAgICAgICB0aGlzLmNoaWxkUmVmcyA9IHRoaXMucHJldkNoaWxkcmVuLm1hcChjID0+IGMucmVmKTtcbiAgICB9XG4gIH1cblxuICBwcm9jZXNzUHJpbWl0aXZlKGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMuc2V0Tm9kZSh0aGlzLmVsZW1lbnQuY2hpbGRyZW4pO1xuICAgIHRoaXMuY2FsY3VsYXRlRGlmZigpO1xuICB9XG5cbiAgcHJvY2Vzc1Byb3ZpZGVyKGVsZW1lbnQ6IEVsZW1lbnQsIHN0YXRlOiBDb250ZXh0U3RhdGU8dW5rbm93bj4pIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMuc2V0Tm9kZSh0aGlzLmVsZW1lbnQuY2hpbGRyZW4pO1xuXG4gICAgaWYgKHN0YXRlLnZhbHVlICE9PSBlbGVtZW50LnByb3BzLnZhbHVlKSB7XG4gICAgICBzdGF0ZS52YWx1ZSA9IGVsZW1lbnQucHJvcHMudmFsdWU7XG4gICAgICB0aGlzLmV4dHJhVGFyZ2V0cyA9IFsuLi5zdGF0ZS5jb25zdW1lcnMudmFsdWVzKCldO1xuICAgIH1cbiAgICB0aGlzLmNhbGN1bGF0ZURpZmYoKTtcbiAgfVxuICBwcm9jZXNzQm91bmRhcnkoZWxlbWVudDogRWxlbWVudCwgc3RhdGU6IEJvdW5kYXJ5U3RhdGUpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIGNvbnN0IGZhbGxiYWNrRWxlbWVudCA9ICEhZWxlbWVudC5wcm9wcy5mYWxsYmFjayAmJiBoKEZhbGxiYWNrLCB7fSwgZWxlbWVudC5wcm9wcy5mYWxsYmFjayBhcyBOb2RlKVxuXG4gICAgaWYgKHN0YXRlLm1vZGUgPT09ICdub3JtYWwnKSB7XG4gICAgICB0aGlzLnNldE5vZGUoW2goU3VzcGVuZCwgeyBzdXNwZW5kZWQ6IGZhbHNlIH0sIHRoaXMuZWxlbWVudC5jaGlsZHJlbildKTtcbiAgICAgIHRoaXMuY2FsY3VsYXRlRGlmZigpO1xuICAgIH0gZWxzZSBpZiAoZmFsbGJhY2tFbGVtZW50KSB7XG4gICAgICAvLyBIYW5kbGUgYSBib3VuZGFyeVxuICAgICAgdGhpcy5zZXROb2RlKFtoKFN1c3BlbmQsIHsgc3VzcGVuZGVkOiB0cnVlIH0sIHRoaXMuZWxlbWVudC5jaGlsZHJlbiksIGZhbGxiYWNrRWxlbWVudF0pO1xuICAgICAgdGhpcy5jYWxjdWxhdGVEaWZmKCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY2hpbGRFbGVtZW50ID0gdGhpcy5jaGlsZHJlbltpXTtcbiAgICAgICAgaWYgKGNoaWxkRWxlbWVudC5pZCA9PT0gZmFsbGJhY2tFbGVtZW50LmlkKSB7XG4gICAgICAgICAgY29uc3QgY2hpbGRDb21taXQgPSB0aGlzLmNoaWxkUmVmc1tpXTtcbiAgICAgICAgICBzdGF0ZS5mYWxsYmFja1JlZiA9IGNoaWxkQ29tbWl0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlRGlmZigpIHtcbiAgICBpZiAodGhpcy5wcmV2Q2hpbGRyZW4gJiYgdGhpcy5jaGlsZHJlbi5sZW5ndGggIT09IDApIHtcbiAgICAgIGNvbnN0IGNoYW5nZXMgPSBDaGFuZ2VSZXBvcnQyLmdlbmVyYXRlKHRoaXMucHJldkNoaWxkcmVuLCB0aGlzLmNoaWxkcmVuLCBrZXllZEVsZW1lbnRFcXVhbGl0eVRlc3QyKTtcblxuICAgICAgZm9yIChsZXQgY2hpbGRJbmRleCA9IDA7IGNoaWxkSW5kZXggPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IGNoYW5nZXMudHJhbnNmb3JtW2NoaWxkSW5kZXhdO1xuICAgICAgXG4gICAgICAgIGlmICh0cmFuc2Zvcm0gPT09IC0xKSB7XG4gICAgICAgICAgY29uc3QgbmV3UmVmID0gQ29tbWl0UmVmMi5mcmVzaCh0aGlzLnJlZik7XG4gICAgICAgICAgdGhpcy51cGRhdGVzLnB1c2goV29ya1Rhc2suZnJlc2gobmV3UmVmLCB0aGlzLmNoaWxkcmVuW2NoaWxkSW5kZXhdKSk7XG4gICAgICAgICAgdGhpcy5jaGlsZFJlZnMucHVzaChuZXdSZWYpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHByZXZDb21taXQgPSB0aGlzLnByZXZDaGlsZHJlblt0cmFuc2Zvcm1dXG4gICAgICAgICAgdGhpcy5jaGlsZFJlZnMucHVzaChwcmV2Q29tbWl0LnJlZik7XG4gICAgICAgICAgY29uc3QgbW92ZWQgPSBjaGlsZEluZGV4ICE9PSB0cmFuc2Zvcm07XG4gICAgICAgICAgaWYgKG1vdmVkKVxuICAgICAgICAgICAgdGhpcy51cGRhdGVzLnB1c2goV29ya1Rhc2subW92ZShwcmV2Q29tbWl0LCB0aGlzLmNoaWxkcmVuW2NoaWxkSW5kZXhdKSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpcy51cGRhdGVzLnB1c2goV29ya1Rhc2suZXhpc3RpbmcocHJldkNvbW1pdCwgdGhpcy5jaGlsZHJlbltjaGlsZEluZGV4XSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmb3IgKGxldCByZW1vdmVkSW5kZXggPSAwOyByZW1vdmVkSW5kZXggPCBjaGFuZ2VzLnJlbW92ZWQubGVuZ3RoOyByZW1vdmVkSW5kZXgrKykge1xuICAgICAgICBjb25zdCBwcmV2Q29tbWl0ID0gdGhpcy5wcmV2Q2hpbGRyZW5bY2hhbmdlcy5yZW1vdmVkW3JlbW92ZWRJbmRleF1dXG4gICAgICAgIHRoaXMudXBkYXRlcy5wdXNoKFdvcmtUYXNrLnJlbW92ZShwcmV2Q29tbWl0KSlcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCF0aGlzLnByZXZDaGlsZHJlbikge1xuICAgICAgLy8gSWYgdGhlcmUgd2VyZSBubyBwcmV2aW91cyBjaGlsZHJlbiwgYWx3YXlzIGdlbmVyYXRlIFwiQ3JlYXRlXCIgdGFza3NcbiAgICAgIHRoaXMudXBkYXRlcyA9IHRoaXMuY2hpbGRyZW4ubWFwKGNoaWxkID0+IFdvcmtUYXNrLmZyZXNoKENvbW1pdFJlZjIuZnJlc2godGhpcy5yZWYpLCBjaGlsZCkpO1xuICAgICAgdGhpcy5jaGlsZFJlZnMgPSB0aGlzLnVwZGF0ZXMubWFwKGMgPT4gYy5yZWYpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0aGVyZSB3aWxsIGJlIG5vIGNoaWxkcmVuIGluIHRoZSBmdXR1cmUsIGdlbmVyYXRlIFwiUmVtb3ZlXCIgdGFza3NcbiAgICAgIHRoaXMudXBkYXRlcyA9IHRoaXMucHJldkNoaWxkcmVuLm1hcChjaGlsZCA9PiBXb3JrVGFzay5yZW1vdmUoY2hpbGQpKTtcbiAgICAgIHRoaXMuY2hpbGRSZWZzID0gW107XG4gICAgfVxuICB9XG5cbiAgc2V0Tm9kZShub2RlOiBOb2RlKSB7XG4gICAgdGhpcy5jaGlsZHJlbiA9IGNvbnZlcnROb2RlVG9FbGVtZW50cyhub2RlKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGNyZWF0ZUlkLCBFbGVtZW50IH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuaW1wb3J0IHsgQ29tbWl0MiwgQ29tbWl0SUQsIENvbW1pdFJlZjIgfSBmcm9tIFwiLi9jb21taXQudHNcIjtcbmltcG9ydCB7IERlbHRhIH0gZnJvbSBcIi4vZGVsdGEudHNcIjtcbmltcG9ydCB7IENvbW1pdFRyZWUyIH0gZnJvbSBcIi4vdHJlZS50c1wiO1xuaW1wb3J0IHsgV29ya1Rhc2sgfSBmcm9tIFwiLi91cGRhdGUudHNcIjtcbmltcG9ydCB7IEVmZmVjdFRhc2sgfSBmcm9tIFwiLi9zdGF0ZS50c1wiO1xuXG5leHBvcnQgdHlwZSBXb3JrUmVhc29uID1cbiAgfCB7IHR5cGU6ICdtb3VudCcsIGVsZW1lbnQ6IEVsZW1lbnQsIHJlZjogQ29tbWl0UmVmMiB9XG4gIHwgeyB0eXBlOiAndW5tb3VudCcsIHJlZjogQ29tbWl0UmVmMiB9XG4gIHwgeyB0eXBlOiAndGFyZ2V0JywgcmVmOiBDb21taXRSZWYyIH1cblxuZXhwb3J0IHR5cGUgUXVldWVSZXN1bHQgPVxuICB8ICduZXctdGFzaydcbiAgfCAnbWlzc2VkJ1xuICB8ICdleGlzdGluZy10YXJnZXQnXG4gIHwgJ2V4aXN0aW5nLXRhc2snXG5cbi8qKlxuICogQSB0ZW1wb3JhcnkgZGF0YSBzdHJ1Y3R1cmUgdGhhdCBjYXJyaWVzIHRoZSBzdGF0ZSBvZiBhXG4gKiB3b3JrLWluLXByb2dyZXNzIHVwZGF0ZSB0byB0aGUgdHJlZS5cbiAqXG4gKiBBbiB1cGRhdGUgdG8gdGhlIHRyZWUgaXMgZGVzaWduZWQgdG8gYmUgYnJva2VuIHVwIC0gdGhlIHNjaGVkdWxlclxuICogd2lsbCBjb250aW51YWxseSBjYWxsIHRoZSBcIndvcmtcIiBmdW5jdGlvbiBtYW55IHRpbWVzLlxuICovXG5leHBvcnQgY2xhc3MgV29ya1RocmVhZDIge1xuICB0cmVlOiBDb21taXRUcmVlMjtcblxuICAvKipcbiAgICogRWFjaCB0aW1lIGFuIGV4dGVybmFsIHN5c3RlbSBhZGRzIGFuIHVwZGF0ZSB0byB0aGUgY3VycmVudCB0aHJlYWQsXG4gICAqIHRoZXkgcmVjb3JkIHRoZSBcInJlYXNvblwiLCBzbyB5b3UgY2FuIHRyYWNlIHdoaWNoIGVmZmVjdHNcbiAgICogY2F1c2UvY29udHJpYnV0ZWQgdG8gdGhpcyB0aHJlYWQuXG4gICAqL1xuICByZWFzb25zOiBXb3JrUmVhc29uW10gPSBbXTtcbiAgLyoqXG4gICAqIEEgTWFwIG9mIGV2ZXJ5IGNvbW1pdCB0aGF0IE5FRURTIHRvIGJlIHJlbmRlcmVkIGlmIHlvdSB2aXNpdCB0aGVtLlxuICAgKiBUaGlzIGlzIG9mdGVuIGZvciBjb21taXRzIHRoYXQgZXhwbGljaXRseSBuZWVkIGEgcmUtcmVuZGVyIGJlY2F1c2VcbiAgICogdGhleSB1cGRhdGVkIGFuZCBhcmUgdGhlIHJlYXNvbiBmb3IgdGhlIHJlLXJlbmRlci5cbiAgICovXG4gIG11c3RSZW5kZXI6IFNldDxDb21taXRJRD4gPSBuZXcgU2V0KCk7XG4gIC8qKlxuICAgKiBBIFNldCBvZiBldmVyeSBjb21taXQgdGhhdCBORUVEUyB0byBiZSB2aXNpdGVkLiBOb3JtYWxseSxcbiAgICogd2hlbiBhbiB1cGRhdGUgaXMgcmVxdWVzdGVkIGFsbCB0aGUgdGFyZ2V0J3MgcGFyZW50cyBhcmVcbiAgICogbGFiZWxsZWQgXCJtdXN0VmlzaXRcIiBzbyBhbnkgdXBkYXRlIHRocmVhZCBzaG91bGQgZ2V0IHRvXG4gICAqIHRoZSB0YXJnZXQgZXZlbnR1YWxseS5cbiAgICovXG4gIG11c3RWaXNpdDogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcbiAgXG4gIC8qKlxuICAgKiBBIHN0YWNrIG9mIFwiVXBkYXRlXCIgb2JqZWN0cyByZXByZXNlbnRpbmcgQ29tbWl0cyAob2Z0ZW5cbiAgICogY2hpbGRyZW4gb2YgY29tbWl0cyBqdXN0IHByb2Nlc3NlZClcbiAgICovXG4gIHBlbmRpbmdUYXNrczogV29ya1Rhc2tbXSA9IFtdO1xuXG4gIC8qKiBcbiAgICogV2hlbiBhIGNoYW5nZSBpcyByZXF1ZXN0ZWQgb24gYSB0aHJlYWQsIGJ1dCB0aGUgdGFyZ2V0XG4gICAqIGNvbW1pdCBoYXMgYWxyZWFkeSBiZWVuIFwidmlzaXRlZFwiLCB3ZSBpbnN0ZWFkIHB1dCBpdFxuICAgKiBpbiBvdXQgXCJtaXNzZWRcIiBiYWNrbG9nLlxuICAgKiBcbiAgICogT25jZSBhIHRocmVhZCBoYXMgY29tcGxldGVkIGFsbCBpdCdzIHVwZGF0ZXMsIGl0IG1heVxuICAgKiBzdGFydCBhbiBhZGRpdGlvbmFsIFwicGFzc1wiLCByZXNldHRpbmcgaXRzZWxmIChidXQgbm90IGl0J3MgXCJEZWx0YVNldFwiKVxuICAgKiBhbmQgbG9hZGluZyBpbiBhbGwgdGhlIG1pc3NlZCB0YXJnZXRzIGFzIG5ldyB1cGRhdGVzLlxuICAqL1xuICBtaXNzZWQ6IFNldDxDb21taXRJRD4gPSBuZXcgU2V0KCk7XG5cbiAgdW5tb3VudE1pc3NlZDogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcblxuXG4gIGVycm9yTm90aWZpY2F0aW9uczogTWFwPENvbW1pdElELCBDb21taXRSZWYyPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogQSBsaXN0IG9mIGVhY2ggY29tbWl0IHRoZSB0aHJlYWQgcHJvY2Vzc2VkXG4gICAqL1xuICB2aXNpdGVkOiBTZXQ8Q29tbWl0SUQ+ID0gbmV3IFNldCgpO1xuXG4gIGRlbHRhOiBEZWx0YSA9IG5ldyBEZWx0YSgpO1xuXG4gIGlkID0gY3JlYXRlSWQoXCJUaHJlYWRJRFwiKVxuICBwYXNzZXMgPSAxO1xuXG4gIGNvbnN0cnVjdG9yKHRyZWU6IENvbW1pdFRyZWUyKSB7XG4gICAgdGhpcy50cmVlID0gdHJlZTtcbiAgfVxuXG4gIGdldCBkb25lKCkge1xuICAgIHJldHVybiB0aGlzLnBlbmRpbmdUYXNrcy5sZW5ndGggPT09IDAgJiYgdGhpcy5taXNzZWQuc2l6ZSA9PT0gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgc29tZSB3b3JrIHRvIGJlIGRvbmUgYnkgdGhlIHRocmVhZC5cbiAgICogXG4gICAqIEBwYXJhbSByZWFzb24gXG4gICAqIEByZXR1cm5zIHRydWUgaWYgdGhlIFRocmVhZCBjYW4gYWNjZXB0IHRoZSB3b3JrLCBvciBmYWxzZSBcbiAgICogaWYgdGhlIFRocmVhZCBoYXMgYWxyZWFkeSByZW5kZXJlZCB0aGlzIGVsZW1lbnQgKHlvdVxuICAgKiBoYXZlIHRvIHF1ZXVlIGl0IGluIHRoZSBuZXh0IHRocmVhZClcbiAgICovXG4gIHF1ZXVlKHJlYXNvbjogV29ya1JlYXNvbik6IFF1ZXVlUmVzdWx0IHtcbiAgICAvLyBXZSBhcmUgdmVyeSBsYXp5IGluIHRoaXMgZnVuY3Rpb24gLSAgd2Ugb25seVxuICAgIC8vIHdhbnQgdG8gY3JlYXRlIGEgbmV3IHVwZGF0ZSBhdCB0aGUgd29yc3QgcG9zc2libGVcbiAgICAvLyBjYXNlXG4gICAgdGhpcy5yZWFzb25zLnB1c2gocmVhc29uKTtcblxuICAgIC8vIE1vdW50cyBhcmUgcmVhbGx5IGVhc3kgLSB0aGV5IG5ldmVyIGhhdmUgYW55IGhpc3RvcnksIHNvXG4gICAgLy8gd2UgZG9uJ3QgbmVlZCB0byBjaGVjayBmb3IgY29uZmxpY3RzLlxuICAgIGlmIChyZWFzb24udHlwZSA9PT0gJ21vdW50Jykge1xuICAgICAgdGhpcy5wZW5kaW5nVGFza3MucHVzaChXb3JrVGFzay5mcmVzaChyZWFzb24ucmVmLCByZWFzb24uZWxlbWVudCkpO1xuICAgICAgcmV0dXJuICduZXctdGFzayc7XG4gICAgfVxuICAgIGlmICh0aGlzLnZpc2l0ZWQuaGFzKHJlYXNvbi5yZWYuaWQpKSB7XG4gICAgICBpZiAocmVhc29uLnR5cGUgPT09ICd1bm1vdW50Jykge1xuICAgICAgICB0aGlzLnVubW91bnRNaXNzZWQuYWRkKHJlYXNvbi5yZWYuaWQpO1xuICAgICAgICByZXR1cm4gJ21pc3NlZCdcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0aGlzLm1pc3NlZC5hZGQocmVhc29uLnJlZi5pZCk7XG4gICAgICAgIHJldHVybiAnbWlzc2VkJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgcmVhc29uIGlzIGFscmVhZHkgaW4gdGhlIFwibXVzdFJlbmRlclwiLFxuICAgIC8vIHdlIGFscmVhZHkgaW50ZW5kIHRvIHJlbmRlciBpdCwgc28gZG8gbm90aGluZ1xuICAgIGlmICh0aGlzLm11c3RSZW5kZXIuaGFzKHJlYXNvbi5yZWYuaWQpKVxuICAgICAgcmV0dXJuICdleGlzdGluZy10YXJnZXQnO1xuICAgIHRoaXMubXVzdFJlbmRlci5hZGQocmVhc29uLnJlZi5pZCk7XG5cbiAgICAvLyBTZWFyY2ggdGhyb3VnaCBhbGwgdGhlIHBhcmVudHMsIGxvb2tpbmcgdG8gc2VlIGlmXG4gICAgLy8gdGhlcmUgYXJlIGFueSBwZW5kaW5nVGFza3MgdGhhdCBtaWdodFxuICAgIC8vIGxlYWQgdG8gdGhpcyBjb21taXQuIElmIHNvLCBtYWtlIHN1cmUgYW5jZXN0b3IgY29tbWl0XG4gICAgLy8gaXMgb24gdGhlIE11c3RWaXNpdCBzbyB0aGV5IHNob3VsZCBtYWtlIHRoZWlyIHdheSBkb3duXG4gICAgLy8gZXZlbnR1YWxseVxuICAgIGxldCBhbmNlc3RvcjogQ29tbWl0UmVmMiB8IG51bGwgPSByZWFzb24ucmVmO1xuICAgIHdoaWxlIChhbmNlc3Rvcikge1xuICAgICAgdGhpcy5tdXN0VmlzaXQuYWRkKGFuY2VzdG9yLmlkKTtcblxuICAgICAgLy8gSWYgd2UgZmluZCB0aGVyZSBpcyBhbiBVcGRhdGUgYWxyZWFkeVxuICAgICAgLy8gZXhpc3RpbmcgdG8gaGFuZGxlIG91ciBjb21taXQsIGV4aXQgZWFybHlcbiAgICAgIGZvciAoY29uc3QgdXBkYXRlIG9mIHRoaXMucGVuZGluZ1Rhc2tzKSB7XG4gICAgICAgIGlmICh1cGRhdGUucmVmLmlkID09PSBhbmNlc3Rvci5pZCkge1xuICAgICAgICAgIHJldHVybiAnZXhpc3RpbmctdGFzayc7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGFuY2VzdG9yID0gYW5jZXN0b3IucGFyZW50O1xuICAgIH1cblxuICAgIC8vIFRoZXJlIGFyZSBubyB1cGRhdGVzIChxdWV1ZWQgcGllY2VzIG9mIHdvcmspXG4gICAgLy8gV2UgbmVlZCBhdCBsZWFzdCBvbmUgdG8ga2ljayBvZmYgdGhlIHJlbmRlcmluZyBwcm9jZXNzXG5cbiAgICAvLyBXZSdyZSBnb2luZyB0byBqdXN0IHNraXAgYWxsIHRoZSBwYXJlbnRzIHVwIHVudGlsIHRoZVxuICAgIC8vIHNwZWNpZmljIGNvbW1pdCB3ZSB3YW50IHRvIHJlbmRlclxuICAgIGFuY2VzdG9yID0gcmVhc29uLnJlZjtcbiAgICB3aGlsZSAoYW5jZXN0b3IpIHtcbiAgICAgIGlmIChhbmNlc3Rvci5pZCAhPT0gcmVhc29uLnJlZi5pZClcbiAgICAgICAgdGhpcy52aXNpdGVkLmFkZChhbmNlc3Rvci5pZCk7XG4gICAgICBcbiAgICAgIGFuY2VzdG9yID0gYW5jZXN0b3IucGFyZW50O1xuICAgIH1cblxuICAgIGNvbnN0IHByZXYgPSB0aGlzLnRyZWUuY29tbWl0cy5nZXQocmVhc29uLnJlZi5pZCkgYXMgQ29tbWl0MjtcbiAgICBzd2l0Y2ggKHJlYXNvbi50eXBlKSB7XG4gICAgICBjYXNlICd0YXJnZXQnOlxuICAgICAgICB0aGlzLnBlbmRpbmdUYXNrcy5wdXNoKFdvcmtUYXNrLnZpc2l0KHByZXYpKVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3VubW91bnQnOlxuICAgICAgICB0aGlzLnBlbmRpbmdUYXNrcy5wdXNoKFdvcmtUYXNrLnJlbW92ZShwcmV2KSlcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiAnbmV3LXRhc2snO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gdGhlIHdvcmsgdG8gYWRkIGEgZnJlc2ggY29tbWl0IGludG8gdGhlIHRyZWUsXG4gICAqIGVucXVldWluZyBhZGRpdGlvbmFsIHdvcmsgb250byB0aGUgdGhyZWFkIGlmIHRoZSBjb21taXQgaGFzIGNoaWxkcmVuLlxuICAgKiBcbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdGhhdCB0aGUgY29tbWl0IHdpbGwgaGF2ZS5cbiAgICogQHBhcmFtIHJlZiBUaGUgbG9jYXRpb24gd2hlcmUgdGhlIGNvbW1pdCB3aWxsIGJlIGluc3RhbGxlZC5cbiAgICovXG4gIGNyZWF0ZUNvbW1pdChlbGVtZW50OiBFbGVtZW50LCByZWY6IENvbW1pdFJlZjIpIHtcbiAgICBjb25zdCBvdXRwdXQgPSB0aGlzLnRyZWUucHJvY2Vzc0VsZW1lbnQoZWxlbWVudCwgcmVmLCBudWxsKTtcbiAgICAgICAgXG4gICAgY29uc3QgY29tbWl0ID0gdGhpcy50cmVlLnJlY29uY2lsZXIucG9vbHMuY29tbWl0LmFjcXVpcmUocmVmLCBlbGVtZW50LCBvdXRwdXQuY2hpbGRSZWZzKTtcblxuICAgIHRoaXMudHJlZS5jb21taXRzLnNldChjb21taXQucmVmLmlkLCBjb21taXQpO1xuICAgIHRoaXMuZGVsdGEuYWRkKGNvbW1pdCk7XG4gICAgaWYgKGNvbW1pdC5yZWYubGVuZ3RoID09PSAxKVxuICAgICAgdGhpcy50cmVlLnJvb3RzLmFkZChjb21taXQucmVmLmlkKTtcblxuICAgIGlmIChvdXRwdXQuZWZmZWN0cylcbiAgICAgIHRoaXMuZGVsdGEuYWRkRWZmZWN0cyhvdXRwdXQuZWZmZWN0cyk7XG5cbiAgICB0aGlzLnBlbmRpbmdUYXNrcy5wdXNoKC4uLm91dHB1dC51cGRhdGVzKTtcbiAgfVxuICB1cGRhdGVDb21taXQoY29tbWl0OiBDb21taXQyLCBlbGVtZW50OiBFbGVtZW50LCBtb3ZlZDogYm9vbGVhbikge1xuICAgIGNvbnN0IG91dHB1dCA9IHRoaXMudHJlZS5wcm9jZXNzRWxlbWVudChlbGVtZW50LCBjb21taXQucmVmLCBjb21taXQpO1xuXG4gICAgY29uc3Qgb2xkRWxlbWVudCA9IGNvbW1pdC5lbGVtZW50O1xuICAgIGNvbW1pdC51cGRhdGUoZWxlbWVudCwgb3V0cHV0LmNoaWxkUmVmcyk7XG4gICAgdGhpcy5kZWx0YS51cGRhdGUob2xkRWxlbWVudCwgY29tbWl0LCBtb3ZlZCk7XG5cbiAgICB0aGlzLnBlbmRpbmdUYXNrcy5wdXNoKC4uLm91dHB1dC51cGRhdGVzKTtcbiAgICBpZiAob3V0cHV0LmVmZmVjdHMpXG4gICAgICB0aGlzLmRlbHRhLmFkZEVmZmVjdHMob3V0cHV0LmVmZmVjdHMpO1xuICB9XG4gIHJlbW92ZUNvbW1pdChjb21taXQ6IENvbW1pdDIpIHtcbiAgICBjb25zdCBvdXRwdXQgPSB0aGlzLnRyZWUudW5tb3VudENvbW1pdChjb21taXQpO1xuXG4gICAgdGhpcy50cmVlLmNvbW1pdHMuZGVsZXRlKGNvbW1pdC5yZWYuaWQpO1xuICAgIHRoaXMuZGVsdGEuZGVsZXRlKGNvbW1pdCk7XG4gICAgaWYgKGNvbW1pdC5yZWYubGVuZ3RoID09PSAxKVxuICAgICAgdGhpcy50cmVlLnJvb3RzLmRlbGV0ZShjb21taXQucmVmLmlkKTtcblxuICAgIHRoaXMucGVuZGluZ1Rhc2tzLnB1c2goLi4ub3V0cHV0LnVwZGF0ZXMpO1xuICAgIGlmIChvdXRwdXQuY2xlYW51cHMpXG4gICAgICB0aGlzLmRlbHRhLmFkZEVmZmVjdHMob3V0cHV0LmNsZWFudXBzKTtcbiAgfVxuICBza2lwQ29tbWl0KGNvbW1pdDogQ29tbWl0Mikge1xuICAgIGNvbnN0IHByZXZDaGlsZHJlbiA9IGNvbW1pdC5jaGlsZHJlblxuICAgICAgLm1hcChjID0+IHRoaXMudHJlZS5jb21taXRzLmdldChjLmlkKSBhcyBDb21taXQyKTtcblxuICAgIGNvbnN0IHVwZGF0ZXMgPSBwcmV2Q2hpbGRyZW4ubWFwKHByZXYgPT4gV29ya1Rhc2sudmlzaXQocHJldikpOyAgXG4gICAgdGhpcy5wZW5kaW5nVGFza3MucHVzaCguLi51cGRhdGVzKTtcblxuICAgIGNvbW1pdC51cGRhdGUoKTtcbiAgfVxuXG4gIHZpc2l0KHVwZGF0ZTogV29ya1Rhc2spIHtcbiAgICB0aGlzLnZpc2l0ZWQuYWRkKHVwZGF0ZS5yZWYuaWQpO1xuICAgIFxuICAgIGlmICh1cGRhdGUubmV4dCAmJiAhdXBkYXRlLnByZXYpIHtcbiAgICAgIHRoaXMuY3JlYXRlQ29tbWl0KHVwZGF0ZS5uZXh0LCB1cGRhdGUucmVmKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodXBkYXRlLm5leHQgJiYgdXBkYXRlLnByZXYpIHtcbiAgICAgIHRoaXMudXBkYXRlQ29tbWl0KHVwZGF0ZS5wcmV2LCB1cGRhdGUubmV4dCwgdXBkYXRlLm1vdmVkKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoIXVwZGF0ZS5uZXh0ICYmIHVwZGF0ZS5wcmV2KSB7XG4gICAgICB0aGlzLnJlbW92ZUNvbW1pdCh1cGRhdGUucHJldik7XG4gICAgfVxuICB9XG5cbiAgcHJvY2Vzc1Rhc2sodGFzazogV29ya1Rhc2spIHtcbiAgICBjb25zdCB7IG5leHQsIHByZXYsIHJlZiB9ID0gdGFzaztcblxuICAgIGNvbnN0IGlkZW50aWNhbENoYW5nZSA9IG5leHQgJiYgcHJldiAmJiAobmV4dC5pZCA9PT0gcHJldi5lbGVtZW50LmlkKTtcblxuICAgIGlmIChpZGVudGljYWxDaGFuZ2UpIHtcbiAgICAgIGNvbnN0IG11c3RWaXNpdCA9IHRoaXMubXVzdFZpc2l0LmhhcyhyZWYuaWQpO1xuICAgICAgaWYgKCFtdXN0VmlzaXQpXG4gICAgICAgIHJldHVybjtcblxuICAgICAgY29uc3QgbXVzdFJlbmRlciA9IHRoaXMubXVzdFJlbmRlci5oYXMocmVmLmlkKTtcblxuICAgICAgaWYgKCFtdXN0UmVuZGVyKSB7XG4gICAgICAgIHRoaXMuc2tpcENvbW1pdChwcmV2KVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgdGhpcy52aXNpdCh0YXNrKTtcbiAgfVxuXG4gIHdvcmsoKSB7XG4gICAgY29uc3QgdGFzayA9IHRoaXMucGVuZGluZ1Rhc2tzLnBvcCgpO1xuICAgIGlmICh0YXNrKSB7XG4gICAgICB0aGlzLnByb2Nlc3NUYXNrKHRhc2spO1xuICAgICAgdGFzay5mcmVlKCk7XG4gICAgfSBlbHNlIGlmICghdGhpcy5kb25lKSB7XG4gICAgICB0aGlzLnN0YXJ0TmV4dFBhc3MoKTtcbiAgICB9XG4gIH1cblxuICBzdGFydE5leHRQYXNzKCkge1xuICAgIHRoaXMucGVuZGluZ1Rhc2tzID0gW107XG4gICAgdGhpcy5tdXN0UmVuZGVyLmNsZWFyKCk7XG4gICAgdGhpcy5tdXN0VmlzaXQuY2xlYXIoKTtcbiAgICB0aGlzLnZpc2l0ZWQuY2xlYXIoKTtcblxuICAgIHRoaXMucGFzc2VzKys7XG5cbiAgICBjb25zdCBtaXNzZWRDb21taXQgPSBbLi4udGhpcy5taXNzZWRdXG4gICAgICAubWFwKGlkID0+IHRoaXMudHJlZS5jb21taXRzLmdldChpZCkpXG4gICAgICAuZmlsdGVyKHggPT4gISF4KVxuICAgICAgLnNvcnQoKGEsIGIpID0+IGEucmVmLmxlbmd0aCAtIGIucmVmLmxlbmd0aCk7XG5cbiAgICBjb25zdCB1bm1vdW50aW5nUmVmcyA9IG5ldyBNYXAoWy4uLnRoaXMudW5tb3VudE1pc3NlZF1cbiAgICAgIC5tYXAoaWQgPT4gdGhpcy50cmVlLmNvbW1pdHMuZ2V0KGlkKSlcbiAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXG4gICAgICAubWFwKGMgPT4gW2MucmVmLmlkLCBjLnJlZl0pXG4gICAgKSBcblxuICAgIGZvciAoY29uc3QgY29tbWl0UmVmIG9mIHVubW91bnRpbmdSZWZzLnZhbHVlcygpKSB7XG4gICAgICB0aGlzLnF1ZXVlKHsgdHlwZTogJ3VubW91bnQnLCByZWY6IGNvbW1pdFJlZiB9KTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGNvbW1pdCBvZiBtaXNzZWRDb21taXQpIHtcbiAgICAgIGlmIChjb21taXQucmVmLmZpbmQocmVmID0+IHVubW91bnRpbmdSZWZzLmhhcyhyZWYuaWQpKSlcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIHRoaXMucXVldWUoeyB0eXBlOiAndGFyZ2V0JywgcmVmOiBjb21taXQucmVmIH0pO1xuICAgIH1cbiAgICB0aGlzLm1pc3NlZC5jbGVhcigpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQ29tbWl0SUQsIENvbW1pdFJlZjIgfSBmcm9tIFwiLi9jb21taXQudHNcIjtcbmltcG9ydCB7IE9wYXF1ZUlELCBEZXBzLCBFZmZlY3RDbGVhbnVwLCBDb250ZXh0SUQsIEhvb2tJbXBsZW1lbnRhdGlvbiwgY3JlYXRlSWQsIEJvdW5kYXJ5UHJvcHMgfSBmcm9tICdAbHVrZWthYWxpbS9hY3QnO1xuaW1wb3J0IHsgQ29tbWl0VHJlZTIgfSBmcm9tIFwiLi90cmVlLnRzXCI7XG5cbmV4cG9ydCB0eXBlIEhvb2tJRCA9IG51bWJlcjtcbmV4cG9ydCB0eXBlIEVmZmVjdElEID0gT3BhcXVlSUQ8XCJFZmZlY3RJRFwiPjtcbmV4cG9ydCB0eXBlIEVmZmVjdFRhc2sgPSB7XG4gIHJlZjogQ29tbWl0UmVmMixcbiAgaWQ6IEVmZmVjdElELFxuICBmdW5jOiAoKSA9PiB2b2lkLFxufVxuXG5leHBvcnQgdHlwZSBDb21wb25lbnRTdGF0ZSA9IHtcbiAgcmVmOiBDb21taXRSZWYyO1xuXG4gIHVubW91bnRlZDogYm9vbGVhbixcblxuICBob29rSW5kZXg6IEhvb2tJRCxcbiAgaG9va3M6IG51bGwgfCBIb29rSW1wbGVtZW50YXRpb24sXG4gIGVmZmVjdFRhc2tzOiBudWxsIHwgRWZmZWN0VGFza1tdLFxuXG4gIHZhbHVlczogICBNYXA8SG9va0lELCB1bmtub3duPjtcbiAgZGVwczogICAgIE1hcDxIb29rSUQsIERlcHM+O1xuICBlZmZlY3RzOiAgTWFwPEhvb2tJRCwgRWZmZWN0SUQ+O1xuICBjbGVhbnVwczogIE1hcDxIb29rSUQsIEVmZmVjdENsZWFudXA+O1xuXG4gIHJlamVjdGlvbjogbnVsbCB8IHsgdmFsdWU6IHVua25vd24gfTtcbiAgYm91bmRhcnk6IG51bGwgfCBCb3VuZGFyeVN0YXRlO1xuXG4gIHByb3ZpZGVyczogIE1hcDxIb29rSUQsIG51bGwgfCBDb250ZXh0U3RhdGU8dW5rbm93bj4+O1xufTtcblxuZXhwb3J0IHR5cGUgQ29udGV4dFN0YXRlPFQ+ID0ge1xuICBpZDogQ29tbWl0SUQsXG4gIGNvbnRleHRJZDogQ29udGV4dElELFxuICBjb25zdW1lcnM6IE1hcDxDb21taXRJRCwgQ29tbWl0UmVmMj4sXG4gIHZhbHVlOiBULFxufVxuXG5leHBvcnQgdHlwZSBCb3VuZGFyeUlEID0gT3BhcXVlSUQ8XCJCb3VuZGFyeUlEXCI+O1xuXG5leHBvcnQgY2xhc3MgQm91bmRhcnlTdGF0ZSB7XG4gIHRyZWU6IENvbW1pdFRyZWUyO1xuXG4gIGlkOiBCb3VuZGFyeUlEO1xuICByZWY6IENvbW1pdFJlZjI7XG5cbiAgLyoqXG4gICAqIFdoZW4gdGhlIGJvdW5kYXJ5IGlzIGluIFwiZmFsbGJhY2tcIlxuICAgKiBtb2RlLCB0aGlzIHNob3VsZCByZWZlcmVuY2UgdGhlIGltbWVkaWF0ZVxuICAgKiBmYWxsYmFjayBub2RlIHRoYXQgd2FzIGdlbmVyYXRlZC5cbiAgICovXG4gIGZhbGxiYWNrUmVmOiBudWxsIHwgQ29tbWl0UmVmMiA9IG51bGw7XG5cbiAgdmFsdWVzOiBNYXA8Q29tbWl0SUQsIHVua25vd24+ID0gbmV3IE1hcCgpO1xuXG4gIGdldCBtb2RlKCk6ICdub3JtYWwnIHwgJ2ZhbGxiYWNrJyB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzLnNpemUgPT09IDBcbiAgICAgID8gJ25vcm1hbCdcbiAgICAgIDogJ2ZhbGxiYWNrJ1xuICB9XG5cbiAgY29uc3RydWN0b3IodHJlZTogQ29tbWl0VHJlZTIsIHJlZjogQ29tbWl0UmVmMikge1xuICAgIHRoaXMudHJlZSA9IHRyZWU7XG4gICAgdGhpcy5yZWYgPSByZWY7XG4gICAgdGhpcy5pZCA9IGNyZWF0ZUlkKFwiQm91bmRhcnlJRFwiKTtcbiAgfVxuXG4gIGFkZFRocm93KHJlZjogQ29tbWl0UmVmMiwgdGhyb3duVmFsdWU6IHVua25vd24pIHtcbiAgICBpZiAodGhpcy5tb2RlID09PSAnbm9ybWFsJylcbiAgICAgIHRoaXMudHJlZS5yZWNvbmNpbGVyLnJlbmRlcih0aGlzLnJlZik7XG4gICAgXG4gICAgdGhpcy52YWx1ZXMuc2V0KHJlZi5pZCwgdGhyb3duVmFsdWUpO1xuXG4gICAgY29uc3QgY29tbWl0ID0gdGhpcy50cmVlLmNvbW1pdHMuZ2V0KHRoaXMucmVmLmlkKTtcbiAgICBpZiAoY29tbWl0KSB7XG4gICAgICBjb25zdCBvblRocm93ID0gKGNvbW1pdC5lbGVtZW50LnByb3BzIGFzIEJvdW5kYXJ5UHJvcHMpLm9uVGhyb3c7XG4gICAgICBpZiAob25UaHJvdylcbiAgICAgICAgb25UaHJvdyh0aHJvd25WYWx1ZSwgWy4uLnRoaXMudmFsdWVzLnZhbHVlcygpXSk7XG4gICAgfVxuICB9XG4gIFxuICBjbGVhclRocm93KHJlZjogQ29tbWl0UmVmMikge1xuICAgIHRoaXMudmFsdWVzLmRlbGV0ZShyZWYuaWQpO1xuXG4gICAgaWYgKHRoaXMubW9kZSA9PT0gJ25vcm1hbCcpXG4gICAgICB0aGlzLnRyZWUucmVjb25jaWxlci5yZW5kZXIodGhpcy5yZWYpO1xuXG4gICAgY29uc3QgY29tbWl0ID0gdGhpcy50cmVlLmNvbW1pdHMuZ2V0KHRoaXMucmVmLmlkKTtcbiAgICBpZiAoY29tbWl0KSB7XG4gICAgICBjb25zdCBvbkNsZWFyID0gKGNvbW1pdC5lbGVtZW50LnByb3BzIGFzIEJvdW5kYXJ5UHJvcHMpLm9uQ2xlYXI7XG4gICAgICBpZiAob25DbGVhcilcbiAgICAgICAgb25DbGVhcigpO1xuICAgIH1cbiAgfVxufSIsICJpbXBvcnQgeyBDb250ZXh0SUQsIEVsZW1lbnQsIHNwZWNpYWxOb2RlVHlwZXMgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5pbXBvcnQgeyBDb21taXQyLCBDb21taXRJRCwgQ29tbWl0UmVmMiB9IGZyb20gXCIuL2NvbW1pdC50c1wiO1xuaW1wb3J0IHsgRWxlbWVudE91dHB1dDIgfSBmcm9tIFwiLi9lbGVtZW50LnRzXCI7XG5pbXBvcnQgeyBCb3VuZGFyeVN0YXRlLCBDb21wb25lbnRTdGF0ZSwgQ29udGV4dFN0YXRlLCBFZmZlY3RJRCB9IGZyb20gXCIuL3N0YXRlLnRzXCI7XG5pbXBvcnQgeyBSZWNvbmNpbGVyMiB9IGZyb20gXCIuL3JlY29uY2lsZXIudHNcIjtcbmltcG9ydCB7IGxhc3QgfSBmcm9tIFwiLi9hbGdvcml0aG1zLnRzXCI7XG5cbi8qKlxuICogVGhlIENvbW1pdFRyZWUgaXMgcmVzcG9uc2libGUgZm9yIGtlZXBpbmcgdHJhY2tcbiAqIG9mIGFjdCdzIFwiY2Fub25cIiB1bmRlcnN0YW5kaW5nIG9mIHRoZSBhcHBsaWNhdGlvbiB0cmVlLFxuICogaW5jbHVkaW5nIHJlZmVyZW5jZXMgdG8gYWxsIGxpdmUgY29tbWl0cywgYWxsIGNvbXBvbmVudFxuICogc3RhdGUsIGFsbCBjb250ZXh0IHN0YXRlIGFuZCBzdWNoLlxuICogXG4gKiBUaGUga2V5IG1ldGhvZHMgaGVyZSBhcmUgXCJwcm9jZXNzRWxlbWVudFwiLCB3aGljaFxuICogaXMgdGhlIGdhdGV3YXkgaW50byBnZXR0aW5nIGFuIGVsZW1lbnQgaW50byB0aGUgdHJlZSxcbiAqIGFuZCBcInVubW91bnRDb21taXRcIiwgd2hpY2ggY2xlYXJzIGFsbCB0aGUgcmVmZXJlbmNlc1xuICogZnJvbSBhIHBhcnRpY3VsYXIgY29tbWl0LlxuICogXG4gKiBXaGlsZSBjaGFuZ2VzIGRvbmUgaGVyZSBhcmUgaW1tZWRpYXRlICh5b3UgYWx3YXlzIGdldFxuICogdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHRyZWUpLCB0aGUgcmVuZGVyZXIgd29uJ3Qgc2VlIGFueVxuICogaW50ZXJtZWRpYXRlIHN0YXRlcyAtIHRoZSByZXR1cm4gdmFsdWVzIG9mIFwicHJvY2Vzc1wiIGFuZCBcInVubW91bnRcIlxuICogaXMgbGF0ZXIgYWRkZWQgdG8gdGhlIFdvcmtUaHJlYWQncyBcIkRlbHRhXCIsIHdoaWNoIGlzIHRoZVxuICogYWN0dWFsIHZhbHVlIHBhc3NlcyB0byByZW5kZXJlcnMuXG4gKiBcbiAqIERvbid0IGZvcmdldCAtIGNvbW1pdHMgYXJlIG11dGFibGUhIE9uY2UgeW91IGdldCBhIHJlZmVyZW5jZVxuICogdG8gYSBjb21taXQsIHlvdSBhbHdheXMgaGF2ZSB0aGUgbGF0ZXN0IGNvcHkgb2YgaXQuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21taXRUcmVlMiB7XG4gIHJlY29uY2lsZXI6IFJlY29uY2lsZXIyO1xuXG4gIGNvbXBvbmVudHM6IE1hcDxDb21taXRJRCwgQ29tcG9uZW50U3RhdGU+ID0gbmV3IE1hcCgpO1xuICBjb250ZXh0czogTWFwPENvbW1pdElELCBDb250ZXh0U3RhdGU8dW5rbm93bj4+ID0gbmV3IE1hcCgpO1xuICBib3VuZGFyaWVzOiBNYXA8Q29tbWl0SUQsIEJvdW5kYXJ5U3RhdGU+ID0gbmV3IE1hcCgpO1xuXG4gIGNvbW1pdHM6IE1hcDxDb21taXRJRCwgQ29tbWl0Mj4gPSBuZXcgTWFwKCk7XG4gIHJvb3RzOiBTZXQ8Q29tbWl0SUQ+ID0gbmV3IFNldCgpO1xuXG4gIGNvbnN0cnVjdG9yKHJlY29uY2lsZXI6IFJlY29uY2lsZXIyKSB7XG4gICAgdGhpcy5yZWNvbmNpbGVyID0gcmVjb25jaWxlcjtcbiAgfVxuXG4gIGdldE9yQ3JlYXRlQ29tcG9uZW50U3RhdGUocmVmOiBDb21taXRSZWYyKSB7XG4gICAgbGV0IHN0YXRlID0gdGhpcy5jb21wb25lbnRzLmdldChyZWYuaWQpO1xuICAgIGlmICghc3RhdGUpIHtcbiAgICAgIHN0YXRlID0ge1xuICAgICAgICB1bm1vdW50ZWQ6IGZhbHNlLFxuICAgICAgICByZWYsXG4gICAgICAgIGhvb2tJbmRleDogMCxcbiAgICAgICAgcmVqZWN0aW9uOiBudWxsLFxuICAgICAgICBib3VuZGFyeTogbnVsbCxcbiAgICAgICAgaG9va3M6IG51bGwsXG4gICAgICAgIGVmZmVjdFRhc2tzOiBbXSxcbiAgICAgICAgY2xlYW51cHM6IG5ldyBNYXAoKSxcbiAgICAgICAgcHJvdmlkZXJzOiBuZXcgTWFwKCksXG4gICAgICAgIHZhbHVlczogbmV3IE1hcCgpLFxuICAgICAgICBkZXBzOiBuZXcgTWFwKCksXG4gICAgICAgIGVmZmVjdHM6IG5ldyBNYXAoKSxcbiAgICAgIH1cbiAgICAgIHRoaXMuY29tcG9uZW50cy5zZXQocmVmLmlkLCBzdGF0ZSk7XG4gICAgfVxuICAgIHJldHVybiBzdGF0ZTtcbiAgfVxuXG4gIGdldE9yQ3JlYXRlUHJvdmlkZXJTdGF0ZShyZWY6IENvbW1pdFJlZjIsIGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICBsZXQgc3RhdGUgPSB0aGlzLmNvbnRleHRzLmdldChyZWYuaWQpO1xuICAgIGlmICghc3RhdGUpIHtcbiAgICAgIHN0YXRlID0ge1xuICAgICAgICBpZDogcmVmLmlkLFxuICAgICAgICBjb250ZXh0SWQ6IGVsZW1lbnQucHJvcHMuaWQgYXMgQ29udGV4dElELFxuICAgICAgICB2YWx1ZTogZWxlbWVudC5wcm9wcy52YWx1ZSxcbiAgICAgICAgY29uc3VtZXJzOiBuZXcgTWFwKCksXG4gICAgICB9XG4gICAgICB0aGlzLmNvbnRleHRzLnNldChyZWYuaWQsIHN0YXRlKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0YXRlO1xuICB9XG4gIGdldE9yQ3JlYXRlQm91bmRhcnlTdGF0ZShyZWY6IENvbW1pdFJlZjIpIHtcbiAgICBsZXQgc3RhdGUgPSB0aGlzLmJvdW5kYXJpZXMuZ2V0KHJlZi5pZCk7XG4gICAgaWYgKCFzdGF0ZSkge1xuICAgICAgc3RhdGUgPSBuZXcgQm91bmRhcnlTdGF0ZSh0aGlzLCByZWYpO1xuICAgICAgdGhpcy5ib3VuZGFyaWVzLnNldChyZWYuaWQsIHN0YXRlKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0YXRlO1xuICB9XG5cbiAgZmluZENsb3Nlc3RCb3VuZGFyeShyZWY6IENvbW1pdFJlZjIpIHtcbiAgICBsZXQgYW5jZXN0b3I6IENvbW1pdFJlZjIgfCBudWxsID0gcmVmO1xuICAgIGxldCBsYXN0QW5jZXN0b3I6IENvbW1pdFJlZjIgfCBudWxsID0gbnVsbDtcblxuICAgIHdoaWxlIChhbmNlc3Rvcikge1xuICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzLmJvdW5kYXJpZXMuZ2V0KGFuY2VzdG9yLmlkKTtcbiAgICAgIGlmIChzdGF0ZSkge1xuICAgICAgICBpZiAoc3RhdGUubW9kZSA9PT0gJ2ZhbGxiYWNrJyAmJiBzdGF0ZS5mYWxsYmFja1JlZikge1xuICAgICAgICAgIC8vIG5lZWQgdG8gY2hlY2sgdGhhdCB3ZSBhcmUgbm90IFwiaW5cIiB0aGUgZmFsbGJhY2tcbiAgICAgICAgICBpZiAobGFzdEFuY2VzdG9yICYmIGxhc3RBbmNlc3Rvci5pZCA9PT0gc3RhdGUuZmFsbGJhY2tSZWYuaWQpIHtcbiAgICAgICAgICAgIC8vIHdlIGFyZSBpbiB0aGUgZmFsbGJhY2sgLSBjb250aW51ZSB0byBuZXh0IGFuY2VzdG9yXG4gICAgICAgICAgICBsYXN0QW5jZXN0b3IgPSBhbmNlc3RvcjtcbiAgICAgICAgICAgIGFuY2VzdG9yID0gYW5jZXN0b3IucGFyZW50O1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gb3RoZXJ3aXNlLCB3ZSd2ZSBmb3VuZCBvdXIgY2xvc2VzdCBib3VuZGFyeVxuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICB9XG5cbiAgICAgIGxhc3RBbmNlc3RvciA9IGFuY2VzdG9yO1xuICAgICAgYW5jZXN0b3IgPSBhbmNlc3Rvci5wYXJlbnQ7XG4gICAgfVxuICB9XG5cblxuICB1bm1vdW50Q29tbWl0KHByZXY6IENvbW1pdDIpIHtcbiAgICBjb25zdCBvdXRwdXQgPSBuZXcgRWxlbWVudE91dHB1dDIocHJldi5yZWYpO1xuICAgIG91dHB1dC5wcmV2Q2hpbGRyZW4gPSBwcmV2LmNoaWxkcmVuLm1hcChjID0+IHRoaXMuY29tbWl0cy5nZXQoYy5pZCkgYXMgQ29tbWl0Mik7XG4gIFxuICAgIHN3aXRjaCAodHlwZW9mIHByZXYuZWxlbWVudC50eXBlKSB7XG4gICAgICBjYXNlICdzeW1ib2wnOiB7XG4gICAgICAgIHN3aXRjaCAocHJldi5lbGVtZW50LnR5cGUpIHtcbiAgICAgICAgICBjYXNlIHNwZWNpYWxOb2RlVHlwZXMucHJvdmlkZXI6XG4gICAgICAgICAgICB0aGlzLmNvbnRleHRzLmRlbGV0ZShwcmV2LnJlZi5pZCk7XG4gICAgICAgICAgICAvLyB5b3UgbWlnaHQgdGhpbmsgd2UgaGF2ZSB0byBkbyBzb21lXG4gICAgICAgICAgICAvLyBzcGVjaWFsIGxvZ2ljIGFib3V0IG5vdGlmeWluZyBzdWJzY3JpYmVyc1xuICAgICAgICAgICAgLy8gdGhhdCB0aGUgY29udGV4dCBkaWVkLCBidXQgdGhlIHN1YnNjcmliZXJzIGFyZVxuICAgICAgICAgICAgLy8gYWxzbyBhYm91dCB0byBkaWUgc28gaXRzIG9rIVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBzcGVjaWFsTm9kZVR5cGVzLmJvdW5kYXJ5OlxuICAgICAgICAgICAgdGhpcy5ib3VuZGFyaWVzLmRlbGV0ZShwcmV2LnJlZi5pZCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ2Z1bmN0aW9uJzoge1xuICAgICAgICBjb25zdCBjb21wb25lbnRTdGF0ZSA9IHRoaXMuY29tcG9uZW50cy5nZXQocHJldi5yZWYuaWQpIGFzIENvbXBvbmVudFN0YXRlO1xuICAgICAgICBjb21wb25lbnRTdGF0ZS51bm1vdW50ZWQgPSB0cnVlO1xuICAgICAgICBmb3IgKGNvbnN0IHByb3ZpZGVyIG9mIGNvbXBvbmVudFN0YXRlLnByb3ZpZGVycy52YWx1ZXMoKSkge1xuICAgICAgICAgIGlmIChwcm92aWRlcilcbiAgICAgICAgICAgIHByb3ZpZGVyLmNvbnN1bWVycy5kZWxldGUocHJldi5yZWYuaWQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb21wb25lbnRTdGF0ZS5ib3VuZGFyeSAmJiBjb21wb25lbnRTdGF0ZS5yZWplY3Rpb24pIHtcbiAgICAgICAgICBjb21wb25lbnRTdGF0ZS5ib3VuZGFyeS5jbGVhclRocm93KHByZXYucmVmKTtcbiAgICAgICAgfVxuICAgICAgICBvdXRwdXQuY2xlYW51cHMgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBbaW5kZXgsIGNsZWFudXBdIG9mIGNvbXBvbmVudFN0YXRlLmNsZWFudXBzKSB7XG4gICAgICAgICAgaWYgKCFjbGVhbnVwKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgY29uc3QgaWQgPSBjb21wb25lbnRTdGF0ZS5lZmZlY3RzLmdldChpbmRleCkgYXMgRWZmZWN0SUQ7XG4gICAgICAgICAgb3V0cHV0LmNsZWFudXBzLnB1c2goe1xuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICByZWY6IHByZXYucmVmLFxuICAgICAgICAgICAgZnVuYzogY2xlYW51cFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29tcG9uZW50cy5kZWxldGUocHJldi5yZWYuaWQpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBvdXRwdXQuY2FsY3VsYXRlRGlmZigpO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cblxuICBwcm9jZXNzRWxlbWVudChlbGVtZW50OiBFbGVtZW50LCByZWY6IENvbW1pdFJlZjIsIGNvbW1pdDogKENvbW1pdDIgfCBudWxsKSkge1xuICAgIGNvbnN0IG91dHB1dCA9IG5ldyBFbGVtZW50T3V0cHV0MihyZWYpO1xuXG4gICAgaWYgKGNvbW1pdClcbiAgICAgIG91dHB1dC5wcmV2Q2hpbGRyZW4gPSBjb21taXQuY2hpbGRyZW4ubWFwKGMgPT4gdGhpcy5jb21taXRzLmdldChjLmlkKSBhcyBDb21taXQyKTtcblxuICAgIHN3aXRjaCAodHlwZW9mIGVsZW1lbnQudHlwZSkge1xuICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgb3V0cHV0LnByb2Nlc3NQcmltaXRpdmUoZWxlbWVudCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc3ltYm9sJzoge1xuICAgICAgICBzd2l0Y2ggKGVsZW1lbnQudHlwZSkge1xuICAgICAgICAgIGNhc2Ugc3BlY2lhbE5vZGVUeXBlcy5wcm92aWRlcjoge1xuICAgICAgICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzLmdldE9yQ3JlYXRlUHJvdmlkZXJTdGF0ZShyZWYsIGVsZW1lbnQpO1xuICAgICAgICAgICAgb3V0cHV0LnByb2Nlc3NQcm92aWRlcihlbGVtZW50LCBzdGF0ZSlcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYXNlIHNwZWNpYWxOb2RlVHlwZXMuYm91bmRhcnk6IHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5nZXRPckNyZWF0ZUJvdW5kYXJ5U3RhdGUocmVmKTtcbiAgICAgICAgICAgIG91dHB1dC5wcm9jZXNzQm91bmRhcnkoZWxlbWVudCwgc3RhdGUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNhc2Ugc3BlY2lhbE5vZGVUeXBlcy5yZW5kZXI6XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIG91dHB1dC5wcm9jZXNzUHJpbWl0aXZlKGVsZW1lbnQpXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ2Z1bmN0aW9uJzoge1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHRoaXMuZ2V0T3JDcmVhdGVDb21wb25lbnRTdGF0ZShyZWYpO1xuICAgICAgICBvdXRwdXQucHJvY2Vzc0NvbXBvbmVudChlbGVtZW50LnR5cGUsIGVsZW1lbnQsIHRoaXMsIHN0YXRlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxufVxuXG4iLCAiaW1wb3J0IHsgY29udmVydE5vZGVUb0VsZW1lbnQsIGgsIE5vZGUsIHByaW1pdGl2ZU5vZGVUeXBlcyB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcbmltcG9ydCB7IENvbW1pdDIsIENvbW1pdFJlZjIgfSBmcm9tIFwiLi9jb21taXRcIjtcbmltcG9ydCB7IFdvcmtUaHJlYWQyIH0gZnJvbSBcIi4vdGhyZWFkXCJcbmltcG9ydCB7IENvbW1pdFRyZWUyIH0gZnJvbSBcIi4vdHJlZVwiO1xuaW1wb3J0IHsgU2NoZWR1bGVyIH0gZnJvbSBcIi4vc2NoZWR1bGVyXCI7XG5pbXBvcnQgeyBEZWx0YSB9IGZyb20gXCIuL2RlbHRhXCI7XG5pbXBvcnQgeyBXb3JrVGFzayB9IGZyb20gXCIuL3VwZGF0ZVwiO1xuXG4vKipcbiAqIFRoZSBSZWNvbmNpbGVyIEV2ZW50IEJ1cyBpcyBhIHN0cnVjdHVyZSB0aGF0IGNvbnRhaW5zIGNhbGxiYWNrc1xuICogZm9yIHNwZWNpZmljIHJlY29uY2lsZXIgZXZlbnRzLlxuICogXG4gKiBTeXN0ZW1zIGxpa2UgcmVuZGVyZXJzIG9yIHNwZWNpZmljIGRlYnVnIGludGVyY2VwdG9ycyBzaG91bGRcbiAqIGltcGxlbWVudCB0aGUgYnVzIGZ1bmN0aW9ucywgYW5kIHRoZW4gcGFzcyB0aGVpciBpbnN0YW5jZVxuICogb2YgdGhlIEJ1cyB0byB0aGUgcmVjb25jaWxlci5cbiAqL1xuZXhwb3J0IHR5cGUgUmVjb25jaWxlckV2ZW50QnVzID0ge1xuICByZW5kZXIoZGVsdGE6IERlbHRhKTogdm9pZCxcbn07XG5cbi8qKlxuICogVGhlIFJlY29uY2lsZXIgaXMgdGhlIG1haW4gb2JqZWN0IHRoYXRcbiAqIG93bnMgdGhlIENvbW1pdFRyZWUsIGFuZCBjb29yZGluYXRlcyB3aXRoIGl0J3NcbiAqIHRocmVhZCB0byBwZXJmb3JtIGNoYW5nZXMgcmVxdWVzdGVkIHZpYSBgbW91bnRgIGFuZCBgcmVuZGVyYC5cbiAqIFxuICogVGhlIHJlY29uY2lsZXIsIHVwb24gcmVjZWl2aW5nIHN1Y2ggYSByZXF1ZXN0XG4gKi9cbmV4cG9ydCBjbGFzcyBSZWNvbmNpbGVyMiB7XG4gIHRyZWU6IENvbW1pdFRyZWUyO1xuICBzY2hlZHVsZXI6IFNjaGVkdWxlcjtcblxuICBidXM6IFJlY29uY2lsZXJFdmVudEJ1cyA9IHtcbiAgICByZW5kZXI6ICgpID0+IHt9XG4gIH07XG4gIC8vIGluIHRoZSBmdXR1cmUgLSBtYXliZSBtb3JlIHRoYW4gb25lIHRocmVhZD9cbiAgdGhyZWFkOiBXb3JrVGhyZWFkMjtcblxuICBwb29scyA9IHtcbiAgICBjb21taXQ6IENvbW1pdDIucG9vbCgpLFxuICB9XG5cbiAgY29uc3RydWN0b3Ioc2NoZWR1bGVyOiBTY2hlZHVsZXIpIHtcbiAgICB0aGlzLnNjaGVkdWxlciA9IHNjaGVkdWxlcjtcbiAgICB0aGlzLnRyZWUgPSBuZXcgQ29tbWl0VHJlZTIodGhpcyk7XG4gICAgdGhpcy50aHJlYWQgPSBuZXcgV29ya1RocmVhZDIodGhpcy50cmVlKTtcblxuICAgIHRoaXMuc2NoZWR1bGVyLnNldENhbGxiYWNrRnVuYygoKSA9PiB0aGlzLndvcmsoKSk7XG4gICAgdGhpcy5wb29scy5jb21taXQubWF4U2l6ZSA9IDIwNDhcbiAgfVxuXG4gIHN1Ym1pdFRocmVhZCgpIHtcbiAgICBjb25zdCBjdXJyZW50VGhyZWFkID0gdGhpcy50aHJlYWQ7XG4gICAgLy8gU3RhcnQgYSBuZXcgdGhyZWFkXG4gICAgdGhpcy50aHJlYWQgPSBuZXcgV29ya1RocmVhZDIodGhpcy50cmVlKTtcblxuICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuXG4gICAgLy8gc2VuZCBkZWx0YSByZWFkeVxuICAgIHRoaXMuYnVzLnJlbmRlcihjdXJyZW50VGhyZWFkLmRlbHRhKTtcblxuICAgIC8vIHJ1biBlZmZlY3RzXG4gICAgZm9yIChjb25zdCBjbGVhbnVwIG9mIGN1cnJlbnRUaHJlYWQuZGVsdGEuY2xlYW51cHMudmFsdWVzKCkpXG4gICAgICBjbGVhbnVwLmZ1bmMoKTtcbiAgICBmb3IgKGNvbnN0IGVmZmVjdCBvZiBjdXJyZW50VGhyZWFkLmRlbHRhLmVmZmVjdHMudmFsdWVzKCkpXG4gICAgICBlZmZlY3QuZnVuYygpO1xuXG4gICAgZm9yIChjb25zdCByZW1vdmUgb2YgY3VycmVudFRocmVhZC5kZWx0YS5yZW1vdmVkLnZhbHVlcygpKVxuICAgICAgdGhpcy5wb29scy5jb21taXQucmVsZWFzZShyZW1vdmUpO1xuICB9XG5cbiAgd29yaygpIHtcbiAgICBpZiAoIXRoaXMudGhyZWFkLmRvbmUpIHtcbiAgICAgIC8vIGRvIHNvbWUgd29ya1xuICAgICAgdGhpcy50aHJlYWQud29yaygpO1xuICAgICAgdGhpcy5zY2hlZHVsZXIucmVxdWVzdENhbGxiYWNrKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3VibWl0VGhyZWFkKClcbiAgICB9XG4gIH1cbiAgcnVubmluZyA9IGZhbHNlO1xuXG4gIG1vdW50KG5vZGU6IE5vZGUpOiBDb21taXRSZWYyIHtcbiAgICBjb25zdCBlbGVtZW50ID0gY29udmVydE5vZGVUb0VsZW1lbnQobm9kZSk7XG4gICAgY29uc3QgcmVmID0gQ29tbWl0UmVmMi5mcmVzaChudWxsKTtcbiAgICB0aGlzLnRocmVhZC5xdWV1ZSh7IHR5cGU6ICdtb3VudCcsIHJlZiwgZWxlbWVudCB9KTtcblxuICAgIHRoaXMuc2NoZWR1bGVyLnJlcXVlc3RDYWxsYmFjaygpO1xuICAgIHJldHVybiByZWY7XG4gIH1cbiAgdW5tb3VudChyZWY6IENvbW1pdFJlZjIpIHtcbiAgICB0aGlzLnRocmVhZC5xdWV1ZSh7IHR5cGU6ICd1bm1vdW50JywgcmVmIH0pO1xuXG4gICAgdGhpcy5zY2hlZHVsZXIucmVxdWVzdENhbGxiYWNrKCk7XG4gIH1cbiAgcmVuZGVyKHJlZjogQ29tbWl0UmVmMik6IHZvaWQge1xuICAgIHRoaXMudGhyZWFkLnF1ZXVlKHsgdHlwZTogJ3RhcmdldCcsIHJlZiB9KTtcblxuICAgIHRoaXMuc2NoZWR1bGVyLnJlcXVlc3RDYWxsYmFjaygpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgaCwgTm9kZSB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcbmltcG9ydCB7IGNyZWF0ZVdlYk5vZGVCdWlsZGVyLCBIVE1MIH0gZnJvbSBcIi4vc3BhY2VcIjtcbmltcG9ydCB7IFJlbmRlclNwYWNlMiB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3QtYmFja3N0YWdlXCI7XG5pbXBvcnQgeyBjcmVhdGVET01TY2hlZHVsZXIgfSBmcm9tIFwiLi9zY2hlZHVsZXJcIjtcbmltcG9ydCB7IFJlY29uY2lsZXIyIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdC1yZWNvblwiO1xuXG4vKipcbiAqIEN1c3RvbSBvcHRpb25zIGZvciB3ZWIucmVuZGVyXG4gKi9cbnR5cGUgT3B0aW9ucyA9IHtcbiAgd2luZG93PzogV2luZG93O1xufVxuXG4vKipcbiAqIFJlbmRlciBhIG5vZGUgaW50byB0aGUgcGFnZS5cbiAqIFxuICogXG4gKiBAcGFyYW0gbm9kZSBcbiAqIEBwYXJhbSByb290IFxuICogQHBhcmFtIG9wdGlvbnMgXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGNvbnN0IHJlbmRlciA9IChub2RlOiBOb2RlLCByb290OiBIVE1MRWxlbWVudCwgb3B0aW9uczogT3B0aW9ucyA9IHt9KSA9PiB7XG4gIGNvbnN0IHNjaGVkdWxlciA9IGNyZWF0ZURPTVNjaGVkdWxlcigpO1xuICBjb25zdCByZWNvbmNpbGVyID0gbmV3IFJlY29uY2lsZXIyKHNjaGVkdWxlcik7XG4gIGNvbnN0IHNwYWNlID0gbmV3IFJlbmRlclNwYWNlMihyZWNvbmNpbGVyLnRyZWUsIGNyZWF0ZVdlYk5vZGVCdWlsZGVyKHJvb3QsIG9wdGlvbnMud2luZG93KSk7XG5cbiAgcmVjb25jaWxlci5idXMgPSBzcGFjZS5idXM7XG4gIGNvbnN0IHJlZiA9IHJlY29uY2lsZXIubW91bnQoaChIVE1MLCB7fSwgbm9kZSkpO1xuXG4gIHJldHVybiB7cmVjb25jaWxlciwgc3BhY2UscmVmfTtcbn1cbiIsICJpbXBvcnQge1xuICBjYWxjdWxhdGVEZXBzQ2hhbmdlLFxuICBDb21wb25lbnQsIENvbnRleHQsIGNyZWF0ZUNvbnRleHQsIEVmZmVjdENvbnN0cnVjdG9yLCBoLCBwcmltaXRpdmVOb2RlVHlwZXMsIHJ1blVwZGF0ZXIsIHNwZWNpYWxOb2RlVHlwZXMsIFN0YXRlU2V0dGVyLCBVcGRhdGVyLFxuICB1c2VDb250ZXh0LCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUsIFZhbHVlT3JDYWxjdWxhdG9yXG59IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcblxuaW1wb3J0IHsgQ29tbWl0SUQsIENvbXBvbmVudFN0YXRlLCBIb29rSUQsIHVzZUludGVybmFsQ29tcG9uZW50U3RhdGUgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0LXJlY29uXCI7XG5cbmV4cG9ydCB0eXBlIFNTUkNvbXBvbmVudERhdGEgPSB7XG4gIGlkOiBDb21taXRJRCxcbiAgdmFsdWVzOiBNYXA8SG9va0lELCBKU09OVmFsdWU+LFxuICBkZXBzOiBNYXA8SG9va0lELCBQcmltaXRpdmVKU09OVmFsdWVbXT4sXG59O1xuXG5leHBvcnQgdHlwZSBTU1JDb250ZXh0ID0ge1xuICBjb21wb25lbnRzOiBNYXA8Q29tbWl0SUQsIFNTUkNvbXBvbmVudERhdGE+LFxuICBjb250ZXh0czogTWFwPENvbW1pdElELCBKU09OVmFsdWU+LFxuXG4gIGNvbW1pdHM6IE1hcDxDb21taXRJRCwgRGVoeWRyYXRlZENvbW1pdD4sXG4gIGNvbW1pdElkUmVtYXA6IE1hcDxDb21taXRJRCwgQ29tbWl0SUQ+LFxuXG4gIG1vdW50czogQ29tbWl0SURbXSxcblxuICBjb250ZXh0Q29tbWl0SUQ6IENvbW1pdElEIHwgbnVsbCxcblxuICBtb2RlOiAnc2VydmVyJyB8ICdjbGllbnQnLFxuXG4gIHJlYWR5Rm9yU2VydmVyKCk6IHZvaWRcbn07XG4vLyB0aGUgc2VyaWFsaXphYmxlIGZvcm0gb2YgdGhlIFNTUiBjb250ZXh0XG5leHBvcnQgdHlwZSBTU1JQYXlsb2FkID0ge1xuICBjb250ZXh0Q29tbWl0SUQ6IENvbW1pdElEIHwgbnVsbCxcbiAgY29tbWl0czogRGVoeWRyYXRlZENvbW1pdFtdLFxuICBtb3VudHM6IENvbW1pdElEW10sXG4gIGNvbXBvbmVudHM6IFNTUkNvbXBvbmVudFBheWxvYWRbXSxcbiAgY29udGV4dHM6IFtDb21taXRJRCwgSlNPTlZhbHVlXVtdLFxuICBjb21taXRJZFJlbWFwOiBbQ29tbWl0SUQsIENvbW1pdElEXVtdXG59XG5leHBvcnQgdHlwZSBTU1JDb21wb25lbnRQYXlsb2FkID0ge1xuICBpZDogQ29tbWl0SUQsXG4gIHZhbHVlczogW0hvb2tJRCwgSlNPTlZhbHVlXVtdLFxuICBkZXBzOiBbSG9va0lELCBQcmltaXRpdmVKU09OVmFsdWVbXV1bXSxcbn1cbmV4cG9ydCBjb25zdCBzZXJpYWxpemVTU1JDb250ZXh0ID0gKGNvbnRleHQ6IFNTUkNvbnRleHQpOiBTU1JQYXlsb2FkID0+IHtcbiAgcmV0dXJuIHtcbiAgICBjb250ZXh0Q29tbWl0SUQ6IGNvbnRleHQuY29udGV4dENvbW1pdElELFxuICAgIGNvbW1pdHM6IFsuLi5jb250ZXh0LmNvbW1pdHMudmFsdWVzKCldLFxuICAgIG1vdW50czogY29udGV4dC5tb3VudHMsXG4gICAgY29tbWl0SWRSZW1hcDogWy4uLmNvbnRleHQuY29tbWl0SWRSZW1hcC5lbnRyaWVzKCldLFxuICAgIGNvbXBvbmVudHM6IFsuLi5jb250ZXh0LmNvbXBvbmVudHMudmFsdWVzKCldLm1hcChjb21wb25lbnQgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6IGNvbXBvbmVudC5pZCxcbiAgICAgICAgdmFsdWVzOiBbLi4uY29tcG9uZW50LnZhbHVlcy5lbnRyaWVzKCldLFxuICAgICAgICBkZXBzOiBbLi4uY29tcG9uZW50LmRlcHMuZW50cmllcygpXSxcbiAgICAgIH0gYXMgU1NSQ29tcG9uZW50UGF5bG9hZFxuICAgIH0pLFxuICAgIGNvbnRleHRzOiBbLi4uY29udGV4dC5jb250ZXh0cy5lbnRyaWVzKCldXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGRlc2VyaWFsaXplU1NSUGF5bG9hZCA9IChwYXlsb2FkOiBTU1JQYXlsb2FkLCBtb2RlOiAnc2VydmVyJyB8ICdjbGllbnQnLCByZWFkeUZvclNlcnZlcjogKCkgPT4gdm9pZCk6IFNTUkNvbnRleHQgPT4ge1xuICByZXR1cm4ge1xuICAgIGNvbnRleHRDb21taXRJRDogcGF5bG9hZC5jb250ZXh0Q29tbWl0SUQsXG4gICAgbW9kZSxcbiAgICByZWFkeUZvclNlcnZlcixcbiAgICBjb21taXRJZFJlbWFwOiBuZXcgTWFwKHBheWxvYWQuY29tbWl0SWRSZW1hcCksXG4gICAgY29tbWl0czogbmV3IE1hcChwYXlsb2FkLmNvbW1pdHMubWFwKGMgPT4gW2MuaWQsIGNdKSksXG4gICAgbW91bnRzOiBwYXlsb2FkLm1vdW50cyxcbiAgICBjb21wb25lbnRzOiBuZXcgTWFwKHBheWxvYWQuY29tcG9uZW50cy5tYXAoYyA9PiAoW2MuaWQsIHtcbiAgICAgIGlkOiBjLmlkLFxuICAgICAgdmFsdWVzOiBuZXcgTWFwKGMudmFsdWVzKSxcbiAgICAgIGRlcHM6IG5ldyBNYXAoYy5kZXBzKSxcbiAgICB9IGFzIFNTUkNvbXBvbmVudERhdGFdKSkpLFxuICAgIGNvbnRleHRzOiBuZXcgTWFwKHBheWxvYWQuY29udGV4dHMpXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IFNTUkNvbnRleHQgPSBjcmVhdGVDb250ZXh0PFNTUkNvbnRleHQgfCBudWxsPihudWxsKTtcblxuY29uc3QgdXNlU1NSQ29tcG9uZW50U3RhdGUgPSAoZGF0YTogU1NSQ29udGV4dCwgc3RhdGU6IENvbXBvbmVudFN0YXRlKSA9PiB7XG4gIHJldHVybiB1c2VNZW1vKCgpID0+IHtcbiAgICBsZXQgaWQ6IENvbW1pdElEO1xuICAgIGlmIChkYXRhLm1vZGUgPT09ICdjbGllbnQnKSB7XG4gICAgICBjb25zdCByZW1hcHBlZElkID0gZGF0YS5jb21taXRJZFJlbWFwLmdldChzdGF0ZS5yZWYuaWQpO1xuICAgICAgaWYgKCFyZW1hcHBlZElkKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE1pc3NpbmcgbWFwIGZyb20gU2VydmVyIENvbW1pdElEID0+IENsaWVudCBDb21taXRJRCBmb3IgJHtzdGF0ZS5yZWYuaWR9YCk7XG4gICAgICBpZCA9IHJlbWFwcGVkSWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlkID0gc3RhdGUucmVmLmlkO1xuICAgIH1cblxuICAgIGxldCBzc3JDb21wb25lbnRTdGF0ZSA9IGRhdGEuY29tcG9uZW50cy5nZXQoaWQpO1xuICAgIGlmICghc3NyQ29tcG9uZW50U3RhdGUpIHtcbiAgICAgIHNzckNvbXBvbmVudFN0YXRlID0ge1xuICAgICAgICBpZCxcbiAgICAgICAgdmFsdWVzOiBuZXcgTWFwKCksXG4gICAgICAgIGRlcHM6IG5ldyBNYXAoKSxcbiAgICAgIH1cbiAgICAgIGRhdGEuY29tcG9uZW50cy5zZXQoaWQsIHNzckNvbXBvbmVudFN0YXRlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3NyQ29tcG9uZW50U3RhdGU7XG4gIH0sIFtdKTtcbn1cblxuZXhwb3J0IGNvbnN0IHNzciA9IHtcbiAgdXNlU3RhdGU8VCBleHRlbmRzIEpTT05WYWx1ZT4oaW5pdGlhbFZhbHVlOiBWYWx1ZU9yQ2FsY3VsYXRvcjxUPik6IFt2YWx1ZTogVCwgc2V0dGVyOiBTdGF0ZVNldHRlcjxUPl0ge1xuICAgIGNvbnN0IHN0YXRlID0gdXNlSW50ZXJuYWxDb21wb25lbnRTdGF0ZSgpO1xuICAgIGNvbnN0IHNzckRhdGEgPSBzc3IudXNlU1NSQ29udGV4dCgpO1xuICAgIGNvbnN0IHNzckNvbXBvbmVudFN0YXRlID0gdXNlU1NSQ29tcG9uZW50U3RhdGUoc3NyRGF0YSwgc3RhdGUpO1xuXG4gICAgLy8gdGhpcyB2YWx1ZSB3aWxsIGxpdGVyYWxseSBjaGFuZ2VcbiAgICAvLyBhcyB3ZSBnbyBkb3duIHRoZXNlIG90aGVyIGhvb2tzLFxuICAgIC8vIGJ1dCBzaG91bGQgc3RheSBcInJlbGF0aXZlbHlcIiBzdGFibGVcbiAgICBjb25zdCBob29rSW5kZXggPSBzdGF0ZS5ob29rSW5kZXg7XG5cbiAgICAvLyBJZiB3ZSBhcmUgYSBjbGllbnQsIHRyeSB0byBnZXQgdGhlIHNlcnZlcidzIGNvcHkgb2YgdGhlIHZhbHVlXG4gICAgY29uc3QgaW5pdGlhbFNlcnZlclZhbHVlID0gdXNlTWVtbygoKSA9PiB7XG4gICAgICBpZiAoc3NyRGF0YS5tb2RlID09PSAnc2VydmVyJylcbiAgICAgICAgcmV0dXJuIGluaXRpYWxWYWx1ZTtcblxuICAgICAgaWYgKCFzc3JDb21wb25lbnRTdGF0ZS52YWx1ZXMuaGFzKGhvb2tJbmRleCkpXG4gICAgICAgIHJldHVybiBpbml0aWFsVmFsdWU7XG5cbiAgICAgIHJldHVybiBzc3JDb21wb25lbnRTdGF0ZS52YWx1ZXMuZ2V0KGhvb2tJbmRleCkgYXMgVmFsdWVPckNhbGN1bGF0b3I8VD47XG4gICAgfSwgW10pXG5cbiAgICAvLyBUaGUgaW5uZXIgc2V0U3RhdGVcbiAgICBjb25zdCBbdmFsdWUsIGlubmVyU2V0dGVyXSA9IHVzZVN0YXRlPFQ+KGluaXRpYWxTZXJ2ZXJWYWx1ZSk7XG5cbiAgICBjb25zdCBzZXR0ZXIgPSB1c2VNZW1vKCgpID0+IHtcbiAgICAgIGlmIChzc3JEYXRhLm1vZGUgPT09ICdjbGllbnQnKVxuICAgICAgICByZXR1cm4gaW5uZXJTZXR0ZXI7XG4gICAgICBcbiAgICAgIC8vIGludGVyY2VwdCB1cGRhdGVzIG9uIHNlcnZlciB0byB3cml0ZSB0byBTU1JDb21wb25lbnREYXRhXG4gICAgICByZXR1cm4gKHVwZGF0ZXI6IFVwZGF0ZXI8VD4pID0+IHtcbiAgICAgICAgaW5uZXJTZXR0ZXIocHJldlZhbHVlID0+IHtcbiAgICAgICAgICBjb25zdCBuZXh0VmFsdWUgPSBydW5VcGRhdGVyPFQ+KHByZXZWYWx1ZSwgdXBkYXRlcik7XG4gICAgICAgICAgc3NyQ29tcG9uZW50U3RhdGUudmFsdWVzLnNldChob29rSW5kZXgsIG5leHRWYWx1ZSk7XG4gICAgICAgICAgcmV0dXJuIG5leHRWYWx1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSwgW10pO1xuXG4gICAgcmV0dXJuIFt2YWx1ZSwgc2V0dGVyXVxuICB9LFxuICB1c2VFZmZlY3QoZWZmZWN0OiBFZmZlY3RDb25zdHJ1Y3RvciwgZGVwczogUHJpbWl0aXZlSlNPTlZhbHVlW10pIHtcbiAgICBjb25zdCBsaXZlU3RhdGUgPSB1c2VJbnRlcm5hbENvbXBvbmVudFN0YXRlKCk7XG4gICAgY29uc3Qgc3NyRGF0YSA9IHNzci51c2VTU1JDb250ZXh0KCk7XG4gICAgY29uc3Qgc3NyQ29tcG9uZW50U3RhdGUgPSB1c2VTU1JDb21wb25lbnRTdGF0ZShzc3JEYXRhLCBsaXZlU3RhdGUpO1xuXG4gICAgY29uc3QgaG9va0luZGV4ID0gbGl2ZVN0YXRlLmhvb2tJbmRleDtcblxuICAgIGxldCBmaXJzdFJ1biA9IHVzZVJlZih0cnVlKTtcblxuICAgIHVzZU1lbW8oKCkgPT4ge1xuICAgICAgaWYgKHNzckRhdGEubW9kZSA9PT0gJ2NsaWVudCcpXG4gICAgICAgIHJldHVybjtcblxuICAgICAgLy8gcmVjb3JkIHRoZSBsYXN0IHNlcnZlciBzZXQgb2YgZGVwc1xuICAgICAgc3NyQ29tcG9uZW50U3RhdGUuZGVwcy5zZXQoaG9va0luZGV4LCBkZXBzKTtcbiAgICB9LCBkZXBzKVxuXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgIGlmICghZmlyc3RSdW4uY3VycmVudCB8fCBzc3JEYXRhLm1vZGUgPT09ICdzZXJ2ZXInKVxuICAgICAgICByZXR1cm4gZWZmZWN0KCk7XG5cbiAgICAgIGZpcnN0UnVuLmN1cnJlbnQgPSBmYWxzZTtcblxuICAgICAgLy8gZm9yIHRoZSB2ZXJ5IGZpcnN0IHJ1biBvbiBhIGNsaWVudCwgY2hlY2sgYWdhaW5zdFxuICAgICAgLy8gdGhlIHNlcnZlciBwcm9wcyB0byBzZWUgaWYgd2UgbmVlZCB0byByZS1yZW5kZXJcbiAgICAgIGNvbnN0IHByZXZEZXBzID0gc3NyQ29tcG9uZW50U3RhdGUuZGVwcy5nZXQoaG9va0luZGV4KTtcbiAgICAgIFxuICAgICAgLy8gb25seSBydW4gdGhlIGVmZmVjdCBpZiB0aGUgZGVwcyBjaGFuZ2UgKG9yIGlmIHdlIGRvbid0IGhhdmUgYSBjb3B5IG9mIHBhc3QgZGVwcyBhbnl3YXkpXG4gICAgICBpZiAoIXByZXZEZXBzIHx8IGNhbGN1bGF0ZURlcHNDaGFuZ2UocHJldkRlcHMsIGRlcHMpKSB7XG4gICAgICAgIHJldHVybiBlZmZlY3QoKTtcbiAgICAgIH1cbiAgICB9LCBkZXBzKTtcblxuICB9LFxuICAvLyBUaGlzIG5lZWRzIHNwZWNpYWwgcmVoeWRyYXRpb24gZWZmb3J0cyB0byByZXN0b3JlXG4gIGNyZWF0ZUNvbnRleHQ8VCBleHRlbmRzIEpTT05WYWx1ZT4oZGVmYXVsdFZhbHVlOiBUKTogQ29udGV4dDxUPiB7XG4gICAgY29uc3QgaW5uZXJDb250ZXh0ID0gY3JlYXRlQ29udGV4dChkZWZhdWx0VmFsdWUpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmlubmVyQ29udGV4dCxcbiAgICAgIFByb3ZpZGVyKHsgdmFsdWUsIGNoaWxkcmVuIH0pIHtcbiAgICAgICAgY29uc3QgbGl2ZVN0YXRlID0gdXNlSW50ZXJuYWxDb21wb25lbnRTdGF0ZSgpO1xuICAgICAgICBjb25zdCBzc3JEYXRhID0gc3NyLnVzZVNTUkNvbnRleHQoKTtcblxuICAgICAgICB1c2VNZW1vKCgpID0+IHtcbiAgICAgICAgICBpZiAoc3NyRGF0YS5tb2RlID09PSBcImNsaWVudFwiKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIC8vIHJlY29yZCB0aGUgdmFsdWVcbiAgICAgICAgICBzc3JEYXRhLmNvbnRleHRzLnNldChsaXZlU3RhdGUucmVmLmlkLCB2YWx1ZSk7XG4gICAgICAgIH0sIFt2YWx1ZV0pO1xuXG4gICAgICAgIHJldHVybiBoKHNwZWNpYWxOb2RlVHlwZXMucHJvdmlkZXIsIHsgaWQ6IGlubmVyQ29udGV4dC5pZCwgdmFsdWUgfSwgY2hpbGRyZW4pO1xuICAgICAgfSxcbiAgICB9XG4gIH0sXG4gIHVzZVNTUlJlYWR5KCkge1xuICAgIGNvbnN0IHNzckRhdGEgPSBzc3IudXNlU1NSQ29udGV4dCgpO1xuXG4gICAgcmV0dXJuIHNzckRhdGEucmVhZHlGb3JTZXJ2ZXI7XG4gIH0sXG4gIHVzZVNTUkNvbnRleHQoKSB7XG4gICAgY29uc3Qgc3NyQ29udGV4dCA9IHVzZUNvbnRleHQoU1NSQ29udGV4dCk7XG4gICAgaWYgKCFzc3JDb250ZXh0KVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIFNTUiBCdW5kbGUgQ29udGV4dCEnKVxuICAgIHJldHVybiBzc3JDb250ZXh0O1xuICB9LFxufTtcblxuXG5leHBvcnQgdHlwZSBEZWh5ZHJhdGVkQ29tbWl0ID0ge1xuICBpZDogQ29tbWl0SUQsXG4gIGVsZW1lbnRUeXBlOiBzdHJpbmcsXG4gIHBhcmVudDogQ29tbWl0SUQgfCBudWxsLFxuICBkaXN0YW5jZTogbnVtYmVyLFxuICBrZXk6IHN0cmluZyB8IG51bGwsXG4gIGNoaWxkcmVuOiBDb21taXRJRFtdLFxuICBwcm9wczogW3N0cmluZywgSlNPTlZhbHVlXVtdLFxufVxuXG5leHBvcnQgdHlwZSBEZWh5ZHJhdGVkVHJlZSA9IHtcbiAgY29tbWl0czogRGVoeWRyYXRlZENvbW1pdFtdLFxuICBtb3VudHM6IENvbW1pdElEW10sXG59XG5cbmV4cG9ydCB0eXBlIFByaW1pdGl2ZUpTT05WYWx1ZSA9XG4gIHwgc3RyaW5nXG4gIHwgbnVtYmVyXG4gIHwgYm9vbGVhblxuICB8IG51bGxcblxuZXhwb3J0IHR5cGUgQ29tcG91bmRKU09OVmFsdWUgPVxuICB8IFJlYWRvbmx5QXJyYXk8SlNPTlZhbHVlPlxuICB8IHsgcmVhZG9ubHkgW2tleTogc3RyaW5nXTogSlNPTlZhbHVlIH1cblxuZXhwb3J0IHR5cGUgSlNPTlZhbHVlID1cbiAgfCBQcmltaXRpdmVKU09OVmFsdWVcbiAgfCBDb21wb3VuZEpTT05WYWx1ZTtcblxuZXhwb3J0IHR5cGUgUmVoeWRyYXRhYmxlUHJvcHMgPSB7IFtrZXk6IHN0cmluZ106IEpTT05WYWx1ZSB9O1xuXG5leHBvcnQgdHlwZSBSZWh5ZHJhdGFibGVDb21wb25lbnQgPSBDb21wb25lbnQ8UmVoeWRyYXRhYmxlUHJvcHM+O1xuXG5leHBvcnQgY29uc3Qgc3NyU3RyaW5nVG9TeW1ib2xNYXA6IFJlY29yZDxzdHJpbmcsIHN5bWJvbD4gPSB7XG4gICdwcmltaXRpdmU6c3RyaW5nJzogcHJpbWl0aXZlTm9kZVR5cGVzLnN0cmluZyxcbiAgJ3ByaW1pdGl2ZTpudW1iZXInOiBwcmltaXRpdmVOb2RlVHlwZXMubnVtYmVyLFxuICAncHJpbWl0aXZlOm51bGwnOiBwcmltaXRpdmVOb2RlVHlwZXMubnVsbCxcbiAgJ3ByaW1pdGl2ZTpib29sZWFuJzogcHJpbWl0aXZlTm9kZVR5cGVzLmJvb2xlYW4sXG4gICdwcmltaXRpdmU6YXJyYXknOiBwcmltaXRpdmVOb2RlVHlwZXMuYXJyYXksXG5cblxuICBbcHJpbWl0aXZlTm9kZVR5cGVzLnN0cmluZ106ICAncHJpbWl0aXZlOnN0cmluZycsXG4gIFtwcmltaXRpdmVOb2RlVHlwZXMubnVtYmVyXTogICdwcmltaXRpdmU6bnVtYmVyJyxcbiAgW3ByaW1pdGl2ZU5vZGVUeXBlcy5udWxsXTogICAgJ3ByaW1pdGl2ZTpudWxsJyxcbiAgW3ByaW1pdGl2ZU5vZGVUeXBlcy5ib29sZWFuXTogJ3ByaW1pdGl2ZTpib29sZWFuJyxcbiAgW3ByaW1pdGl2ZU5vZGVUeXBlcy5hcnJheV06ICAgJ3ByaW1pdGl2ZTphcnJheScsXG5cbiAgJ3NwZWNpYWw6cGxhY2Vob2xkZXInOiBzcGVjaWFsTm9kZVR5cGVzLnBsYWNlaG9sZGVyLFxuICAnc3BlY2lhbDpib3VuZGFyeSc6IHNwZWNpYWxOb2RlVHlwZXMuYm91bmRhcnksXG4gICdzcGVjaWFsOmZhbGxiYWNrJzogc3BlY2lhbE5vZGVUeXBlcy5mYWxsYmFjayxcbiAgJ3NwZWNpYWw6cHJvdmlkZXInOiBzcGVjaWFsTm9kZVR5cGVzLnByb3ZpZGVyLFxuICAnc3BlY2lhbDpzdXNwZW5kJzogc3BlY2lhbE5vZGVUeXBlcy5zdXNwZW5kLFxuICAnc3BlY2lhbDpyZW5kZXInOiBzcGVjaWFsTm9kZVR5cGVzLnJlbmRlcixcblxuICBbc3BlY2lhbE5vZGVUeXBlcy5wbGFjZWhvbGRlcl06ICdzcGVjaWFsOnBsYWNlaG9sZGVyJyxcbiAgW3NwZWNpYWxOb2RlVHlwZXMuYm91bmRhcnldOiAnc3BlY2lhbDpib3VuZGFyeScsXG4gIFtzcGVjaWFsTm9kZVR5cGVzLmZhbGxiYWNrXTogJ3NwZWNpYWw6ZmFsbGJhY2snLFxuICBbc3BlY2lhbE5vZGVUeXBlcy5wcm92aWRlcl06ICdzcGVjaWFsOnByb3ZpZGVyJyxcbiAgW3NwZWNpYWxOb2RlVHlwZXMuc3VzcGVuZF06ICdzcGVjaWFsOnN1c3BlbmQnLFxuICBbc3BlY2lhbE5vZGVUeXBlcy5yZW5kZXJdOiAnc3BlY2lhbDpyZW5kZXInLFxufVxuZXhwb3J0IGNvbnN0IHNzclN5bWJvbFRvU3RyaW5nTWFwOiBSZWNvcmQ8c3ltYm9sLCBzdHJpbmc+ID0gT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHNzclN0cmluZ1RvU3ltYm9sTWFwKVxuICAubWFwKChba2V5LCB2YWx1ZV0pID0+IFt2YWx1ZSwga2V5XSkpXG4iLCAiaW1wb3J0IHsgY3JlYXRlSWQsIEVsZW1lbnQsIEVsZW1lbnRUeXBlLCBoLCBwcmltaXRpdmVOb2RlVHlwZXMsIHNwZWNpYWxOb2RlVHlwZXMgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5pbXBvcnQgeyBDb21taXQyLCBDb21taXRJRCwgQ29tbWl0UmVmMiwgUmVjb25jaWxlcjIgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0LXJlY29uXCI7XG5pbXBvcnQgeyBkZXNlcmlhbGl6ZVNTUlBheWxvYWQsIFJlaHlkcmF0YWJsZUNvbXBvbmVudCwgU1NSQ29udGV4dCwgU1NSUGF5bG9hZCwgc3NyU3RyaW5nVG9TeW1ib2xNYXAgfSBmcm9tIFwiLi9zc3JcIjtcbmltcG9ydCB7IFJlbmRlclNwYWNlMiB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3QtYmFja3N0YWdlXCI7XG5pbXBvcnQgeyByZWNvbiB9IGZyb20gXCIuLi90aHJlZS9kZXBzXCI7XG5cblxuZXhwb3J0IGNvbnN0IHJlaHlkcmF0ZSA9IChcbiAgdGFyZ2V0czogeyBba2V5OiBzdHJpbmddOiBSZWh5ZHJhdGFibGVDb21wb25lbnQgfSxcbiAgcmVjb25jaWxlcjogUmVjb25jaWxlcjIsXG4gIHNwYWNlOiBSZW5kZXJTcGFjZTI8SFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50IHwgVGV4dCwgJ3dlYjpodG1sJyB8ICd3ZWI6c3ZnJz4sXG4gIHBheWxvYWQ6IFNTUlBheWxvYWRcbikgPT4ge1xuICBjb25zdCBjb250ZXh0ID0gZGVzZXJpYWxpemVTU1JQYXlsb2FkKHBheWxvYWQsIFwiY2xpZW50XCIsICgpID0+IHt9KTtcblxuICBjb25zdCByZWZzID0gbmV3IE1hcDxDb21taXRJRCwgQ29tbWl0UmVmMj4oKTtcbiAgY29uc3QgZWxlbWVudHMgPSBuZXcgTWFwPENvbW1pdElELCBFbGVtZW50PigpO1xuICBjb25zdCByb290cyA9IFtdIGFzIENvbW1pdFJlZjJbXVxuICBjb25zdCB0YXJnZXRSZWZzID0gW10gYXMgQ29tbWl0UmVmMltdXG5cbiAgZm9yIChjb25zdCBjb21taXQgb2YgY29udGV4dC5jb21taXRzLnZhbHVlcygpKSB7XG4gICAgY29uc3QgcmVmID0gQ29tbWl0UmVmMi5yZWh5ZHJhdGUoY3JlYXRlSWQoXCJDb21taXRJRFwiKSwgY29tbWl0LmRpc3RhbmNlKTtcbiAgICByZWZzLnNldChjb21taXQuaWQsIHJlZik7XG4gICAgY29udGV4dC5jb21taXRJZFJlbWFwLnNldChyZWYuaWQsIGNvbW1pdC5pZCk7XG5cbiAgICBpZiAoY29tbWl0LmVsZW1lbnRUeXBlLnN0YXJ0c1dpdGgoJ3NwZWNpYWw6bW91bnQ6JykpIHtcbiAgICAgIGNvbnN0IHRhcmdldE5hbWUgPSBjb21taXQuZWxlbWVudFR5cGUuc2xpY2UoJ3NwZWNpYWw6bW91bnQ6Jy5sZW5ndGgpO1xuICAgICAgY29uc3QgdGFyZ2V0ID0gdGFyZ2V0c1t0YXJnZXROYW1lXTtcblxuICAgICAgY29uc3QgcHJvcHMgPSBPYmplY3QuZnJvbUVudHJpZXMoY29tbWl0LnByb3BzKTtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBoKHRhcmdldCwgcHJvcHMpO1xuICAgICAgZWxlbWVudHMuc2V0KGNvbW1pdC5pZCwgZWxlbWVudCk7XG5cbiAgICAgIHRhcmdldFJlZnMucHVzaChyZWYpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBlbGVtZW50VHlwZSA9IChzc3JTdHJpbmdUb1N5bWJvbE1hcFtjb21taXQuZWxlbWVudFR5cGVdXG4gICAgICAgIHx8IGNvbW1pdC5lbGVtZW50VHlwZVxuICAgICAgICB8fCBzcGVjaWFsTm9kZVR5cGVzLnBsYWNlaG9sZGVyKSBhcyBzdHJpbmcgfCBzeW1ib2xcblxuICAgICAgc3dpdGNoIChlbGVtZW50VHlwZSkge1xuICAgICAgICBjYXNlIHNwZWNpYWxOb2RlVHlwZXMucHJvdmlkZXI6XG4gICAgICAgICAgaWYgKGNvbW1pdC5pZCA9PT0gY29udGV4dC5jb250ZXh0Q29tbWl0SUQpIHtcbiAgICAgICAgICAgIGVsZW1lbnRzLnNldChjb21taXQuaWQsIGgoc3BlY2lhbE5vZGVUeXBlcy5wcm92aWRlciwgeyBpZDogU1NSQ29udGV4dC5pZCwgdmFsdWU6IGNvbnRleHQgfSkpO1xuICAgICAgICAgICAgcmVjb25jaWxlci50cmVlLmNvbnRleHRzLnNldChyZWYuaWQsIHtcbiAgICAgICAgICAgICAgaWQ6IHJlZi5pZCxcbiAgICAgICAgICAgICAgY29udGV4dElkOiBTU1JDb250ZXh0LmlkLFxuICAgICAgICAgICAgICB2YWx1ZTogY29udGV4dCxcbiAgICAgICAgICAgICAgY29uc3VtZXJzOiBuZXcgTWFwKClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmZyb21FbnRyaWVzKGNvbW1pdC5wcm9wcyk7XG4gICAgICAgICAgZWxlbWVudHMuc2V0KGNvbW1pdC5pZCwgaChlbGVtZW50VHlwZSwgcHJvcHMpKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBwcmltaXRpdmVDb21taXRzOiBDb21taXQyW10gPSBbXVxuXG4gIGZvciAoY29uc3QgZGVoeWRyYXRlZENvbW1pdCBvZiBjb250ZXh0LmNvbW1pdHMudmFsdWVzKCkpIHtcbiAgICBjb25zdCByZWYgPSByZWZzLmdldChkZWh5ZHJhdGVkQ29tbWl0LmlkKSBhcyBDb21taXRSZWYyO1xuICAgIHJlZi5wYXJlbnQgPSAoZGVoeWRyYXRlZENvbW1pdC5wYXJlbnQgJiYgcmVmcy5nZXQoZGVoeWRyYXRlZENvbW1pdC5wYXJlbnQpKSB8fCBudWxsO1xuXG4gICAgY29uc3QgY2hpbGRyZW4gPSBkZWh5ZHJhdGVkQ29tbWl0LmNoaWxkcmVuLm1hcChjID0+IHJlZnMuZ2V0KGMpKS5maWx0ZXIoeCA9PiAhIXgpO1xuICAgIGNvbnN0IGVsZW1lbnQgPSBlbGVtZW50cy5nZXQoZGVoeWRyYXRlZENvbW1pdC5pZCkgYXMgRWxlbWVudDtcbiAgICBlbGVtZW50LmNoaWxkcmVuID0gY2hpbGRyZW4ubWFwKGMgPT4gZWxlbWVudHMuZ2V0KGMuaWQpIGFzIEVsZW1lbnQpXG5cbiAgICBpZiAoIXJlZi5wYXJlbnQpIHtcbiAgICAgIHJvb3RzLnB1c2gocmVmKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb21taXQgPSByZWNvbmNpbGVyLnBvb2xzLmNvbW1pdC5hY3F1aXJlKHJlZixcbiAgICAgIGVsZW1lbnQsXG4gICAgICBjaGlsZHJlblxuICAgICk7XG5cbiAgICBzd2l0Y2ggKGNvbW1pdC5lbGVtZW50LnR5cGUpIHtcbiAgICAgIGNhc2UgcHJpbWl0aXZlTm9kZVR5cGVzLnN0cmluZzpcbiAgICAgIGNhc2UgcHJpbWl0aXZlTm9kZVR5cGVzLmJvb2xlYW46XG4gICAgICBjYXNlIHByaW1pdGl2ZU5vZGVUeXBlcy5udW1iZXI6XG4gICAgICAgIHByaW1pdGl2ZUNvbW1pdHMucHVzaChjb21taXQpO1xuICAgIH1cblxuICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1jb21taXQtaWQ9XCIke2RlaHlkcmF0ZWRDb21taXQuaWR9XCJdYClcbiAgICBpZiAobm9kZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICBzcGFjZS5ub2RlQnlDb21taXQuc2V0KGNvbW1pdC5yZWYuaWQsIG5vZGUpO1xuICAgICAgc3BhY2UuY29tbWl0QnlOb2RlLnNldChub2RlLCBjb21taXQpO1xuICAgIH1cbiAgICBpZiAoY29tbWl0LmVsZW1lbnQudHlwZSA9PT0gc3BlY2lhbE5vZGVUeXBlcy5yZW5kZXIpIHtcbiAgICAgIHNwYWNlLnJvb3RzLnNldChjb21taXQucmVmLmlkLCBjb21taXQpO1xuICAgIH1cblxuICAgIHJlY29uY2lsZXIudHJlZS5jb21taXRzLnNldChjb21taXQucmVmLmlkLCBjb21taXQpXG4gIH1cblxuICBjb25zdCBwcmltaXRpdmVQYXJlbnQgPSBuZXcgTWFwPENvbW1pdElELCBDb21taXQyPigpO1xuXG4gIGZvciAoY29uc3QgcHJpbWl0aXZlQ29tbWl0IG9mIHByaW1pdGl2ZUNvbW1pdHMpIHtcbiAgICBjb25zdCBwYXJlbnQgPSBzcGFjZS5maW5kUGFyZW50KHByaW1pdGl2ZUNvbW1pdC5yZWYpXG4gICAgaWYgKHBhcmVudC5ub2RlICYmIHBhcmVudC5jb21taXQpIHtcbiAgICAgIHByaW1pdGl2ZVBhcmVudC5zZXQocGFyZW50LmNvbW1pdC5yZWYuaWQsIHBhcmVudC5jb21taXQpXG4gICAgfVxuICB9XG5cbiAgZm9yIChjb25zdCBbaWQsIGNvbW1pdF0gb2YgcHJpbWl0aXZlUGFyZW50KSB7XG4gICAgY29uc3Qgbm9kZSA9IHNwYWNlLm5vZGVCeUNvbW1pdC5nZXQoaWQpO1xuICAgIGlmICghbm9kZSlcbiAgICAgIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgdGV4dEVsZW1lbnRzID0gWy4uLm5vZGUuY2hpbGROb2Rlc11cbiAgICAgIC5maWx0ZXIoKHgpOiB4IGlzIFRleHQgPT4geCBpbnN0YW5jZW9mIFRleHQpXG5cbiAgXG4gICAgbGV0IHF1ZXVlID0gWy4uLmNvbW1pdC5jaGlsZHJlbl07XG4gICAgbGV0IGluZGV4ID0gMDtcblxuICAgIGxldCBzdWJqZWN0OiBDb21taXRSZWYyIHwgdW5kZWZpbmVkO1xuICAgIHdoaWxlIChzdWJqZWN0ID0gcXVldWUuc2hpZnQoKSkge1xuICAgICAgY29uc3QgY29tbWl0ID0gcmVjb25jaWxlci50cmVlLmNvbW1pdHMuZ2V0KHN1YmplY3QuaWQpIGFzIENvbW1pdDI7XG4gICAgICBpZiAoc3BhY2Uubm9kZUJ5Q29tbWl0Lmhhcyhjb21taXQucmVmLmlkKSlcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIHN3aXRjaCAoY29tbWl0LmVsZW1lbnQudHlwZSkge1xuICAgICAgICBjYXNlIHByaW1pdGl2ZU5vZGVUeXBlcy5zdHJpbmc6XG4gICAgICAgIGNhc2UgcHJpbWl0aXZlTm9kZVR5cGVzLmJvb2xlYW46XG4gICAgICAgIGNhc2UgcHJpbWl0aXZlTm9kZVR5cGVzLm51bWJlcjpcbiAgICAgICAgICBzcGFjZS5ub2RlQnlDb21taXQuc2V0KGNvbW1pdC5yZWYuaWQsIHRleHRFbGVtZW50c1tpbmRleF0pO1xuICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBxdWV1ZS51bnNoaWZ0KC4uLmNvbW1pdC5jaGlsZHJlbilcbiAgICB9XG4gIH1cblxuICByZWNvbmNpbGVyLmJ1cy5yZW5kZXIgPSAoZGVsdGEpID0+IHtcbiAgICBzcGFjZS5idXMucmVuZGVyKGRlbHRhKVxuICB9O1xuXG4gIGZvciAoY29uc3QgcmVmIG9mIHRhcmdldFJlZnMuc29ydCgobGVmdCwgcmlnaHQpID0+IGxlZnQubGVuZ3RoIC0gcmlnaHQubGVuZ3RoKSkge1xuICAgIHJlY29uY2lsZXIucmVuZGVyKHJlZik7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBoLCB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuaW1wb3J0IHsgdXNlSW50ZXJuYWxDb21wb25lbnRTdGF0ZSB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3QtcmVjb25cIjtcbmltcG9ydCB7IHNzciB9IGZyb20gJ0BsdWtla2FhbGltL2FjdC13ZWInO1xuXG5jb25zdCBDaGlsZENvbXBvbmVudCA9ICgpID0+IHtcbiAgY29uc3QgW2NsaWNrZWQsIHNldENsaWNrZWRdID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IGJhY2tncm91bmQgPSBgaHNsKCR7TWF0aC5yYW5kb20oKSAqIDM2MH1kZWcgIDUwJSA1MCUpYDtcblxuICBmdW5jdGlvbiBvbkNsaWNrKCkge1xuICAgIHNldENsaWNrZWQoYyA9PiBjICsgMSlcbiAgfVxuXG4gIHJldHVybiBoKCdidXR0b24nLCB7IHN0eWxlOiB7IGJhY2tncm91bmQgfSwgb25DbGljayB9LCBgQ2xpY2tlZCAke2NsaWNrZWR9IHRpbWVzIWApXG59XG5cbmV4cG9ydCB0eXBlIEpTT05WYWx1ZSA9XG4gIHwgc3RyaW5nXG4gIHwgbnVtYmVyXG4gIHwgYm9vbGVhblxuICB8IG51bGxcbiAgfCBSZWFkb25seUFycmF5PEpTT05WYWx1ZT5cbiAgfCB7IFtrZXk6IHN0cmluZ106IEpTT05WYWx1ZSB9XG5cbmV4cG9ydCBjb25zdCBBcHAgPSAoKSA9PiB7XG4gIGNvbnN0IFtuYW1lLCBzZXROYW1lXSA9IHNzci51c2VTdGF0ZTxzdHJpbmc+KFwiV29ybGRcIik7XG4gIGNvbnN0IFtiZWVyVHlwZSwgc2V0QmVlclR5cGVdID0gc3NyLnVzZVN0YXRlPCdhbGUnIHwgJ3N0b3V0cyc+KCdhbGUnKTtcbiAgY29uc3QgW2JlZXJzLCBzZXRCZWVyc10gPSBzc3IudXNlU3RhdGU8c3RyaW5nW10+KFtdKTtcblxuICBjb25zdCBkYXRhID0gc3NyLnVzZVNTUkNvbnRleHQoKVxuICBjb25zdCBkYXRhMiA9IHVzZUludGVybmFsQ29tcG9uZW50U3RhdGUoKVxuXG4gIGNvbnN0IHJlYWR5ID0gc3NyLnVzZVNTUlJlYWR5KCk7XG5cbiAgZnVuY3Rpb24gb25JbnB1dCAoZXZlbnQ6IEV2ZW50KSB7XG4gICAgc2V0TmFtZSgoZXZlbnQudGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlKVxuICB9XG4gIGZ1bmN0aW9uIG9uQmVlclR5cGVJbnB1dCAoZXZlbnQ6IEV2ZW50KSB7XG4gICAgc2V0QmVlclR5cGUoKGV2ZW50LnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSBhcyAnYWxlJyB8ICdzdG91dHMnKVxuICB9XG5cbiAgc3NyLnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc29sZS5sb2coYERvd25sb2FkaW5nIGJlZXJzICgke2JlZXJUeXBlfSlgKTtcbiAgICBmZXRjaChgaHR0cHM6Ly9hcGkuc2FtcGxlYXBpcy5jb20vYmVlcnMvJHtiZWVyVHlwZX1gKVxuICAgICAgLnRoZW4ociA9PiByLmpzb24oKSlcbiAgICAgIC50aGVuKChwYXlsb2FkOiB7IG5hbWU6IHN0cmluZyB9W10pID0+IHNldEJlZXJzKHBheWxvYWQubWFwKGQgPT4gZC5uYW1lKSkpXG4gIH0sIFtiZWVyVHlwZV0pXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoYmVlcnMubGVuZ3RoID4gMClcbiAgICAgIHJlYWR5KCk7XG4gIH0sIFtiZWVyc10pXG5cbiAgY29uc3QgW2EsIHNldEFdID0gdXNlU3RhdGUoZmFsc2UpXG5cbiAgcmV0dXJuIGgoJ2FydGljbGUnLCB7fSwgW1xuICAgIGgoJ2gxJywge30sIGEgPyBbJ0hlbGxvLCAnLCBuYW1lXSA6IFsnSGVsbG8sICcsIG5hbWUsIDI0XSksXG4gICAgaCgnYnV0dG9uJywgeyBvbkNsaWNrOiAoKSA9PiBzZXRBKCFhKSB9LCAnYScpLFxuICAgIGgoQ2hpbGRDb21wb25lbnQpLFxuICAgIGgoJ2lucHV0JywgeyB0eXBlOiAndGV4dCcsIHZhbHVlOiBuYW1lLCBvbklucHV0IH0pLFxuICAgIGgoJ3NlbGVjdCcsIHsgb25JbnB1dDogb25CZWVyVHlwZUlucHV0IH0sIFtcbiAgICAgIGgoJ29wdGlvbicsIHsgdmFsdWU6ICdhbGUnLCBzZWxlY3RlZDogJ2FsZScgPT09IGJlZXJUeXBlIH0sIFsnYWxlJ10pLFxuICAgICAgaCgnb3B0aW9uJywgeyB2YWx1ZTogJ3N0b3V0cycsIHNlbGVjdGVkOiAnc3RvdXRzJyA9PT0gYmVlclR5cGUgfSwgJ3N0b3V0cycpLFxuICAgIF0pLFxuICAgIGgoJ29sJywge30sIGJlZXJzLm1hcChiZWVyID0+IGgoJ2xpJywge30sIGJlZXIpKSlcbiAgXSlcbn07XG5cblxuZXhwb3J0IGNvbnN0IEh5ZHJhdGVNYXAgPSB7XG4gIEFwcCxcbiAgLy9DaGlsZENvbXBvbmVudCxcbn0iLCAiLy8gRk5WX1BSSU1FUyBhbmQgRk5WX09GRlNFVFMgZnJvbVxuLy8gaHR0cDovL3d3dy5pc3RoZS5jb20vY2hvbmdvL3RlY2gvY29tcC9mbnYvaW5kZXguaHRtbCNGTlYtcGFyYW1cblxuY29uc3QgRk5WX1BSSU1FUyA9IHtcblx0MzI6IDE2Xzc3N182MTluLFxuXHQ2NDogMV8wOTlfNTExXzYyOF8yMTFuLFxuXHQxMjg6IDMwOV80ODVfMDA5XzgyMV8zNDVfMDY4XzcyNF83ODFfMzcxbixcblx0MjU2OiAzNzRfMTQ0XzQxOV8xNTZfNzExXzE0N18wNjBfMTQzXzMxN18xNzVfMzY4XzQ1M18wMzFfOTE4XzczMV8wMDJfMjExbixcblx0NTEyOiAzNV84MzVfOTE1Xzg3NF84NDRfODY3XzM2OF85MTlfMDc2XzQ4OV8wOTVfMTA4XzQ0OV85NDZfMzI3Xzk1NV83NTRfMzkyXzU1OF8zOTlfODI1XzYxNV80MjBfNjY5XzkzOF84ODJfNTc1XzEyNl8wOTRfMDM5Xzg5Ml8zNDVfNzEzXzg1Ml83NTluLFxuXHQxMDI0OiA1XzAxNl80NTZfNTEwXzExM18xMThfNjU1XzQzNF81OThfODExXzAzNV8yNzhfOTU1XzAzMF83NjVfMzQ1XzQwNF83OTBfNzQ0XzMwM18wMTdfNTIzXzgzMV8xMTJfMDU1XzEwOF8xNDdfNDUxXzUwOV8xNTdfNjkyXzIyMF8yOTVfMzgyXzcxNl8xNjJfNjUxXzg3OF81MjZfODk1XzI0OV8zODVfMjkyXzI5MV84MTZfNTI0XzM3NV8wODNfNzQ2XzY5MV8zNzFfODA0XzA5NF8yNzFfODczXzE2MF80ODRfNzM3Xzk2Nl83MjBfMjYwXzM4OV8yMTdfNjg0XzQ3Nl8xNTdfNDY4XzA4Ml81NzNuLFxufTtcblxuY29uc3QgRk5WX09GRlNFVFMgPSB7XG5cdDMyOiAyXzE2Nl8xMzZfMjYxbixcblx0NjQ6IDE0XzY5NV85ODFfMDM5XzM0Nl82NTZfMDM3bixcblx0MTI4OiAxNDRfMDY2XzI2M18yOTdfNzY5XzgxNV81OTZfNDk1XzYyOV82NjdfMDYyXzM2N182MjluLFxuXHQyNTY6IDEwMF8wMjlfMjU3Xzk1OF8wNTJfNTgwXzkwN18wNzBfOTY4XzYyMF82MjVfNzA0XzgzN18wOTJfNzk2XzAxNF8yNDFfMTkzXzk0NV8yMjVfMjg0XzUwMV83NDFfNDcxXzkyNV81NTduLFxuXHQ1MTI6IDlfNjU5XzMwM18xMjlfNDk2XzY2OV80OThfMDA5XzQzNV80MDBfNzE2XzMxMF80NjZfMDkwXzQxOF83NDVfNjcyXzYzN184OTZfMTA4XzM3NF8zMjlfNDM0XzQ2Ml82NTdfOTk0XzU4Ml85MzJfMTk3XzcxNl80MzhfNDQ5XzgxM18wNTFfODkyXzIwNl81MzlfODA1Xzc4NF80OTVfMzI4XzIzOV8zNDBfMDgzXzg3Nl8xOTFfOTI4XzcwMV81ODNfODY5XzUxN183ODVuLFxuXHQxMDI0OiAxNF8xOTdfNzk1XzA2NF85NDdfNjIxXzA2OF83MjJfMDcwXzY0MV80MDNfMjE4XzMyMF84ODBfNjIyXzc5NV80NDFfOTMzXzk2MF84NzhfNDc0XzkxNF82MTdfNTgyXzcyM18yNTJfMjk2XzczMl8zMDNfNzE3XzcyMl8xNTBfODY0XzA5Nl81MjFfMjAyXzM1NV81NDlfMzY1XzYyOF8xNzRfNjY5XzEwOF81NzFfODE0Xzc2MF80NzFfMDE1XzA3Nl8xNDhfMDI5Xzc1NV85NjlfODA0XzA3N18zMjBfMTU3XzY5Ml80NThfNTYzXzAwM18yMTVfMzA0Xzk1N18xNTBfMTU3XzQwM182NDRfNDYwXzM2M181NTBfNTA1XzQxMl83MTFfMjg1Xzk2Nl8zNjFfNjEwXzI2N184NjhfMDgyXzg5M184MjNfOTYzXzc5MF80MzlfMzM2XzQxMV8wODZfODg0XzU4NF8xMDdfNzM1XzAxMF82NzZfOTE1bixcbn07XG5cbmNvbnN0IGNhY2hlZEVuY29kZXIgPSBuZXcgZ2xvYmFsVGhpcy5UZXh0RW5jb2RlcigpO1xuXG5mdW5jdGlvbiBmbnYxYVVpbnQ4QXJyYXkodWludDhBcnJheSwgc2l6ZSkge1xuXHRjb25zdCBmbnZQcmltZSA9IEZOVl9QUklNRVNbc2l6ZV07XG5cdGxldCBoYXNoID0gRk5WX09GRlNFVFNbc2l6ZV07XG5cblx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vbm8tZm9yLWxvb3AgLS0gVGhpcyBpcyBhIHBlcmZvcm1hbmNlLXNlbnNpdGl2ZSBsb29wXG5cdGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCB1aW50OEFycmF5Lmxlbmd0aDsgaW5kZXgrKykge1xuXHRcdGhhc2ggXj0gQmlnSW50KHVpbnQ4QXJyYXlbaW5kZXhdKTtcblx0XHRoYXNoID0gQmlnSW50LmFzVWludE4oc2l6ZSwgaGFzaCAqIGZudlByaW1lKTtcblx0fVxuXG5cdHJldHVybiBoYXNoO1xufVxuXG5mdW5jdGlvbiBmbnYxYUVuY29kZUludG8oc3RyaW5nLCBzaXplLCB1dGY4QnVmZmVyKSB7XG5cdGlmICh1dGY4QnVmZmVyLmxlbmd0aCA9PT0gMCkge1xuXHRcdHRocm93IG5ldyBFcnJvcignVGhlIGB1dGY4QnVmZmVyYCBvcHRpb24gbXVzdCBoYXZlIGEgbGVuZ3RoIGdyZWF0ZXIgdGhhbiB6ZXJvJyk7XG5cdH1cblxuXHRjb25zdCBmbnZQcmltZSA9IEZOVl9QUklNRVNbc2l6ZV07XG5cdGxldCBoYXNoID0gRk5WX09GRlNFVFNbc2l6ZV07XG5cdGxldCByZW1haW5pbmcgPSBzdHJpbmc7XG5cblx0d2hpbGUgKHJlbWFpbmluZy5sZW5ndGggPiAwKSB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gY2FjaGVkRW5jb2Rlci5lbmNvZGVJbnRvKHJlbWFpbmluZywgdXRmOEJ1ZmZlcik7XG5cdFx0cmVtYWluaW5nID0gcmVtYWluaW5nLnNsaWNlKHJlc3VsdC5yZWFkKTtcblx0XHRmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcmVzdWx0LndyaXR0ZW47IGluZGV4KyspIHtcblx0XHRcdGhhc2ggXj0gQmlnSW50KHV0ZjhCdWZmZXJbaW5kZXhdKTtcblx0XHRcdGhhc2ggPSBCaWdJbnQuYXNVaW50TihzaXplLCBoYXNoICogZm52UHJpbWUpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBoYXNoO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBmbnYxYSh2YWx1ZSwge3NpemUgPSAzMiwgdXRmOEJ1ZmZlcn0gPSB7fSkge1xuXHRpZiAoIUZOVl9QUklNRVNbc2l6ZV0pIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ1RoZSBgc2l6ZWAgb3B0aW9uIG11c3QgYmUgb25lIG9mIDMyLCA2NCwgMTI4LCAyNTYsIDUxMiwgb3IgMTAyNCcpO1xuXHR9XG5cblx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcblx0XHRpZiAodXRmOEJ1ZmZlcikge1xuXHRcdFx0cmV0dXJuIGZudjFhRW5jb2RlSW50byh2YWx1ZSwgc2l6ZSwgdXRmOEJ1ZmZlcik7XG5cdFx0fVxuXG5cdFx0dmFsdWUgPSBjYWNoZWRFbmNvZGVyLmVuY29kZSh2YWx1ZSk7XG5cdH1cblxuXHRyZXR1cm4gZm52MWFVaW50OEFycmF5KHZhbHVlLCBzaXplKTtcbn1cbiIsICJpbXBvcnQgZm52MWEgZnJvbSAnQHNpbmRyZXNvcmh1cy9mbnYxYSc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHN0cmluZ0hhc2goc3RyaW5nKSB7XG5cdHJldHVybiBOdW1iZXIoZm52MWEoc3RyaW5nKSk7XG59XG4iLCAiLmVsZW1lbnRCYXIge1xuICBvdmVyZmxvdzogdmlzaWJsZTtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAgZmxleC1zaHJpbms6IDA7XG4gIHdpZHRoOiBtYXgtY29udGVudDtcbn1cblxuLmVsZW1lbnROYW1lIHtcbiAgZm9udC1mYW1pbHk6IG1vbm9zcGFjZTtcbiAgZGlzcGxheTogaW5saW5lO1xuXG4gIHBhZGRpbmc6IDRweDtcbiAgYm9yZGVyLXJhZGl1czogOHB4O1xuXG4gIG1hcmdpbjogMnB4O1xuXG4gIGJvcmRlcjogMnB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMCk7XG4gIHdoaXRlLXNwYWNlOiBub3dyYXA7XG59XG4uZWxlbWVudE5hbWU6aG92ZXIge1xuICBmb250LXdlaWdodDogYm9sZDtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBib3JkZXI6IDJweCBzb2xpZCB3aGl0ZTtcbn1cblxuLmNvbW1pdCB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIG92ZXJmbG93OiB2aXNpYmxlO1xuICB3aGl0ZS1zcGFjZTogcHJlO1xuICB3aWR0aDogbWF4LWNvbnRlbnQ7XG4gIGZsZXg6IDE7XG59XG5cbi5lbGVtZW50QmFyLnNlbGVjdGVkIC5lbGVtZW50TmFtZSB7XG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xuICB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTtcbn1cblxuLmNvbW1pdExpc3Qge1xuICBmbGV4OiAxO1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBsaXN0LXN0eWxlOiBub25lO1xuICBvdmVyZmxvdzogdmlzaWJsZTtcbiAgd2lkdGg6IG1heC1jb250ZW50O1xuICBnYXA6IDlweDtcbn1cbi5jb21taXRMaXN0LnRvcCB7XG4gIG1hcmdpbjogMDtcbiAgcGFkZGluZzogMDtcblxuICBvdmVyZmxvdzogYXV0bztcbn1cbiIsICIuY29tbWl0QXR0cmlidXRlVGFnIHtcbiAgZGlzcGxheTogaW5saW5lLWZsZXg7XG5cbiAgZ2FwOiA0cHg7XG4gIG1hcmdpbjogYXV0byA0cHg7XG5cbiAgY29sb3I6IHdoaXRlO1xuXG4gIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgcGFkZGluZzogNHB4O1xuXG4gIGZvbnQtZmFtaWx5OiBtb25vc3BhY2U7XG4gIGZvbnQtc2l6ZTogMTJweDtcblxuICBoZWlnaHQ6IDE4cHg7XG59IFxuXG4uY29tbWl0QXR0cmlidXRlVGFnTmFtZSB7XG4gIG1hcmdpbjogYXV0bztcbn1cblxuLmNvbW1pdEF0dHJpYnV0ZVRhZ1ZhbHVlIHtcbiAgbWFyZ2luOiBhdXRvO1xuICBib3JkZXItcmFkaXVzOiA0cHg7XG4gIHBhZGRpbmc6IDJweDtcbiAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XG4gIGNvbG9yOiBibGFjaztcbn0iLCAiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuaW1wb3J0IGNsYXNzZXMgZnJvbSAnLi9BdHRyaWJ1dGVUYWcubW9kdWxlLmNzcyc7XG5pbXBvcnQgc3RyaW5nSGFzaCBmcm9tIFwiQHNpbmRyZXNvcmh1cy9zdHJpbmctaGFzaFwiO1xuaW1wb3J0IHsgaHMgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0LXdlYlwiO1xuXG5leHBvcnQgdHlwZSBDb21taXRBdHRyaWJ1dGVUYWdQcm9wcyA9IHtcbiAgbmFtZTogc3RyaW5nLFxuICB2YWx1ZTogc3RyaW5nLFxufVxuXG5leHBvcnQgY29uc3QgQ29tbWl0QXR0cmlidXRlVGFnOiBDb21wb25lbnQ8Q29tbWl0QXR0cmlidXRlVGFnUHJvcHM+ID0gKHsgbmFtZSwgdmFsdWUgfSkgPT4ge1xuICBjb25zdCBiYWNrZ3JvdW5kID0gYGhzbCgke3N0cmluZ0hhc2gobmFtZSkgJSAzNjB9ZGVnLCA1MCUsIDUwJSlgO1xuICByZXR1cm4gaHMoJ3NwYW4nLCB7IGNsYXNzTmFtZTogY2xhc3Nlcy5jb21taXRBdHRyaWJ1dGVUYWcsIHN0eWxlOiB7IGJhY2tncm91bmQgfSB9LCBbXG4gICAgaHMoJ3NwYW4nLCB7IGNsYXNzTmFtZTogY2xhc3Nlcy5jb21taXRBdHRyaWJ1dGVUYWdOYW1lIH0sIG5hbWUpLFxuICAgIGhzKCdzcGFuJywgeyBjbGFzc05hbWU6IGNsYXNzZXMuY29tbWl0QXR0cmlidXRlVGFnVmFsdWUgfSwgdmFsdWUpLFxuICBdKVxufSIsICJpbXBvcnQgeyBDb21wb25lbnQsIGgsIE5vZGUgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5pbXBvcnQgeyBocyB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3Qtd2ViXCI7XG5pbXBvcnQgc3RyaW5nSGFzaCBmcm9tICdAc2luZHJlc29yaHVzL3N0cmluZy1oYXNoJztcblxuaW1wb3J0IGNsYXNzZXMgZnJvbSAnLi9UcmVlVmlld2VyLm1vZHVsZS5jc3MnO1xuLy9pbXBvcnQgeyBDb21taXRBdHRyaWJ1dGVUYWcgfSBmcm9tIFwiLi9BdHRyaWJ1dGVUYWdcIjtcbmltcG9ydCB7IENvbW1pdFJlcG9ydCwgVHJlZVJlcG9ydCB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3QtZGVidWdcIjtcbmltcG9ydCB7IENvbW1pdElEIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdC1yZWNvblwiO1xuaW1wb3J0IHsgQ29tbWl0QXR0cmlidXRlVGFnIH0gZnJvbSAnLi9BdHRyaWJ1dGVUYWcnO1xuXG5leHBvcnQgdHlwZSBUcmVlVmlld2VyUHJvcHMgPSB7XG4gIC8vY29tbWl0czogTWFwPENvbW1pdElELCBDb21taXRSZXBvcnQ+LFxuICByb290czogQ29tbWl0SURbXSxcblxuICByZW5kZXJDb21taXQ6IChjb21taXRJZDogQ29tbWl0SUQpID0+IE5vZGUsXG59XG5cbmV4cG9ydCBjb25zdCBUcmVlVmlld2VyOiBDb21wb25lbnQ8VHJlZVZpZXdlclByb3BzPiA9ICh7XG4gIC8vY29tbWl0cyxcbiAgcm9vdHMsXG4gIHJlbmRlckNvbW1pdFxufSkgPT4ge1xuICAvL2NvbnN0IHJvb3RDb21taXRzID0gcm9vdHMubWFwKHJvb3QgPT4gY29tbWl0cy5nZXQocm9vdCkpLmZpbHRlcih4ID0+ICEheClcblxuICBjb25zdCBjbGFzc05hbWUgPSBbY2xhc3Nlcy5jb21taXRMaXN0LCBjbGFzc2VzLnRvcF0uam9pbignICcpXG5cbiAgcmV0dXJuIGgoJ29sJywgeyBjbGFzc05hbWUgfSwgcm9vdHMubWFwKHJvb3QgPT5cbiAgICBoKCdsaScsIHsga2V5OiByb290IH0sIHJlbmRlckNvbW1pdChyb290KSkpKTtcbn07XG5cbmV4cG9ydCB0eXBlIENvbW1pdFByZXZpZXdQcm9wcyA9IHtcbiAgY29tbWl0OiBDb21taXRSZXBvcnQsXG5cbiAgYXR0cmlidXRlcz86IFtzdHJpbmcsIHN0cmluZ11bXSxcblxuICBjb2xvcj86IHN0cmluZyxcblxuICBkZXB0aD86IG51bWJlcixcblxuICByZW5kZXJDb21taXQ/OiAoY29tbWl0OiBDb21taXRJRCkgPT4gTm9kZSxcbiAgb25DbGljaz86ICgpID0+IHZvaWQsXG59XG5cbmV4cG9ydCBjb25zdCBDb21taXRQcmV2aWV3OiBDb21wb25lbnQ8Q29tbWl0UHJldmlld1Byb3BzPiA9ICh7XG4gIGNvbW1pdCwgZGVwdGggPSAwLFxuICBhdHRyaWJ1dGVzID0gW10sXG4gIHJlbmRlckNvbW1pdCxcbiAgY29sb3IsXG4gIG9uQ2xpY2ssXG59KSA9PiB7XG4gIGNvbnN0IGJhY2tncm91bmQgPSBgaHNsKCR7KGRlcHRoICogMjIuMykgJSAzNjB9ZGVnLCA1MCUsIDgwJSlgO1xuICBjb25zdCBlbGVtZW50QmFja2dyb3VuZCA9IGNvbG9yIHx8IGBoc2woJHtzdHJpbmdIYXNoKGNvbW1pdC5lbGVtZW50LnR5cGUpICUgMzYwfWRlZywgNjAlLCA4MCUpYDtcbiAgY29uc3QgbGluZUNvbG9yID0gYGhzbCgke3N0cmluZ0hhc2goY29tbWl0LmlkLnRvU3RyaW5nKCkpICUgMzYwfSwgMTAwJSwgMjAlKWBcblxuXG4gIHJldHVybiBocygnZGl2JywgeyBjbGFzc05hbWU6IGNsYXNzZXMuY29tbWl0LCBzdHlsZTogeyBwb3NpdGlvbjogJ3JlbGF0aXZlJyB9LCBpZDogYGNvbW1pdDoke2NvbW1pdC5pZH1gIH0sIFtcbiAgICBjb21taXQuY2hpbGRyZW4ubGVuZ3RoID4gMCAmJlxuICAgICAgaCgnZGl2JywgeyBzdHlsZToge1xuICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgdG9wOiAnNXB4JyxcbiAgICAgICAgaGVpZ2h0OiAnY2FsYygxMDAlIC0gMThweCknLCB3aWR0aDogJzFweCcsIGJhY2tncm91bmQ6IGxpbmVDb2xvciwgdHJhbnNmb3JtOiBgdHJhbnNsYXRlKDIwcHgsIDBweClgXG4gICAgICB9IH0pLFxuXG4gICAgaHMoJ2RpdicsIHsgY2xhc3NOYW1lOiBbY2xhc3Nlcy5lbGVtZW50QmFyXS5qb2luKCcgJyksIHN0eWxlOiB7ICdwb3NpdGlvbic6ICdyZWxhdGl2ZScgfSB9LCBbXG4gICAgICBocygnYnV0dG9uJywgeyBvbkNsaWNrLCBjbGFzc05hbWU6IGNsYXNzZXMuZWxlbWVudE5hbWUsIHN0eWxlOiB7IGJhY2tncm91bmQ6IGVsZW1lbnRCYWNrZ3JvdW5kIH0gfSxcbiAgICAgICAgY29tbWl0LmVsZW1lbnQudHlwZSksXG4gICAgICBoKENvbW1pdEF0dHJpYnV0ZVRhZywgeyBuYW1lOiAnSWQnLCB2YWx1ZTogY29tbWl0LmlkLnRvU3RyaW5nKCkgfSksXG4gICAgICBhdHRyaWJ1dGVzLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4gaChDb21taXRBdHRyaWJ1dGVUYWcsIHsgbmFtZSwgdmFsdWUgfSkpXG4gICAgICAvL2goQ29tbWl0QXR0cmlidXRlVGFnLCB7IG5hbWU6ICdWZXJzaW9uJywgdmFsdWU6IGNvbW1pdC52ZXJzaW9uLnRvU3RyaW5nKCkgfSksXG4gICAgXSksXG5cbiAgICAhIXJlbmRlckNvbW1pdCAmJiBocygnb2wnLCB7IGNsYXNzTmFtZTogY2xhc3Nlcy5jb21taXRMaXN0IH0sIGNvbW1pdC5jaGlsZHJlbi5tYXAoY2hpbGRJZCA9PiBoKCdsaScsIHsga2V5OiBjaGlsZElkLCBzdHlsZTogeyBwb3NpdGlvbjogJ3JlbGF0aXZlJyB9IH0sIFtcbiAgICAgIHJlbmRlckNvbW1pdChjaGlsZElkKSxcbiAgICAgIGgoJ2RpdicsIHsgc3R5bGU6IHtcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICB3aWR0aDogJzI1cHgnLCBoZWlnaHQ6ICcxcHgnLCAnYm9yZGVyLXRvcCc6ICcycHggZG90dGVkIGJsYWNrJywgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgIHRyYW5zZm9ybTogYHRyYW5zbGF0ZSgtMjJweCwgMTVweClgXG4gICAgICB9fSlcbiAgICBdKSkpLFxuICBdKVxufTtcblxuLy8gaChDb21taXRQcmV2aWV3LCB7IGNvbW1pdDogY2hpbGQsIHRyZWUsIGRlcHRoOiBkZXB0aCArIDEsIHNlbGVjdGVkQ29tbWl0cywgb25TZWxlY3RDb21taXQgfSkpKSIsICJpbXBvcnQge1xuICBFbGVtZW50LFxuICBzcGVjaWFsTm9kZVR5cGVzLFxuICBwcmltaXRpdmVOb2RlVHlwZXMsXG59IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcblxuZXhwb3J0IGNvbnN0IGdldEVsZW1lbnROYW1lID0gKGVsZW1lbnQ6IEVsZW1lbnQpID0+IHtcbiAgaWYgKHR5cGVvZiBlbGVtZW50LnR5cGUgPT09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIGA8Y29tcG9uZW50KCR7ZWxlbWVudC50eXBlLm5hbWV9KT5gO1xuICBpZiAodHlwZW9mIGVsZW1lbnQudHlwZSA9PT0gJ3N5bWJvbCcpXG4gICAgc3dpdGNoIChlbGVtZW50LnR5cGUpIHtcbiAgICAgIGNhc2UgcHJpbWl0aXZlTm9kZVR5cGVzLm51bWJlcjpcbiAgICAgICAgcmV0dXJuIGA8bnVtYmVyIHZhbHVlPXske2VsZW1lbnQucHJvcHMudmFsdWV9fT5gXG4gICAgICBjYXNlIHByaW1pdGl2ZU5vZGVUeXBlcy5zdHJpbmc6XG4gICAgICAgIHJldHVybiBgPHN0cmluZyB2YWx1ZT1cIiR7ZWxlbWVudC5wcm9wcy52YWx1ZX1cIj5gXG4gICAgICBjYXNlIHByaW1pdGl2ZU5vZGVUeXBlcy5ib29sZWFuOlxuICAgICAgICByZXR1cm4gYDxib29sZWFuIHZhbHVlPVwiJHtlbGVtZW50LnByb3BzLnZhbHVlfVwiPmBcbiAgICAgIGNhc2UgcHJpbWl0aXZlTm9kZVR5cGVzLmFycmF5OlxuICAgICAgICByZXR1cm4gYDxhcnJheT5gXG4gICAgICBjYXNlIHByaW1pdGl2ZU5vZGVUeXBlcy5udWxsOlxuICAgICAgICByZXR1cm4gYDxudWxsPmBcbiAgICAgIGNhc2Ugc3BlY2lhbE5vZGVUeXBlcy5mYWxsYmFjazpcbiAgICAgICAgcmV0dXJuIGA8ZmFsbGJhY2s+YDtcbiAgICAgIGNhc2Ugc3BlY2lhbE5vZGVUeXBlcy5zdXNwZW5kOlxuICAgICAgICByZXR1cm4gYDxzdXNwZW5kPmA7XG4gICAgICBjYXNlIHNwZWNpYWxOb2RlVHlwZXMucmVuZGVyOlxuICAgICAgICByZXR1cm4gYDxyZW5kZXIgdHlwZT1cIiR7ZWxlbWVudC5wcm9wcy50eXBlfVwiPmA7XG4gICAgICBjYXNlIHNwZWNpYWxOb2RlVHlwZXMucHJvdmlkZXI6XG4gICAgICAgIHJldHVybiBgPGNvbnRleHQgaWQ9XCIke2VsZW1lbnQucHJvcHMuaWR9XCI+YDtcbiAgICAgIGNhc2Ugc3BlY2lhbE5vZGVUeXBlcy5ib3VuZGFyeTpcbiAgICAgICAgcmV0dXJuIGA8Ym91bmRhcnk+YDtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBgPHN5bWJvbD5gXG4gICAgfVxuICBpZiAoZWxlbWVudC50eXBlKVxuICAgIHJldHVybiBgPCR7ZWxlbWVudC50eXBlfT5gO1xuICByZXR1cm4gJzxub25lPic7XG59XG4iLCAiaW1wb3J0IHsgRWxlbWVudCwgRWxlbWVudElELCBPcGFxdWVJRCB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcbmltcG9ydCB7IENvbW1pdDIsIENvbW1pdElELCBDb21taXRUcmVlMiwgQ29tbWl0VmVyc2lvbiwgQ29tcG9uZW50U3RhdGUsIERlbHRhLCBXb3JrUmVhc29uLCBXb3JrVGFzaywgV29ya1RocmVhZDIgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0LXJlY29uXCI7XG5pbXBvcnQgeyBnZXRFbGVtZW50TmFtZSB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbi8qKlxuICogXCJSZXBvcnRzXCIgYXJlIHNlcmlhbGl6ZWQgdmVyc2lvbnMgb2YgdGhlaXIgXCJuYXRpdmVcIlxuICogY291bnRlcnBhcnRzIC0gcmVhZHkgZm9yIHRyYW5zcG9ydCBhY3Jvc3MgcHJvY2Vzcy9jb250ZXh0XG4gKiBib3VuZGFyaWVzLlxuICovXG5cbmV4cG9ydCB0eXBlIFZhbHVlUmVwb3J0ID1cbiAgfCB7IHR5cGU6ICd1bmRlZmluZWQnIH1cbiAgfCB7IHR5cGU6ICdwcmltaXRpdmUnLCB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwgfVxuICB8IHsgdHlwZTogJ2NvbXBsZXgnLCBuYW1lOiBzdHJpbmcgfVxuXG5leHBvcnQgY29uc3QgY3JlYXRlVmFsdWVSZXBvcnQgPSAodmFsdWU6IHVua25vd24pOiBWYWx1ZVJlcG9ydCA9PiB7XG4gIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XG4gICAgY2FzZSAnc3RyaW5nJzpcbiAgICBjYXNlICdudW1iZXInOlxuICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgcmV0dXJuIHsgdHlwZTogJ3ByaW1pdGl2ZScsIHZhbHVlIH07XG4gICAgY2FzZSAnYmlnaW50JzpcbiAgICAgIHJldHVybiB7IHR5cGU6ICdjb21wbGV4JywgbmFtZTogYGJpZ2ludCgke3ZhbHVlLnRvU3RyaW5nKCl9KWAgfVxuICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICBpZiAoIXZhbHVlKVxuICAgICAgICByZXR1cm4geyB0eXBlOiAncHJpbWl0aXZlJywgdmFsdWUgfTtcbiAgICAgIGlmICh2YWx1ZS5jb25zdHJ1Y3RvcilcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogJ2NvbXBsZXgnLCBuYW1lOiB2YWx1ZS5jb25zdHJ1Y3Rvci5uYW1lIH1cbiAgICAgIHJldHVybiB7IHR5cGU6ICdjb21wbGV4JywgbmFtZTogJz8/PycgfVxuICAgIGNhc2UgJ2Z1bmN0aW9uJzpcbiAgICAgIHJldHVybiB7IHR5cGU6ICdjb21wbGV4JywgbmFtZTogYGZ1bmN0aW9uKCR7dmFsdWUubmFtZX0pYCB9O1xuICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICByZXR1cm4geyB0eXBlOiAnY29tcGxleCcsIG5hbWU6IHZhbHVlLmRlc2NyaXB0aW9uID8gYHN5bWJvbCgke3ZhbHVlLmRlc2NyaXB0aW9ufSlgIDogJ3N5bWJvbCcgfVxuICAgIGNhc2UgJ3VuZGVmaW5lZCc6XG4gICAgICByZXR1cm4geyB0eXBlOiAndW5kZWZpbmVkJyB9XG4gIH1cbn07XG5cbmV4cG9ydCB0eXBlIENvbXBvbmVudFN0YXRlUmVwb3J0ID0ge1xuICBzdGF0ZVZhbHVlczogeyBob29rSW5kZXg6IG51bWJlciwgdmFsdWU6IFZhbHVlUmVwb3J0IH1bXVxufVxuXG5leHBvcnQgdHlwZSBDb21taXREZXRhaWxzUmVwb3J0ID0ge1xuICBjb21taXQ6IENvbW1pdFJlcG9ydCxcbiAgcHJvcHM6IFJlY29yZDxzdHJpbmcsIFZhbHVlUmVwb3J0PixcblxuICBjb21wb25lbnQ6IG51bGwgfCBDb21wb25lbnRTdGF0ZVJlcG9ydCxcbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZUNvbW1pdERldGFpbHNSZXBvcnQgPSAoY29tbWl0OiBDb21taXQyLCB0cmVlOiBDb21taXRUcmVlMik6IENvbW1pdERldGFpbHNSZXBvcnQgPT4ge1xuICBjb25zdCBwcm9wczogUmVjb3JkPHN0cmluZywgVmFsdWVSZXBvcnQ+ID0ge307XG5cbiAgZm9yIChjb25zdCBrZXkgaW4gY29tbWl0LmVsZW1lbnQucHJvcHMpIHtcbiAgICBwcm9wc1trZXldID0gY3JlYXRlVmFsdWVSZXBvcnQoY29tbWl0LmVsZW1lbnQucHJvcHNba2V5XSk7XG4gIH1cbiAgY29uc3QgY29tcG9uZW50U3RhdGUgPSB0cmVlLmNvbXBvbmVudHMuZ2V0KGNvbW1pdC5yZWYuaWQpO1xuXG4gIGNvbnN0IGNvbXBvbmVudCA9IGNvbXBvbmVudFN0YXRlICYmIHtcbiAgICBzdGF0ZVZhbHVlczogWy4uLmNvbXBvbmVudFN0YXRlLnZhbHVlcy5lbnRyaWVzKCldLm1hcCgoW2hvb2tJbmRleCwgdmFsdWVdKSA9PiAoe1xuICAgICAgaG9va0luZGV4LFxuICAgICAgdmFsdWU6IGNyZWF0ZVZhbHVlUmVwb3J0KHZhbHVlKSxcbiAgICB9KSlcbiAgfSB8fCBudWxsO1xuXG4gIHJldHVybiB7XG4gICAgY29tbWl0OiBjcmVhdGVDb21taXRSZXBvcnQoY29tbWl0KSxcbiAgICBwcm9wcyxcbiAgICBjb21wb25lbnQsXG4gIH1cbn1cblxuXG5cbmV4cG9ydCB0eXBlIEVsZW1lbnRSZXBvcnQgPSB7XG4gIHR5cGU6IHN0cmluZyxcbiAgLy9wcm9wczogUmVjb3JkPHN0cmluZywgVmFsdWVSZXBvcnQ+LFxuICBpZDogRWxlbWVudElEO1xufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlRWxlbWVudFJlcG9ydCA9IChlbGVtZW50OiBFbGVtZW50KTogRWxlbWVudFJlcG9ydCA9PiB7XG4gIHJldHVybiB7XG4gICAgaWQ6IGVsZW1lbnQuaWQsXG4gICAgLy9wcm9wczogT2JqZWN0LmVudHJpZXMoZWxlbWVudC5wcm9wcykubWFwKChbbmFtZSwgdmFsdWVdKSA9PiBbbmFtZSwgY3JlYXRlVmFsdWVSZXBvcnQodmFsdWUpXSlcbiAgICB0eXBlOiBnZXRFbGVtZW50TmFtZShlbGVtZW50KSxcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBDb21taXRSZXBvcnQgPSB7XG4gIGlkOiBDb21taXRJRCxcbiAgcGFyZW50OiBDb21taXRJRCB8IG51bGwsXG4gIGRpc3RhbmNlOiBudW1iZXIsXG5cbiAgdmVyc2lvbjogQ29tbWl0VmVyc2lvbjtcbiAgZWxlbWVudDogRWxlbWVudFJlcG9ydDtcbiAgY2hpbGRyZW46IENvbW1pdElEW107XG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVDb21taXRSZXBvcnQgPSAoY29tbWl0OiBDb21taXQyKTogQ29tbWl0UmVwb3J0ID0+IHtcbiAgcmV0dXJuIHtcbiAgICBpZDogY29tbWl0LnJlZi5pZCxcbiAgICBwYXJlbnQ6IGNvbW1pdC5yZWYucGFyZW50ID8gY29tbWl0LnJlZi5wYXJlbnQuaWQgOiBudWxsLFxuICAgIGRpc3RhbmNlOiBjb21taXQucmVmLmxlbmd0aCxcblxuICAgIGVsZW1lbnQ6IGNyZWF0ZUVsZW1lbnRSZXBvcnQoY29tbWl0LmVsZW1lbnQpLFxuICAgIHZlcnNpb246IGNvbW1pdC52ZXJzaW9uLFxuICAgIGNoaWxkcmVuOiBjb21taXQuY2hpbGRyZW4ubWFwKGNoaWxkID0+IGNoaWxkLmlkKVxuICB9XG59XG5cblxuZXhwb3J0IHR5cGUgRGVsdGFSZXBvcnQgPSB7XG4gIGNyZWF0ZWQ6IENvbW1pdFJlcG9ydFtdLFxuICByZW1vdmVkOiBDb21taXRSZXBvcnRbXSxcbiAgdXBkYXRlZDogQ29tbWl0UmVwb3J0W11cbn1cbmV4cG9ydCBjb25zdCBjcmVhdGVEZWx0YVJlcG9ydCA9IChkZWx0YTogRGVsdGEpOiBEZWx0YVJlcG9ydCA9PiB7XG4gIGNvbnN0IHJlcG9ydDogRGVsdGFSZXBvcnQgPSB7XG4gICAgY3JlYXRlZDogW10sXG4gICAgcmVtb3ZlZDogW10sXG4gICAgdXBkYXRlZDogW10sXG4gIH1cbiAgZm9yIChjb25zdCBjb21taXQgb2YgZGVsdGEuZnJlc2gudmFsdWVzKCkpXG4gICAgcmVwb3J0LmNyZWF0ZWQucHVzaChjcmVhdGVDb21taXRSZXBvcnQoY29tbWl0KSk7XG4gIGZvciAoY29uc3QgeyBuZXh0IH0gb2YgZGVsdGEuY2hhbmdlZC52YWx1ZXMoKSlcbiAgICByZXBvcnQudXBkYXRlZC5wdXNoKGNyZWF0ZUNvbW1pdFJlcG9ydChuZXh0KSk7XG4gIGZvciAoY29uc3QgY29tbWl0IG9mIGRlbHRhLnJlbW92ZWQudmFsdWVzKCkpXG4gICAgcmVwb3J0LnJlbW92ZWQucHVzaChjcmVhdGVDb21taXRSZXBvcnQoY29tbWl0KSk7XG5cbiAgcmV0dXJuIHJlcG9ydDtcbn1cblxuZXhwb3J0IHR5cGUgV29ya1Rhc2tSZXBvcnQgPSB7XG4gIGVsZW1lbnQ6IG51bGwgfCBFbGVtZW50UmVwb3J0LFxuICBwcmV2OiBudWxsIHwgQ29tbWl0UmVwb3J0LFxuICBtb3ZlZDogYm9vbGVhbixcblxuICBwYXJlbnQ6IG51bGwgfCBDb21taXRJRCxcbiAgaWQ6IENvbW1pdElELFxufVxuZXhwb3J0IGNvbnN0IGNyZWF0ZVdvcmtUYXNrUmVwb3J0ID0gKHRhc2s6IFdvcmtUYXNrKTogV29ya1Rhc2tSZXBvcnQgPT4ge1xuICByZXR1cm4ge1xuICAgIGVsZW1lbnQ6IHRhc2submV4dCAmJiBjcmVhdGVFbGVtZW50UmVwb3J0KHRhc2submV4dCksXG4gICAgcHJldjogdGFzay5wcmV2ICYmIGNyZWF0ZUNvbW1pdFJlcG9ydCh0YXNrLnByZXYpLFxuICAgIG1vdmVkOiB0YXNrLm1vdmVkLFxuXG4gICAgcGFyZW50OiB0YXNrLnJlZi5wYXJlbnQgJiYgdGFzay5yZWYucGFyZW50LmlkLFxuICAgIGlkOiB0YXNrLnJlZi5pZCxcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBUaHJlYWRSZXBvcnQgPSB7XG4gIG1pc3NlZDogQ29tbWl0SURbXSxcbiAgdmlzaXRlZDogQ29tbWl0SURbXSxcbiAgbXVzdFZpc2l0OiBDb21taXRJRFtdLFxuICBtdXN0UmVuZGVyOiBDb21taXRJRFtdLFxuXG4gIHBlbmRpbmdUYXNrczogV29ya1Rhc2tSZXBvcnRbXSxcbiAgcmVhc29uczogV29ya1JlYXNvblJlcG9ydFtdLFxuXG4gIGlkOiBPcGFxdWVJRDxcIlRocmVhZElEXCI+LFxuICBwYXNzZXM6IG51bWJlcixcbiAgZG9uZTogYm9vbGVhbixcbn07XG5cbmV4cG9ydCB0eXBlIFdvcmtSZWFzb25SZXBvcnQgPSB7IHRhcmdldDogQ29tbWl0SUQsIGVsZW1lbnQ6IEVsZW1lbnRSZXBvcnQgfCBudWxsIH07XG5leHBvcnQgY29uc3QgY3JlYXRlV29ya1JlYXNvblJlcG9ydCA9IChyZWFzb246IFdvcmtSZWFzb24pOiBXb3JrUmVhc29uUmVwb3J0ID0+IHtcbiAgaWYgKHJlYXNvbi50eXBlID09PSAnbW91bnQnKVxuICAgIHJldHVybiB7IHRhcmdldDogcmVhc29uLnJlZi5pZCwgZWxlbWVudDogY3JlYXRlRWxlbWVudFJlcG9ydChyZWFzb24uZWxlbWVudCkgfVxuICByZXR1cm4geyB0YXJnZXQ6IHJlYXNvbi5yZWYuaWQsIGVsZW1lbnQ6IG51bGwgfVxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlVGhyZWFkUmVwb3J0ID0gKHRocmVhZDogV29ya1RocmVhZDIpOiBUaHJlYWRSZXBvcnQgPT4ge1xuICByZXR1cm4ge1xuICAgIHZpc2l0ZWQ6IFsuLi50aHJlYWQudmlzaXRlZF0sXG4gICAgbXVzdFZpc2l0OiBbLi4udGhyZWFkLm11c3RWaXNpdF0sXG4gICAgbXVzdFJlbmRlcjogWy4uLnRocmVhZC5tdXN0UmVuZGVyXSxcbiAgICBtaXNzZWQ6IFsuLi50aHJlYWQubWlzc2VkXSxcblxuICAgIHBlbmRpbmdUYXNrczogdGhyZWFkLnBlbmRpbmdUYXNrcy5tYXAoY3JlYXRlV29ya1Rhc2tSZXBvcnQpLFxuICAgIHJlYXNvbnM6IHRocmVhZC5yZWFzb25zLm1hcChjcmVhdGVXb3JrUmVhc29uUmVwb3J0KSxcbiAgICBpZDogdGhyZWFkLmlkLFxuICAgIHBhc3NlczogdGhyZWFkLnBhc3NlcyxcbiAgICBkb25lOiB0aHJlYWQuZG9uZSxcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBUcmVlUmVwb3J0ID0ge1xuICBjb21taXRzOiBDb21taXRSZXBvcnRbXSxcbiAgcm9vdHM6IENvbW1pdElEW11cbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZVRyZWVSZXBvcnQgPSAodHJlZTogQ29tbWl0VHJlZTIpID0+IHtcbiAgY29uc3QgcmVwb3J0OiBUcmVlUmVwb3J0ID0geyBjb21taXRzOiBbXSwgcm9vdHM6IFtdIH07XG5cbiAgZm9yIChjb25zdCBjb21taXQgb2YgdHJlZS5jb21taXRzLnZhbHVlcygpKSB7XG4gICAgcmVwb3J0LmNvbW1pdHMucHVzaChjcmVhdGVDb21taXRSZXBvcnQoY29tbWl0KSk7XG4gIH1cbiAgZm9yIChjb25zdCByb290IG9mIHRyZWUucm9vdHMpIHtcbiAgICByZXBvcnQucm9vdHMucHVzaChyb290KTtcbiAgfVxuXG4gIHJldHVybiByZXBvcnQ7XG59XG5cbmV4cG9ydCBjb25zdCB1cGRhdGVUcmVlUmVwb3J0ID0gKHRyZWU6IFRyZWVSZXBvcnQsIGRlbHRhOiBEZWx0YVJlcG9ydCkgPT4ge1xuICBjb25zdCBjb21taXRzID0gbmV3IE1hcCh0cmVlLmNvbW1pdHMubWFwKGMgPT4gW2MuaWQsIGNdKSk7XG4gIGNvbnN0IHJvb3RzID0gbmV3IFNldCh0cmVlLnJvb3RzKTtcblxuICBmb3IgKGNvbnN0IGNvbW1pdCBvZiBkZWx0YS5jcmVhdGVkLnZhbHVlcygpKSB7XG4gICAgY29tbWl0cy5zZXQoY29tbWl0LmlkLCBjb21taXQpO1xuICAgIGlmIChjb21taXQucGFyZW50ID09PSBudWxsKVxuICAgICAgcm9vdHMuYWRkKGNvbW1pdC5pZCk7XG4gIH1cbiAgZm9yIChjb25zdCBjb21taXQgb2YgZGVsdGEudXBkYXRlZC52YWx1ZXMoKSkge1xuICAgIGNvbW1pdHMuc2V0KGNvbW1pdC5pZCwgY29tbWl0KTtcbiAgfVxuICBmb3IgKGNvbnN0IGNvbW1pdCBvZiBkZWx0YS5yZW1vdmVkLnZhbHVlcygpKSB7XG4gICAgY29tbWl0cy5kZWxldGUoY29tbWl0LmlkKTtcbiAgICBpZiAoY29tbWl0LnBhcmVudCA9PT0gbnVsbClcbiAgICAgIHJvb3RzLmRlbGV0ZShjb21taXQuaWQpO1xuICB9XG5cbiAgdHJlZS5yb290cyA9IFsuLi5yb290c107XG4gIHRyZWUuY29tbWl0cyA9IFsuLi5jb21taXRzLnZhbHVlcygpXVxufVxuXG4iLCAiaW1wb3J0IHsgU2NoZWR1bGVyIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdC1yZWNvblwiO1xuXG5leHBvcnQgdHlwZSBTY2hlZHVsZUV2ZW50QnVzID0ge1xuICBvbkludGVyY2VwdEVuZCgpOiB2b2lkLFxuICBvbkludGVyY2VwdFN0YXJ0KCk6IHZvaWQsXG5cbiAgb25BZnRlckNhbGxiYWNrRXhlY3V0ZSgpOiB2b2lkLFxufVxuXG5leHBvcnQgdHlwZSBTY2hlZHVsZUNvbnRyb2xsZXIgPSB7XG4gIHN0ZXAoc3RyaWRlPzogbnVtYmVyKTogdm9pZCxcbiAgY2FuY2VsSW50ZXJjZXB0KCk6IHZvaWQsXG5cbiAgaW50ZXJjZXB0OiBib29sZWFuLFxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlRGVidWdTY2hlZHVsZXIgPSAoZXZlbnRzOiBTY2hlZHVsZUV2ZW50QnVzLCBzY2hlZHVsZXJOYW1lOiBzdHJpbmcgPSBcIlNjaGVkdWxlclwiKTogU2NoZWR1bGVyICYgeyBjb250cm9sbGVyOiBTY2hlZHVsZUNvbnRyb2xsZXIgfSA9PiAge1xuICBsZXQgY2FsbGJhY2tGdW5jID0gKCkgPT4ge307XG4gIGxldCBwZW5kaW5nX2NhbGxiYWNrID0gZmFsc2U7XG5cbiAgY29uc3QgcnVuID0gKG1heFdvcmsgPSAxMDAwMCkgPT4ge1xuICAgIGxldCB3b3JrQ291bnQgPSAwO1xuICAgIGNvbnN0IHN0YXJ0TWFyayA9IHBlcmZvcm1hbmNlLm1hcmsoYCR7c2NoZWR1bGVyTmFtZX06d29yazpzdGFydGApO1xuXG4gICAgd2hpbGUgKHBlbmRpbmdfY2FsbGJhY2sgJiYgd29ya0NvdW50IDwgbWF4V29yaykge1xuICAgICAgcGVuZGluZ19jYWxsYmFjayA9IGZhbHNlO1xuICAgICAgY2FsbGJhY2tGdW5jKCk7XG4gICAgICBldmVudHMub25BZnRlckNhbGxiYWNrRXhlY3V0ZSgpO1xuICAgICAgd29ya0NvdW50Kys7XG5cbiAgICAgIGlmIChjb250cm9sbGVyLmludGVyY2VwdCA9PT0gdHJ1ZSlcbiAgICAgICAgcmV0dXJuIGV2ZW50cy5vbkludGVyY2VwdFN0YXJ0KCk7XG4gICAgfVxuICAgIGNvbnN0IGVuZE1hcmsgPSBwZXJmb3JtYW5jZS5tYXJrKGAke3NjaGVkdWxlck5hbWV9Ondvcms6ZW5kYCk7XG4gICAgY29uc3QgbWVhc3VyZW1lbnQgPSBwZXJmb3JtYW5jZS5tZWFzdXJlKGAke3NjaGVkdWxlck5hbWV9OndvcmsoJHt3b3JrQ291bnR9KWAsIHN0YXJ0TWFyay5uYW1lLCBlbmRNYXJrLm5hbWUpO1xuICAgIFxuICAgIGlmIChwZW5kaW5nX2NhbGxiYWNrKSB7XG4gICAgICB0aW1lb3V0SWQgPSB3aW5kb3cuc2V0VGltZW91dChvblRpbWVvdXQsIDApO1xuICAgIH0gZWxzZVxuICAgICAgdGltZW91dElkID0gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGNvbnRyb2xsZXI6IFNjaGVkdWxlQ29udHJvbGxlciA9IHtcbiAgICBpbnRlcmNlcHQ6IGZhbHNlLFxuICAgIGNhbmNlbEludGVyY2VwdCgpIHtcbiAgICAgIGNvbnRyb2xsZXIuaW50ZXJjZXB0ID0gZmFsc2U7XG4gICAgICBldmVudHMub25JbnRlcmNlcHRFbmQoKTtcbiAgICAgIHJ1bigpO1xuICAgIH0sXG4gICAgc3RlcChzdHJpZGUgPSAxKSB7XG4gICAgICBydW4oc3RyaWRlKTtcbiAgICAgIGlmICghcGVuZGluZ19jYWxsYmFjaykge1xuICAgICAgICBldmVudHMub25JbnRlcmNlcHRFbmQoKTtcbiAgICAgICAgdGltZW91dElkID0gbnVsbDtcbiAgICAgIH1cbiAgICB9LFxuICB9XG4gIGNvbnN0IG9uVGltZW91dCA9ICgpID0+IHtcbiAgICBpZiAoY29udHJvbGxlci5pbnRlcmNlcHQpIHtcbiAgICAgIGV2ZW50cy5vbkludGVyY2VwdFN0YXJ0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJ1bigpO1xuICAgIH1cbiAgfVxuXG4gIGxldCB0aW1lb3V0SWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gIHJldHVybiB7XG4gICAgY29udHJvbGxlcixcbiAgICBzZXRDYWxsYmFja0Z1bmMoY2FsbGJhY2spIHtcbiAgICAgIGNhbGxiYWNrRnVuYyA9IGNhbGxiYWNrO1xuICAgIH0sXG4gICAgcmVxdWVzdENhbGxiYWNrKCkge1xuICAgICAgcGVuZGluZ19jYWxsYmFjayA9IHRydWU7XG5cbiAgICAgIGlmICghdGltZW91dElkKVxuICAgICAgICB0aW1lb3V0SWQgPSB3aW5kb3cuc2V0VGltZW91dChvblRpbWVvdXQsIDApO1xuICAgIH0sXG4gICAgY2FuY2VsQ2FsbGJhY2soKSB7XG4gICAgICBwZW5kaW5nX2NhbGxiYWNrID0gZmFsc2U7XG4gICAgICBpZiAodGltZW91dElkKSB7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGltZW91dElkKVxuICAgICAgICB0aW1lb3V0SWQgPSBudWxsO1xuICAgICAgfVxuICAgIH0sXG4gICAgaXNDYWxsYmFja1BlbmRpbmcoKSB7XG4gICAgICByZXR1cm4gcGVuZGluZ19jYWxsYmFjaztcbiAgICB9LFxuICB9XG59OyIsICJpbXBvcnQgeyBDb21taXRJRCwgQ29tbWl0UmVmMiwgQ29tbWl0VHJlZTIsIFF1ZXVlUmVzdWx0LCBSZWNvbmNpbGVyMiwgU2NoZWR1bGVyLCBXb3JrUmVhc29uLCBXb3JrVGhyZWFkMiB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3QtcmVjb25cIjtcbmltcG9ydCB7IGNyZWF0ZURlYnVnU2NoZWR1bGVyLCBTY2hlZHVsZUNvbnRyb2xsZXIsIFNjaGVkdWxlRXZlbnRCdXMgfSBmcm9tIFwiLi9zY2hlZHVsZXJcIjtcbmltcG9ydCB7IENvbW1pdERldGFpbHNSZXBvcnQsIGNyZWF0ZUNvbW1pdERldGFpbHNSZXBvcnQsIGNyZWF0ZURlbHRhUmVwb3J0LCBjcmVhdGVUaHJlYWRSZXBvcnQsIGNyZWF0ZVRyZWVSZXBvcnQsIGNyZWF0ZVdvcmtSZWFzb25SZXBvcnQsIGNyZWF0ZVdvcmtUYXNrUmVwb3J0LCBEZWx0YVJlcG9ydCwgVGhyZWFkUmVwb3J0LCBUcmVlUmVwb3J0LCBXb3JrUmVhc29uUmVwb3J0LCBXb3JrVGFza1JlcG9ydCB9IGZyb20gXCIuL3JlcG9ydFwiO1xuaW1wb3J0IHsgTm9kZSB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcblxuZXhwb3J0IHR5cGUgUmVjb25jaWxlckRlYnVnRXZlbnRCdXMgPSB7XG4gIHNjaGVkdWxlcjogU2NoZWR1bGVFdmVudEJ1cyxcbiAgdGhyZWFkOiBEZWJ1Z1dvcmtUaHJlYWRFdmVudEJ1cyxcblxuICBleHRlcm5hbFVwZGF0ZSgpOiB2b2lkLFxuICBvblRocmVhZERvbmUodGhyZWFkOiBUaHJlYWRSZXBvcnQsIGRlbHRhOiBEZWx0YVJlcG9ydCk6IHZvaWQsXG59O1xuZXhwb3J0IHR5cGUgUmVjb25jaWxlckRlYnVnQ29udHJvbGxlciA9IHtcbiAgc2NoZWR1bGVyOiBTY2hlZHVsZUNvbnRyb2xsZXIsXG5cbiAgZ2V0VHJlZSgpOiBUcmVlUmVwb3J0LFxuICBnZXRUaHJlYWQoKTogVGhyZWFkUmVwb3J0LFxuICBnZXREZWx0YSgpOiBEZWx0YVJlcG9ydCxcblxuICBnZXREZXRhaWxzKGNvbW1pdElkOiBDb21taXRJRCk6IENvbW1pdERldGFpbHNSZXBvcnQgfCBudWxsXG59XG5cbmV4cG9ydCBjbGFzcyBEZWJ1Z1JlY29uY2lsZXIgZXh0ZW5kcyBSZWNvbmNpbGVyMiB7XG4gIGNvbnRyb2xsZXI6IFJlY29uY2lsZXJEZWJ1Z0NvbnRyb2xsZXI7XG4gIGRlYnVnQnVzOiBSZWNvbmNpbGVyRGVidWdFdmVudEJ1cztcblxuICBzdGFydGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgY29uc3QgZGVidWdCdXM6IFJlY29uY2lsZXJEZWJ1Z0V2ZW50QnVzID0ge1xuICAgICAgc2NoZWR1bGVyOiB7XG4gICAgICAgIG9uQWZ0ZXJDYWxsYmFja0V4ZWN1dGUoKSB7fSxcbiAgICAgICAgb25JbnRlcmNlcHRTdGFydCgpIHt9LFxuICAgICAgICBvbkludGVyY2VwdEVuZCgpIHt9LFxuICAgICAgfSxcbiAgICAgIHRocmVhZDoge1xuICAgICAgICBvblF1ZXVlKCkge30sXG4gICAgICAgIG9uU3RhcnRQYXNzKCkge30sXG4gICAgICAgIG9uV29yaygpIHt9LFxuICAgICAgICBvblJlbmRlcigpIHt9LFxuICAgICAgfSxcbiAgICAgIGV4dGVybmFsVXBkYXRlKCkge30sXG4gICAgICBvblRocmVhZERvbmUoKSB7fSxcbiAgICB9O1xuXG4gICAgY29uc3Qgc2NoZWR1bGVyID0gY3JlYXRlRGVidWdTY2hlZHVsZXIoZGVidWdCdXMuc2NoZWR1bGVyKTtcbiAgICBzdXBlcihzY2hlZHVsZXIpO1xuICAgIHRoaXMuZGVidWdCdXMgPSBkZWJ1Z0J1cztcbiAgICBcbiAgICBjb25zdCBtZSA9IHRoaXM7XG5cbiAgICB0aGlzLmNvbnRyb2xsZXIgPSB7XG4gICAgICBzY2hlZHVsZXI6IHNjaGVkdWxlci5jb250cm9sbGVyLFxuICAgICAgZ2V0VHJlZSgpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVRyZWVSZXBvcnQobWUudHJlZSlcbiAgICAgIH0sXG4gICAgICBnZXRUaHJlYWQoKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVUaHJlYWRSZXBvcnQobWUudGhyZWFkKVxuICAgICAgfSxcbiAgICAgIGdldERlbHRhKCkge1xuICAgICAgICByZXR1cm4gY3JlYXRlRGVsdGFSZXBvcnQobWUudGhyZWFkLmRlbHRhKTtcbiAgICAgIH0sXG4gICAgICBnZXREZXRhaWxzKGNvbW1pdElkKSB7XG4gICAgICAgIGNvbnN0IGNvbW1pdCA9IG1lLnRyZWUuY29tbWl0cy5nZXQoY29tbWl0SWQpO1xuICAgICAgICBpZiAoIWNvbW1pdClcbiAgICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgICAgICByZXR1cm4gY3JlYXRlQ29tbWl0RGV0YWlsc1JlcG9ydChjb21taXQsIG1lLnRyZWUpIHx8IG51bGw7XG4gICAgICB9XG4gICAgfTtcbiAgICB0aGlzLnRocmVhZCA9IG5ldyBEZWJ1Z1dvcmtUaHJlYWQodGhpcy50cmVlLCBkZWJ1Z0J1cy50aHJlYWQpOyBcbiAgfVxuICBzdWJtaXRUaHJlYWQoKTogdm9pZCB7XG4gICAgY29uc3Qgc3VibWl0dGVkVGhyZWFkID0gdGhpcy50aHJlYWQ7XG4gICAgY29uc3QgeyBpZCwgdmlzaXRlZCwgcGFzc2VzIH0gPSBzdWJtaXR0ZWRUaHJlYWQ7XG5cbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcbiAgICBjb25zdCBkZWx0YSA9IGNyZWF0ZURlbHRhUmVwb3J0KHN1Ym1pdHRlZFRocmVhZC5kZWx0YSk7XG4gICAgdGhpcy5kZWJ1Z0J1cy5vblRocmVhZERvbmUoY3JlYXRlVGhyZWFkUmVwb3J0KHN1Ym1pdHRlZFRocmVhZCksIGRlbHRhKVxuXG4gICAgLy8gU3RhcnQgYSBuZXcgdGhyZWFkXG4gICAgdGhpcy50aHJlYWQgPSBuZXcgRGVidWdXb3JrVGhyZWFkKHRoaXMudHJlZSwgdGhpcy5kZWJ1Z0J1cy50aHJlYWQpO1xuXG4gICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG5cbiAgICAvLyBzZW5kIGRlbHRhIHJlYWR5XG4gICAgdGhpcy5idXMucmVuZGVyKHN1Ym1pdHRlZFRocmVhZC5kZWx0YSk7XG5cbiAgICAvLyBydW4gZWZmZWN0c1xuICAgIGZvciAoY29uc3QgY2xlYW51cCBvZiBzdWJtaXR0ZWRUaHJlYWQuZGVsdGEuY2xlYW51cHMudmFsdWVzKCkpXG4gICAgICBjbGVhbnVwLmZ1bmMoKTtcbiAgICBmb3IgKGNvbnN0IGVmZmVjdCBvZiBzdWJtaXR0ZWRUaHJlYWQuZGVsdGEuZWZmZWN0cy52YWx1ZXMoKSlcbiAgICAgIGVmZmVjdC5mdW5jKCk7XG5cbiAgICBmb3IgKGNvbnN0IHJlbW92ZSBvZiBzdWJtaXR0ZWRUaHJlYWQuZGVsdGEucmVtb3ZlZC52YWx1ZXMoKSlcbiAgICAgIHRoaXMucG9vbHMuY29tbWl0LnJlbGVhc2UocmVtb3ZlKTtcbiAgICBcbiAgICBcbiAgICBwZXJmb3JtYW5jZS5tYXJrKGByZWNvbmNpbGVyOnRocmVhZCgke2lkfSk6ZW5kYCk7XG4gICAgcGVyZm9ybWFuY2UubWVhc3VyZShgcmVjb25jaWxlcjp0aHJlYWQoJHtpZH0sIHZpc2l0ZWQ9JHt2aXNpdGVkLnNpemV9KWAsXG4gICAgICBgcmVjb25jaWxlcjp0aHJlYWQoJHtpZH0pOnN0YXJ0YCxcbiAgICAgIGByZWNvbmNpbGVyOnRocmVhZCgke2lkfSk6ZW5kYCxcbiAgICApXG4gICAgY29uc29sZS5pbmZvKGBbUmVjb25jaWxlcl0gVGhyZWFkICR7aWR9IHZpc2l0ZWQgJHt2aXNpdGVkLnNpemV9IG5vZGVzLCBpbiAke3Bhc3Nlc30gcGFzc2VzYCk7XG4gIH1cblxuICBtb3VudChub2RlOiBOb2RlKSB7XG4gICAgaWYgKCF0aGlzLnN0YXJ0ZWQpIHtcbiAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XG4gICAgICBwZXJmb3JtYW5jZS5tYXJrKGByZWNvbmNpbGVyOnRocmVhZCgke3RoaXMudGhyZWFkLmlkfSk6c3RhcnRgKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cGVyLm1vdW50KG5vZGUpO1xuICB9XG4gIHVubW91bnQocmVmOiBDb21taXRSZWYyKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnN0YXJ0ZWQpIHtcbiAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XG4gICAgICBwZXJmb3JtYW5jZS5tYXJrKGByZWNvbmNpbGVyOnRocmVhZCgke3RoaXMudGhyZWFkLmlkfSk6c3RhcnRgKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cGVyLnVubW91bnQocmVmKTtcbiAgfVxuICByZW5kZXIocmVmOiBDb21taXRSZWYyKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnN0YXJ0ZWQpIHtcbiAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XG4gICAgICBwZXJmb3JtYW5jZS5tYXJrKGByZWNvbmNpbGVyOnRocmVhZCgke3RoaXMudGhyZWFkLmlkfSk6c3RhcnRgKTtcbiAgICB9XG4gICAgc3VwZXIucmVuZGVyKHJlZik7XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgRGVidWdXb3JrVGhyZWFkRXZlbnRCdXMgPSB7XG4gIG9uV29yayhwcmV2VGFzazogbnVsbCB8IFdvcmtUYXNrUmVwb3J0LCBuZXh0VGFzazogbnVsbCB8IFdvcmtUYXNrUmVwb3J0LCBkb25lOiBib29sZWFuKTogdm9pZCxcbiAgb25SZW5kZXIoKTogdm9pZCxcblxuICBvblN0YXJ0UGFzcygpOiB2b2lkLFxuICBvblF1ZXVlKHJlYXNvbjogV29ya1JlYXNvblJlcG9ydCwgcmVzdWx0OiBRdWV1ZVJlc3VsdCk6IHZvaWQsXG59XG5cbmV4cG9ydCBjbGFzcyBEZWJ1Z1dvcmtUaHJlYWQgZXh0ZW5kcyBXb3JrVGhyZWFkMiB7XG4gIGRlYnVnQnVzOiBEZWJ1Z1dvcmtUaHJlYWRFdmVudEJ1cztcblxuICBjb25zdHJ1Y3Rvcih0cmVlOiBDb21taXRUcmVlMiwgZGVidWdCdXM6IERlYnVnV29ya1RocmVhZEV2ZW50QnVzKSB7XG4gICAgc3VwZXIodHJlZSk7XG4gICAgdGhpcy5kZWJ1Z0J1cyA9IGRlYnVnQnVzO1xuICB9XG5cbiAgd29yaygpOiB2b2lkIHtcbiAgICBjb25zdCBwcmV2VGFzayA9IHRoaXMucGVuZGluZ1Rhc2tzW3RoaXMucGVuZGluZ1Rhc2tzLmxlbmd0aCAtIDFdO1xuICAgIHN1cGVyLndvcmsoKTtcbiAgICBjb25zdCBuZXh0VGFzayA9IHRoaXMucGVuZGluZ1Rhc2tzW3RoaXMucGVuZGluZ1Rhc2tzLmxlbmd0aCAtIDFdO1xuICAgIHRoaXMuZGVidWdCdXMub25Xb3JrKFxuICAgICAgcHJldlRhc2sgJiYgY3JlYXRlV29ya1Rhc2tSZXBvcnQocHJldlRhc2spIHx8IG51bGwsXG4gICAgICBuZXh0VGFzayAmJiBjcmVhdGVXb3JrVGFza1JlcG9ydChuZXh0VGFzaykgfHwgbnVsbCxcbiAgICAgIHRoaXMuZG9uZVxuICAgIClcbiAgfVxuXG4gIHF1ZXVlKHJlYXNvbjogV29ya1JlYXNvbik6IFF1ZXVlUmVzdWx0IHtcbiAgICBjb25zdCByZXN1bHQgPSBzdXBlci5xdWV1ZShyZWFzb24pO1xuXG4gICAgdGhpcy5kZWJ1Z0J1cy5vblF1ZXVlKGNyZWF0ZVdvcmtSZWFzb25SZXBvcnQocmVhc29uKSwgcmVzdWx0KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBzdGFydE5leHRQYXNzKCk6IHZvaWQge1xuXG4gICAgc3VwZXIuc3RhcnROZXh0UGFzcygpXG4gICAgdGhpcy5kZWJ1Z0J1cy5vblN0YXJ0UGFzcygpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQ29tcG9uZW50LCBoLCB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAnQGx1a2VrYWFsaW0vYWN0JztcbmltcG9ydCB7IFJlY29uY2lsZXJEZWJ1Z0NvbnRyb2xsZXIsIFJlY29uY2lsZXJEZWJ1Z0V2ZW50QnVzLCBTY2hlZHVsZUNvbnRyb2xsZXIsIFNjaGVkdWxlRXZlbnRCdXMgfSBmcm9tICdAbHVrZWthYWxpbS9hY3QtZGVidWcnO1xuaW1wb3J0IHsgSW5zaWdodEFwcFN0YXRlIH0gZnJvbSAnLi9JbnNpZ2h0QXBwJztcblxuZXhwb3J0IHR5cGUgU2NoZWR1bGVDb250cm9sc1Byb3BzID0ge1xuICBjb250cm9sbGVyOiBTY2hlZHVsZUNvbnRyb2xsZXIsXG4gIGJ1czogU2NoZWR1bGVFdmVudEJ1cyxcblxuICByZWNvbmNpbGVyOiBSZWNvbmNpbGVyRGVidWdDb250cm9sbGVyLFxuXG4gIHN0YXRlOiBJbnNpZ2h0QXBwU3RhdGUsXG4gIG9uU3RhdGVDaGFuZ2U/OiAobmV3U3RhdGU6IEluc2lnaHRBcHBTdGF0ZSkgPT4gdm9pZCxcbn07XG5cbmV4cG9ydCBjb25zdCBTY2hlZHVsZUNvbnRyb2xzOiBDb21wb25lbnQ8U2NoZWR1bGVDb250cm9sc1Byb3BzPiA9ICh7IGNvbnRyb2xsZXIsIGJ1cywgcmVjb25jaWxlciwgc3RhdGUsIG9uU3RhdGVDaGFuZ2UgPSAoKSA9PiB7fSB9KSA9PiB7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYnVzLm9uSW50ZXJjZXB0U3RhcnQgPSAoKSA9PiB7XG4gICAgICBvblN0YXRlQ2hhbmdlKHsgLi4uc3RhdGUsIHBhdXNlZDogdHJ1ZSB9KTtcbiAgICAgIC8vb25QYXVzZUNoYW5nZShmYWxzZSlcbiAgICB9XG4gICAgYnVzLm9uSW50ZXJjZXB0RW5kID0gKCkgPT4ge1xuICAgICAgb25TdGF0ZUNoYW5nZSh7IC4uLnN0YXRlLCBwYXVzZWQ6IGZhbHNlIH0pO1xuICAgICAgLy9vblBhdXNlQ2hhbmdlKGZhbHNlKVxuICAgIH1cbiAgICBidXMub25BZnRlckNhbGxiYWNrRXhlY3V0ZSA9ICgpID0+IHtcbiAgICAgIC8vcmVjb25jaWxlci5nZXRUaHJlYWQoKTtcbiAgICB9XG4gIH0sIFtidXMsIHJlY29uY2lsZXIsIHN0YXRlXSlcblxuXG4gIGNvbnN0IG9uU3RlcENsaWNrID0gKCkgPT4ge1xuICAgIGNvbnRyb2xsZXIuc3RlcCgpO1xuICB9XG4gIGNvbnN0IG9uUmVzdW1lQ2xpY2sgPSAoKSA9PiB7XG4gICAgY29udHJvbGxlci5jYW5jZWxJbnRlcmNlcHQoKTtcbiAgfVxuICBjb25zdCBvbkNoYW5nZUJyZWFrQmVmb3JlVXBkYXRlID0gKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgIG9uU3RhdGVDaGFuZ2UoeyAuLi5zdGF0ZSwgYnJlYWtPbkJlZm9yZVVwZGF0ZTogKGV2ZW50LnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50KS5jaGVja2VkIH0pO1xuICB9XG4gIGNvbnN0IG9uQ2hhbmdlQnJlYWtBZnRlclVwZGF0ZSA9IChldmVudDogRXZlbnQpID0+IHtcbiAgICBvblN0YXRlQ2hhbmdlKHsgLi4uc3RhdGUsIGJyZWFrT25BZnRlclVwZGF0ZTogKGV2ZW50LnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50KS5jaGVja2VkIH0pO1xuICB9XG5cbiAgcmV0dXJuIGgoJ2RpdicsIHsgc3R5bGU6IHsgYmFja2dyb3VuZDogc3RhdGUucGF1c2VkID8gJ3JlZCcgOiAnd2hpdGUnLCBwYWRkaW5nOiAnOHB4JywgZGlzcGxheTogJ2ZsZXgnLCBnYXA6ICcxMnB4JyB9fSwgW1xuICAgIGgoJ2RpdicsIHsgc3R5bGU6IHsgZGlzcGxheTogJ2ZsZXgnLCAnZmxleC1kaXJlY3Rpb24nOiAnY29sdW1uJyB9IH0sIFtcbiAgICAgIGgoJ2xhYmVsJywgeyBzdHlsZTogeyAnbWFyZ2luJzogJ2F1dG8gMCcgfSB9LCBbXG4gICAgICAgIGgoJ3NwYW4nLCB7fSwgYEJyZWFrIEJlZm9yZSBVcGRhdGVgKSxcbiAgICAgICAgaCgnaW5wdXQnLCB7IHR5cGU6ICdjaGVja2JveCcsIGNoZWNrZWQ6IHN0YXRlLmJyZWFrT25CZWZvcmVVcGRhdGUsIG9uQ2hhbmdlOiBvbkNoYW5nZUJyZWFrQmVmb3JlVXBkYXRlIH0pLFxuICAgICAgXSksXG4gICAgICBoKCdsYWJlbCcsIHsgc3R5bGU6IHsgJ21hcmdpbic6ICdhdXRvIDAnIH0gfSwgW1xuICAgICAgICBoKCdzcGFuJywge30sIGBCcmVhayBBZnRlciBVcGRhdGVgKSxcbiAgICAgICAgaCgnaW5wdXQnLCB7IHR5cGU6ICdjaGVja2JveCcsIGNoZWNrZWQ6IHN0YXRlLmJyZWFrT25BZnRlclVwZGF0ZSwgb25DaGFuZ2U6IG9uQ2hhbmdlQnJlYWtBZnRlclVwZGF0ZSB9KSxcbiAgICAgIF0pLFxuICAgIF0pLFxuICAgIGgoJ2J1dHRvbicsIHsgb25DbGljazogb25TdGVwQ2xpY2ssIGRpc2FibGVkOiAhc3RhdGUucGF1c2VkLCBzdHlsZTogeyBwYWRkaW5nOiAnOHB4JyB9IH0sICdTdGVwJyksXG4gICAgaCgnYnV0dG9uJywgeyBvbkNsaWNrOiBvblJlc3VtZUNsaWNrLCBkaXNhYmxlZDogIXN0YXRlLnBhdXNlZCwgc3R5bGU6IHsgcGFkZGluZzogJzhweCcgfSB9LCAnUmVzdW1lJyksXG4gICAgaCgnc3BhbicsIHtcbiAgICAgIHN0eWxlOiB7IGJvcmRlcjogYDJweCBzb2xpZCAke3N0YXRlLnBhdXNlZCA/ICdvcmFuZ2UnIDogJ2JsYWNrJ31gLCAnYm9yZGVyLXJhZGl1cyc6ICc4cHgnLCBwYWRkaW5nOiAnOHB4JyB9XG4gICAgfSwgc3RhdGUucGF1c2VkID8gYFBhdXNlZGAgOiBgUmVhZHlgKSxcbiAgXSlcbn07IiwgImltcG9ydCB7IENvbW1pdFJlcG9ydCwgRGVsdGFSZXBvcnQsIEVsZW1lbnRSZXBvcnQsIFRocmVhZFJlcG9ydCwgVHJlZVJlcG9ydCwgV29ya1Rhc2tSZXBvcnQgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0LWRlYnVnXCI7XG5pbXBvcnQgeyBDb21taXRJRCwgQ29tbWl0VmVyc2lvbiwgV29ya1RocmVhZDIgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0LXJlY29uXCI7XG5cbmV4cG9ydCBjbGFzcyBNdXRhYmxlQ29tbWl0UmVmIHtcbiAgZWxlbWVudDogRWxlbWVudFJlcG9ydDtcbiAgaWQ6IENvbW1pdElEO1xuICB2ZXJzaW9uOiBDb21taXRWZXJzaW9uO1xuICBkaXN0YW5jZTogbnVtYmVyO1xuXG4gIHJlcG9ydDogQ29tbWl0UmVwb3J0O1xuXG4gIGNoaWxkcmVuOiBNdXRhYmxlQ29tbWl0UmVmW10gPSBbXTtcbiAgcGFyZW50OiBudWxsIHwgTXV0YWJsZUNvbW1pdFJlZiA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoY29tbWl0OiBDb21taXRSZXBvcnQpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBjb21taXQuZWxlbWVudDtcbiAgICB0aGlzLmlkID0gY29tbWl0LmlkO1xuICAgIHRoaXMudmVyc2lvbiA9IGNvbW1pdC52ZXJzaW9uO1xuICAgIHRoaXMuZGlzdGFuY2UgPSBjb21taXQuZGlzdGFuY2U7XG5cbiAgICB0aGlzLnJlcG9ydCA9IGNvbW1pdDtcbiAgfVxuXG4gIHVwZGF0ZShjb21taXQ6IENvbW1pdFJlcG9ydCkge1xuICAgIHRoaXMucmVwb3J0ID0gY29tbWl0O1xuICAgIHRoaXMudmVyc2lvbiA9IGNvbW1pdC52ZXJzaW9uO1xuICAgIHRoaXMuZWxlbWVudCA9IGNvbW1pdC5lbGVtZW50O1xuICB9XG5cbiAgcmVzb2x2ZShsb29rdXBNYXA6IE1hcDxDb21taXRJRCwgTXV0YWJsZUNvbW1pdFJlZj4pIHtcbiAgICBpZiAodGhpcy5yZXBvcnQucGFyZW50KVxuICAgICAgdGhpcy5saW5rUGFyZW50KHRoaXMucmVwb3J0LnBhcmVudCwgbG9va3VwTWFwKTtcbiAgICB0aGlzLmxpbmtDaGlsZHJlbih0aGlzLnJlcG9ydC5jaGlsZHJlbiwgbG9va3VwTWFwKTtcbiAgfVxuXG4gIGxpbmtQYXJlbnQocGFyZW50OiBDb21taXRJRCwgbG9va3VwTWFwOiBNYXA8Q29tbWl0SUQsIE11dGFibGVDb21taXRSZWY+KSB7XG4gICAgdGhpcy5wYXJlbnQgPSBsb29rdXBNYXAuZ2V0KHBhcmVudCkgfHwgbnVsbDtcbiAgfVxuICBsaW5rQ2hpbGRyZW4oY2hpbGRyZW46IENvbW1pdElEW10sIGxvb2t1cE1hcDogTWFwPENvbW1pdElELCBNdXRhYmxlQ29tbWl0UmVmPikge1xuICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbi5tYXAoYyA9PiBsb29rdXBNYXAuZ2V0KGMpKS5maWx0ZXIoeCA9PiAhIXgpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb21taXRMb29rdXBDYWNoZSB7XG4gIG1hcDogTWFwPENvbW1pdElELCBDb21taXRSZXBvcnQ+ID0gbmV3IE1hcCgpO1xuICByb290czogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcblxuICBzZXRUcmVlKHRyZWU6IFRyZWVSZXBvcnQpIHtcbiAgICB0aGlzLm1hcC5jbGVhcigpO1xuICAgIHRoaXMucm9vdHMuY2xlYXIoKTtcblxuICAgIGZvciAoY29uc3QgY29tbWl0IG9mIHRyZWUuY29tbWl0cykge1xuICAgICAgdGhpcy5tYXAuc2V0KGNvbW1pdC5pZCwgY29tbWl0KVxuICAgICAgaWYgKCFjb21taXQucGFyZW50KVxuICAgICAgICB0aGlzLnJvb3RzLmFkZChjb21taXQuaWQpO1xuICAgIH1cbiAgfVxuXG4gIGluZ2VzdChkZWx0YTogRGVsdGFSZXBvcnQpIHtcbiAgICBmb3IgKGNvbnN0IGNyZWF0ZSBvZiBkZWx0YS5jcmVhdGVkKSB7XG4gICAgICB0aGlzLm1hcC5zZXQoY3JlYXRlLmlkLCBjcmVhdGUpO1xuICAgICAgaWYgKCFjcmVhdGUucGFyZW50KVxuICAgICAgICB0aGlzLnJvb3RzLmFkZChjcmVhdGUuaWQpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHVwZGF0ZSBvZiBkZWx0YS51cGRhdGVkKVxuICAgICAgdGhpcy5tYXAuc2V0KHVwZGF0ZS5pZCwgdXBkYXRlKTtcbiAgICBmb3IgKGNvbnN0IHJlbW92ZSBvZiBkZWx0YS5yZW1vdmVkKSB7XG4gICAgICB0aGlzLm1hcC5kZWxldGUocmVtb3ZlLmlkKTtcbiAgICAgIHRoaXMucm9vdHMuZGVsZXRlKHJlbW92ZS5pZCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQSBidW5jaCBvZiByZWxldmFudCBkYXRhIGZvciBhIFRyZWUgaW4gdGhlIHByb2dyZXNzIG9mIGNoYW5naW5nXG4gKi9cbmV4cG9ydCBjbGFzcyBUaHJlYWRMb29rdXBDYWNoZSB7XG4gIGNhbm9uOiBDb21taXRMb29rdXBDYWNoZTtcblxuICByZXBvcnQ6IERlbHRhUmVwb3J0IHwgbnVsbCA9IG51bGw7XG4gIHRocmVhZDogVGhyZWFkUmVwb3J0IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoY2Fub246IENvbW1pdExvb2t1cENhY2hlKSB7XG4gICAgdGhpcy5jYW5vbiA9IGNhbm9uO1xuICB9XG5cbiAgcm9vdHM6IFNldDxDb21taXRJRD4gPSBuZXcgU2V0KCk7XG5cbiAgY3JlYXRlZDogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcbiAgdXBkYXRlZDogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcbiAgcmVtb3ZlZDogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcblxuICAvKipcbiAgICogQW4gdXAgdG8gZGF0ZSBtYXAgb2YgdGhlIHRyZWUsIHBsdXMgZGVsZXRlZCBub3RlcyBpbiB0aGlzIGRlbHRhXG4gICAqL1xuICBhbGw6IE1hcDxDb21taXRJRCwgQ29tbWl0UmVwb3J0PiA9IG5ldyBNYXAoKTtcblxuICBuZXh0VGFzazogV29ya1Rhc2tSZXBvcnQgfCBudWxsID0gbnVsbDtcbiAgcHJldlRhc2s6IFdvcmtUYXNrUmVwb3J0IHwgbnVsbCA9IG51bGw7XG4gIFxuICBhbGxUYXNrczogTWFwPENvbW1pdElELCBXb3JrVGFza1JlcG9ydD4gPSBuZXcgTWFwKCk7XG5cbiAgdGFyZ2V0czogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcbiAgdmlzaXRlZDogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcblxuICAvKipcbiAgICogQ2xlYXIgdGhlIGRlbHRhIGNhY2hlXG4gICAqL1xuICByZXNldCgpIHtcbiAgICB0aGlzLnJvb3RzID0gbmV3IFNldCh0aGlzLmNhbm9uLnJvb3RzKVxuICAgIHRoaXMuYWxsID0gbmV3IE1hcCh0aGlzLmNhbm9uLm1hcCk7XG4gICAgdGhpcy5hbGxUYXNrcyA9IG5ldyBNYXAoKTtcblxuICAgIHRoaXMubmV4dFRhc2sgPSBudWxsO1xuICAgIHRoaXMucHJldlRhc2sgPSBudWxsO1xuICAgIHRoaXMucmVwb3J0ID0gbnVsbDtcblxuICAgIHRoaXMuY3JlYXRlZC5jbGVhcigpO1xuICAgIHRoaXMudXBkYXRlZC5jbGVhcigpO1xuICAgIHRoaXMucmVtb3ZlZC5jbGVhcigpO1xuXG4gICAgdGhpcy50YXJnZXRzLmNsZWFyKCk7XG4gICAgdGhpcy52aXNpdGVkLmNsZWFyKCk7XG4gIH1cblxuICBpbmdlc3RUaHJlYWQodGhyZWFkOiBUaHJlYWRSZXBvcnQpIHtcbiAgICB0aGlzLnRocmVhZCA9IHRocmVhZDtcblxuICAgIHRoaXMubmV4dFRhc2sgPSB0aHJlYWQucGVuZGluZ1Rhc2tzW3RocmVhZC5wZW5kaW5nVGFza3MubGVuZ3RoIC0gMV07XG4gICAgdGhpcy50YXJnZXRzID0gbmV3IFNldCh0aHJlYWQucmVhc29ucy5tYXAocmVhc29uID0+IHJlYXNvbi50YXJnZXQpKTtcbiAgICB0aGlzLnZpc2l0ZWQgPSBuZXcgU2V0KHRocmVhZC52aXNpdGVkKVxuICAgIHRoaXMuYWxsVGFza3MgPSBuZXcgTWFwKHRocmVhZC5wZW5kaW5nVGFza3MubWFwKHRhc2sgPT4gW3Rhc2suaWQsIHRhc2tdKSlcbiAgfVxuXG4gIGluZ2VzdERlbHRhKGRlbHRhOiBEZWx0YVJlcG9ydCkge1xuICAgIHRoaXMucmVwb3J0ID0gZGVsdGE7XG4gICAgY29uc3QgY3JlYXRlZElkcyA9IG5ldyBTZXQoZGVsdGEuY3JlYXRlZC5tYXAoYyA9PiBjLmlkKSk7XG5cbiAgICBmb3IgKGNvbnN0IGNvbW1pdCBvZiBkZWx0YS5jcmVhdGVkKSB7XG4gICAgICB0aGlzLmNyZWF0ZWQuYWRkKGNvbW1pdC5pZClcblxuICAgICAgY29uc3QgY2hpbGRyZW4gPSBbLi4ubmV3IFNldChjb21taXQuY2hpbGRyZW4uZmlsdGVyKGMgPT4gdGhpcy5hbGwuaGFzKGMpIHx8IGNyZWF0ZWRJZHMuaGFzKGMpKSldXG4gICAgICB0aGlzLmFsbC5zZXQoY29tbWl0LmlkLCB7IC4uLmNvbW1pdCwgY2hpbGRyZW4gfSk7XG5cbiAgICAgIGlmICghY29tbWl0LnBhcmVudClcbiAgICAgICAgdGhpcy5yb290cy5hZGQoY29tbWl0LmlkKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBjb21taXQgb2YgZGVsdGEudXBkYXRlZCkge1xuICAgICAgY29uc3QgZXhpc3RpbmdDb21taXQgPSB0aGlzLmNhbm9uLm1hcC5nZXQoY29tbWl0LmlkKSBhcyBDb21taXRSZXBvcnQ7XG5cbiAgICAgIGNvbnN0IGNoaWxkcmVuID0gWy4uLm5ldyBTZXQoW1xuICAgICAgICAuLi5jb21taXQuY2hpbGRyZW4uZmlsdGVyKGMgPT4gdGhpcy5hbGwuaGFzKGMpKSxcbiAgICAgICAgLi4uZXhpc3RpbmdDb21taXQuY2hpbGRyZW4sXG4gICAgICBdKV1cbiAgICAgIGNvbnN0IG1lcmdlZENvbW1pdFJlcG9ydCA9IHsgLi4uY29tbWl0LCBjaGlsZHJlbiB9O1xuXG4gICAgICB0aGlzLnVwZGF0ZWQuYWRkKGNvbW1pdC5pZClcbiAgICAgIHRoaXMuYWxsLnNldChjb21taXQuaWQsIG1lcmdlZENvbW1pdFJlcG9ydClcbiAgICB9XG4gICAgZm9yIChjb25zdCBjb21taXQgb2YgZGVsdGEucmVtb3ZlZCkge1xuICAgICAgdGhpcy5yZW1vdmVkLmFkZChjb21taXQuaWQpO1xuICAgICAgdGhpcy5hbGwuc2V0KGNvbW1pdC5pZCwgY29tbWl0KTtcbiAgICB9XG4gIH1cblxuICBnZXRGbGF0KCkge1xuICAgIGNvbnN0IHBlbmRpbmc6IENvbW1pdFJlcG9ydFtdID0gWy4uLnRoaXMucm9vdHMudmFsdWVzKCldXG4gICAgICAubWFwKHJvb3QgPT4gdGhpcy5hbGwuZ2V0KHJvb3QpKVxuICAgICAgLmZpbHRlcih4ID0+ICEheCk7XG5cbiAgICBjb25zdCBmbGF0OiBDb21taXRSZXBvcnRbXSA9IFtdO1xuICAgIFxuICAgIHdoaWxlIChwZW5kaW5nLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGNvbW1pdCA9IHBlbmRpbmcucG9wKCkgYXMgQ29tbWl0UmVwb3J0O1xuICAgICAgZmxhdC5wdXNoKGNvbW1pdCk7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkSWQgb2YgWy4uLmNvbW1pdC5jaGlsZHJlbl0ucmV2ZXJzZSgpKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkID0gdGhpcy5hbGwuZ2V0KGNoaWxkSWQpO1xuICAgICAgICBpZiAoY2hpbGQpXG4gICAgICAgICAgcGVuZGluZy5wdXNoKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmxhdDtcbiAgfVxufSIsICJpbXBvcnQgeyBDb21wb25lbnQsIGgsIE5vZGUsIFJlYWRvbmx5UmVmLCB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5pbXBvcnQgeyBkZWJvdW5jZSB9IGZyb20gJ2xvZGFzaC1lcyc7XG5cbmV4cG9ydCB0eXBlIFZpcnR1YWxUcmVlSXRlbSA9IHtcbiAgZGVwdGg6IG51bWJlcixcblxufVxuXG5leHBvcnQgdHlwZSBWaXJ0dWFsVHJlZVByb3BzID0ge1xuICBjaHVua1NpemU6IG51bWJlcixcbiAgY2h1bmtDb3VudDogbnVtYmVyLFxuXG4gIHdpbmRvd1JhbmdlOiBudW1iZXIsXG5cbiAgcmVuZGVyQ2h1bmsoaW5kZXg6IG51bWJlcik6IE5vZGUsXG5cbiAgdmlld3BvcnRSZWY/OiBSZWFkb25seVJlZjxIVE1MRWxlbWVudCB8IG51bGw+LFxufVxuXG5leHBvcnQgY29uc3QgVmlydHVhbDFEOiBDb21wb25lbnQ8VmlydHVhbFRyZWVQcm9wcz4gPSAoeyBjaHVua1NpemUsIGNodW5rQ291bnQsIHJlbmRlckNodW5rLCB2aWV3cG9ydFJlZjogcHJvcFZpZXdwb3J0UmVmLCB3aW5kb3dSYW5nZSB9KSA9PiB7XG4gIGNvbnN0IFtzdGFydCwgc2V0U3RhcnRdID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtlbmQsIHNldEVuZF0gPSB1c2VTdGF0ZSgwKTtcblxuICBjb25zdCBsb2NhbFZpZXdwb3J0UmVmID0gdXNlUmVmPEhUTUxFbGVtZW50IHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IHZpZXdwb3J0UmVmID0gcHJvcFZpZXdwb3J0UmVmIHx8IGxvY2FsVmlld3BvcnRSZWY7XG5cbiAgY29uc3QgbGlzdFJlZiA9IHVzZVJlZjxIVE1MRWxlbWVudCB8IG51bGw+KG51bGwpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCF2aWV3cG9ydFJlZi5jdXJyZW50KVxuICAgICAgcmV0dXJuO1xuXG4gICAgY29uc3Qgdmlld3BvcnQgPSB2aWV3cG9ydFJlZi5jdXJyZW50O1xuXG4gICAgY29uc3Qgc2V0Vmlld3BvcnQgPSAoKSA9PiB7XG4gICAgICBjb25zdCByZWN0ID0gdmlld3BvcnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgIHNldFN0YXJ0KE1hdGguZmxvb3IoKHZpZXdwb3J0LnNjcm9sbFRvcCkgLyBjaHVua1NpemUpKVxuICAgICAgc2V0RW5kKE1hdGguY2VpbCgodmlld3BvcnQuc2Nyb2xsVG9wICsgcmVjdC5oZWlnaHQpIC8gY2h1bmtTaXplKSlcbiAgICB9O1xuICAgIHNldFZpZXdwb3J0KCk7XG5cbiAgICB2aWV3cG9ydC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBzZXRWaWV3cG9ydClcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgdmlld3BvcnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgc2V0Vmlld3BvcnQpXG4gICAgfVxuICB9LCBbcHJvcFZpZXdwb3J0UmVmXSlcblxuICBjb25zdCByZW5kZXJlZEluZGljZXMgPSBBcnJheVxuICAgIC5mcm9tKHsgbGVuZ3RoOiBlbmQgLSBzdGFydCB9KVxuICAgIC5tYXAoKF8sIGkpID0+IHN0YXJ0ICsgaSlcbiAgICAuZmlsdGVyKHggPT4geCA+PSAwICYmIHggPCBjaHVua0NvdW50KTtcbiAgICBcblxuICByZXR1cm4gW1xuICAgIC8vaCgncHJlJywge30sIHJlbmRlcmVkSW5kaWNlcy5qb2luKCcsICcpKSxcbiAgICBoKCdkaXYnLCB7IHJlZjogdmlld3BvcnRSZWYsIHN0eWxlOiB7IG92ZXJmbG93OiAnYXV0bycsIGhlaWdodDogJzEwMCUnIH0gfSxcbiAgICAgIGgoJ2RpdicsIHsgcmVmOiBsaXN0UmVmLCBzdHlsZTogeyBoZWlnaHQ6IChjaHVua1NpemUgKiBjaHVua0NvdW50KSArICdweCcsIHBvc2l0aW9uOiAncmVsYXRpdmUnIH0gfSxcbiAgICAgICAgcmVuZGVyZWRJbmRpY2VzLm1hcChpbmRleCA9PlxuICAgICAgICAgIGgoJ2RpdicsIHsgc3R5bGU6IHsgcG9zaXRpb246ICdhYnNvbHV0ZScsIHRvcDogKGluZGV4ICogY2h1bmtTaXplKSArICdweCcsIGhlaWdodDogY2h1bmtTaXplLCBwYWRkaW5nOiAnLTEnLCBib3JkZXI6ICcxcHggZG90dGVkIGJsYWNrJywgd2lkdGg6ICcxMDAlJyB9fSxcbiAgICAgICAgICAgIHJlbmRlckNodW5rKGluZGV4KSkpXG4gICAgKSlcbiAgXTtcbn07IiwgImltcG9ydCB7IENvbXBvbmVudCwgaCwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAnQGx1a2VrYWFsaW0vYWN0JztcbmltcG9ydCB7IENvbW1pdERldGFpbHNSZXBvcnQsIENvbW1pdFJlcG9ydCwgRGVsdGFSZXBvcnQsIFJlY29uY2lsZXJEZWJ1Z0NvbnRyb2xsZXIsIFJlY29uY2lsZXJEZWJ1Z0V2ZW50QnVzLCBUaHJlYWRSZXBvcnQsIHVwZGF0ZVRyZWVSZXBvcnQsIFZhbHVlUmVwb3J0LCBXb3JrVGFza1JlcG9ydCB9IGZyb20gJ0BsdWtla2FhbGltL2FjdC1kZWJ1Zyc7XG5pbXBvcnQgeyBDb21taXRJRCB9IGZyb20gJ0BsdWtla2FhbGltL2FjdC1yZWNvbic7XG5pbXBvcnQgeyBDb21taXRQcmV2aWV3LCBUcmVlVmlld2VyIH0gZnJvbSAnLi9UcmVlVmlld2VyJztcbmltcG9ydCB7IFNjaGVkdWxlQ29udHJvbHMgfSBmcm9tICcuL1NjaGVkdWxlQ29udHJvbHMnO1xuaW1wb3J0IHsgQ29tbWl0TG9va3VwQ2FjaGUsIFRocmVhZExvb2t1cENhY2hlIH0gZnJvbSAnLi9sb29rdXAnO1xuaW1wb3J0IHsgVmlydHVhbDFEIH0gZnJvbSAnLi9WaXJ0dWFsJztcbmltcG9ydCB7IENvbW1pdEF0dHJpYnV0ZVRhZyB9IGZyb20gJy4vQXR0cmlidXRlVGFnJztcblxuZXhwb3J0IHR5cGUgSW5zaWdodEFwcFByb3BzID0ge1xuICBjb250cm9sbGVyOiBSZWNvbmNpbGVyRGVidWdDb250cm9sbGVyLFxuICBidXM6IFJlY29uY2lsZXJEZWJ1Z0V2ZW50QnVzLFxuXG4gIGRvY3VtZW50OiBEb2N1bWVudCxcblxuICBvblJlYWR5KCk6IHZvaWQsXG59O1xuXG5leHBvcnQgdHlwZSBJbnNpZ2h0QXBwU3RhdGUgPSB7XG4gIGJyZWFrT25BZnRlclVwZGF0ZTogYm9vbGVhbixcbiAgYnJlYWtPbkJlZm9yZVVwZGF0ZTogYm9vbGVhbixcblxuICBjb21taXRCcmVha3BvaW50czogU2V0PENvbW1pdElEPixcblxuICBwYXVzZWQ6IGJvb2xlYW4sXG59XG5cbmNvbnN0IElOU0lHSFRfU0VUVElOR1NfTE9DQUxTVE9SQUdFX0tFWSA9IGBJTlNJR0hUX1NFVFRJTkdTYDtcblxuZXhwb3J0IGNvbnN0IEluc2lnaHRBcHA6IENvbXBvbmVudDxJbnNpZ2h0QXBwUHJvcHM+ID0gKHsgb25SZWFkeSwgY29udHJvbGxlciwgYnVzLCBkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudCB9KSA9PiB7XG4gIGNvbnN0IFtjLCBzZXRSZW5kZXJDb3VudGVyXSA9IHVzZVN0YXRlKDApO1xuXG4gIGNvbnN0IHN0b3JlZFN0YXRlID0gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oSU5TSUdIVF9TRVRUSU5HU19MT0NBTFNUT1JBR0VfS0VZKVxuICAgIGlmICghc2V0dGluZ3MpXG4gICAgICByZXR1cm47XG4gICAgcmV0dXJuIEpTT04ucGFyc2Uoc2V0dGluZ3MpIGFzIHsgYnJlYWtPbkFmdGVyVXBkYXRlOiBib29sZWFuLCBicmVha09uQmVmb3JlVXBkYXRlOiBib29sZWFuIH07XG4gIH0sIFtdKVxuXG4gIGNvbnN0IFtpbnNpZ2h0U3RhdGUsIHNldEluc2lnaHRTdGF0ZV0gPSB1c2VTdGF0ZTxJbnNpZ2h0QXBwU3RhdGU+KHtcbiAgICBjb21taXRCcmVha3BvaW50czogbmV3IFNldCgpLFxuICAgIGJyZWFrT25BZnRlclVwZGF0ZTogc3RvcmVkU3RhdGUgPyBzdG9yZWRTdGF0ZS5icmVha09uQWZ0ZXJVcGRhdGUgOiBmYWxzZSxcbiAgICBicmVha09uQmVmb3JlVXBkYXRlOiBzdG9yZWRTdGF0ZSA/IHN0b3JlZFN0YXRlLmJyZWFrT25CZWZvcmVVcGRhdGUgOiBmYWxzZSxcbiAgICBwYXVzZWQ6IGZhbHNlLFxuICB9KTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oSU5TSUdIVF9TRVRUSU5HU19MT0NBTFNUT1JBR0VfS0VZLCBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBicmVha09uQWZ0ZXJVcGRhdGU6IGluc2lnaHRTdGF0ZS5icmVha09uQWZ0ZXJVcGRhdGUsXG4gICAgICBicmVha09uQmVmb3JlVXBkYXRlOiBpbnNpZ2h0U3RhdGUuYnJlYWtPbkJlZm9yZVVwZGF0ZSxcbiAgICB9KSlcbiAgfSwgW2luc2lnaHRTdGF0ZV0pXG5cbiAgY29uc3QgY29tbWl0Q2FjaGUgPSB1c2VSZWYoKCkgPT4gbmV3IENvbW1pdExvb2t1cENhY2hlKCkpLmN1cnJlbnQ7XG4gIGNvbnN0IGRlbHRhQ2FjaGUgPSB1c2VSZWYoKCkgPT4gbmV3IFRocmVhZExvb2t1cENhY2hlKGNvbW1pdENhY2hlKSkuY3VycmVudDtcblxuICB1c2VNZW1vKCgpID0+IHtcbiAgICBjb21taXRDYWNoZS5zZXRUcmVlKGNvbnRyb2xsZXIuZ2V0VHJlZSgpKVxuICAgIGRlbHRhQ2FjaGUucmVzZXQoKTtcbiAgfSwgW10pXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnW0luc2lnaHRdIFBvcHVsYXRlIENhY2hlJylcblxuICAgIGJ1cy5leHRlcm5hbFVwZGF0ZSA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGRlbHRhICA9IGNvbnRyb2xsZXIuZ2V0RGVsdGEoKTtcbiAgICAgIGNvbnN0IHRocmVhZCA9IGNvbnRyb2xsZXIuZ2V0VGhyZWFkKCk7XG5cbiAgICAgIGNvbW1pdENhY2hlLnNldFRyZWUoY29udHJvbGxlci5nZXRUcmVlKCkpXG5cbiAgICAgIGRlbHRhQ2FjaGUuaW5nZXN0RGVsdGEoZGVsdGEpO1xuICAgICAgZGVsdGFDYWNoZS5pbmdlc3RUaHJlYWQodGhyZWFkKTtcbiAgICAgIHNldFJlbmRlckNvdW50ZXIoYyA9PiBjICsgMSk7XG4gICAgfVxuXG4gICAgYnVzLm9uVGhyZWFkRG9uZSA9ICh0aHJlYWQsIGRlbHRhKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnW0luc2lnaHRdIFRocmVhZERvbmUnKVxuICAgICAgY29tbWl0Q2FjaGUuaW5nZXN0KGRlbHRhKTtcbiAgICAgIGRlbHRhQ2FjaGUuaW5nZXN0RGVsdGEoZGVsdGEpO1xuICAgICAgZGVsdGFDYWNoZS5pbmdlc3RUaHJlYWQodGhyZWFkKTtcbiAgICAgIGRlbHRhQ2FjaGUucHJldlRhc2sgPSBudWxsO1xuICAgICAgc2V0UmVuZGVyQ291bnRlcihjID0+IGMgKyAxKTtcblxuICAgICAgZm9yIChjb25zdCBzdWJzY3JpYmVyIG9mIGNhY2hlU3Vic2NyaWJlcnMpIHtcbiAgICAgICAgc3Vic2NyaWJlcigpO1xuICAgICAgfVxuICAgIH1cbiAgICBidXMudGhyZWFkLm9uUXVldWUgPSAocmVhc29uKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnW0luc2lnaHRdIE9uUXVldWUnKVxuICAgICAgY29uc3QgdGhyZWFkID0gY29udHJvbGxlci5nZXRUaHJlYWQoKTtcbiAgICAgIFxuICAgICAgaWYgKHRocmVhZC5yZWFzb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBpZiAoaW5zaWdodFN0YXRlLmJyZWFrT25CZWZvcmVVcGRhdGUpXG4gICAgICAgICAgY29udHJvbGxlci5zY2hlZHVsZXIuaW50ZXJjZXB0ID0gdHJ1ZTtcblxuICAgICAgICBjb21taXRDYWNoZS5zZXRUcmVlKGNvbnRyb2xsZXIuZ2V0VHJlZSgpKVxuICAgICAgICBcbiAgICAgICAgZGVsdGFDYWNoZS5yZXNldCgpO1xuICAgICAgICBkZWx0YUNhY2hlLmluZ2VzdFRocmVhZCh0aHJlYWQpO1xuICAgICAgICBzZXRSZW5kZXJDb3VudGVyKGMgPT4gYyArIDEpO1xuXG4gICAgICAgIGZvciAoY29uc3Qgc3Vic2NyaWJlciBvZiBjYWNoZVN1YnNjcmliZXJzKSB7XG4gICAgICAgICAgc3Vic2NyaWJlcigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGJ1cy50aHJlYWQub25Xb3JrID0gKHByZXZUYXNrLCBuZXh0VGFzaywgaXNEb25lKSA9PiB7XG5cbiAgICAgIGlmIChpbnNpZ2h0U3RhdGUuYnJlYWtPbkFmdGVyVXBkYXRlICYmIGlzRG9uZSkge1xuICAgICAgICBjb250cm9sbGVyLnNjaGVkdWxlci5pbnRlcmNlcHQgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKG5leHRUYXNrICYmIGluc2lnaHRTdGF0ZS5jb21taXRCcmVha3BvaW50cy5oYXMobmV4dFRhc2suaWQpKSB7XG4gICAgICAgIGNvbnRyb2xsZXIuc2NoZWR1bGVyLmludGVyY2VwdCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb250cm9sbGVyLnNjaGVkdWxlci5pbnRlcmNlcHQpIHtcbiAgICAgICAgY29uc3QgdGhyZWFkID0gY29udHJvbGxlci5nZXRUaHJlYWQoKTtcbiAgICAgICAgY29uc3QgZGVsdGEgPSBjb250cm9sbGVyLmdldERlbHRhKCk7XG4gICAgICAgIFxuICAgICAgICBkZWx0YUNhY2hlLmluZ2VzdERlbHRhKGRlbHRhKTtcbiAgICAgICAgZGVsdGFDYWNoZS5pbmdlc3RUaHJlYWQodGhyZWFkKTtcbiAgICAgICAgc2V0UmVuZGVyQ291bnRlcihjID0+IGMgKyAxKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHN1YnNjcmliZXIgb2YgY2FjaGVTdWJzY3JpYmVycykge1xuICAgICAgICAgIHN1YnNjcmliZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcmV2VGFzaylcbiAgICAgICAgICBkZWx0YUNhY2hlLnByZXZUYXNrID0gcHJldlRhc2s7XG4gICAgICB9XG4gICAgfVxuXG4gICAgb25SZWFkeSgpO1xuICB9LCBbY29udHJvbGxlciwgYnVzLCBpbnNpZ2h0U3RhdGVdKTtcblxuICBjb25zdCBjYWNoZVN1YnNjcmliZXJzID0gdXNlUmVmPFNldDwoKSA9PiB2b2lkPj4obmV3IFNldCgpKS5jdXJyZW50O1xuXG4gIGNvbnN0IHNjcm9sbFRvQ29tbWl0SW5kZXggPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gKGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgIGlmICghdmlld3BvcnRSZWYuY3VycmVudClcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY29uc3Qgdmlld1BvcnRSZWN0ID0gdmlld3BvcnRSZWYuY3VycmVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGlmIChpbmRleCkge1xuICAgICAgICB2aWV3cG9ydFJlZi5jdXJyZW50LnNjcm9sbFRvKHtcbiAgICAgICAgICB0b3A6IChpbmRleCAqIDMzKSAtICh2aWV3UG9ydFJlY3QuaGVpZ2h0IC8gMiksXG4gICAgICAgICAgYmVoYXZpb3I6ICdzbW9vdGgnXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IHsgbmV4dFRhc2ssIHByZXZUYXNrIH0gPSBkZWx0YUNhY2hlO1xuXG4gICAgY29uc3QgdGFzayA9IG5leHRUYXNrIHx8IHByZXZUYXNrO1xuICAgIGNvbnN0IGluZGV4ID0gdGFzayAmJiBjb21taXRzLmZpbmRJbmRleChjID0+IChuZXh0VGFzayAmJiBjLmlkID09PSBuZXh0VGFzay5pZCkgfHwgKHByZXZUYXNrICYmIHByZXZUYXNrLmlkID09PSBjLmlkKSk7XG4gICAgXG4gICAgaWYgKGluZGV4ICYmIGluZGV4ICE9PSAtMSkge1xuICAgICAgc2Nyb2xsVG9Db21taXRJbmRleChpbmRleCk7XG4gICAgfVxuICB9LCBbZGVsdGFDYWNoZS5wcmV2VGFzaywgZGVsdGFDYWNoZS5uZXh0VGFzaywgc2Nyb2xsVG9Db21taXRJbmRleF0pXG5cbiAgY29uc3QgcmVuZGVyQ29tbWl0ID0gdXNlTWVtbygoKSA9PiAoY29tbWl0SWQ6IENvbW1pdElEKSA9PiB7XG4gICAgcmV0dXJuIGgoQ29tbWl0Q29tcG9uZW50LCB7IGNvbW1pdElkIH0pXG4gIH0sIFtdKTtcblxuICBjb25zdCBDb21taXRDb21wb25lbnQgPSB1c2VNZW1vKCgpOiBDb21wb25lbnQ8eyBjb21taXRJZDogQ29tbWl0SUQgfT4gPT4gKHsgY29tbWl0SWQgfSkgPT4ge1xuICAgIGNvbnN0IFtjLCBzZXRSZW5kZXJDb3VudGVyXSA9IHVzZVN0YXRlKDApO1xuXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgY29tbWl0ID0gZGVsdGFDYWNoZS5hbGwuZ2V0KGNvbW1pdElkKTtcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxDb21taXQgPSBjb21taXRDYWNoZS5tYXAuZ2V0KGNvbW1pdElkKTtcblxuICAgICAgICBjb25zdCBpblRhc2tMaXN0ID0gZGVsdGFDYWNoZS5hbGxUYXNrcy5oYXMoY29tbWl0SWQpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGNvbW1pdCAhPT0gb3JpZ2luYWxDb21taXQgfHwgaW5UYXNrTGlzdCB8fCAoZGVsdGFDYWNoZS5wcmV2VGFzayAmJiBkZWx0YUNhY2hlLnByZXZUYXNrLmlkID09PSBjb21taXRJZCkpXG4gICAgICAgICAgc2V0UmVuZGVyQ291bnRlcihjID0+IGMgKyAxKTtcbiAgICAgIH1cbiAgICAgIGNhY2hlU3Vic2NyaWJlcnMuYWRkKHN1YnNjcmlwdGlvbik7XG4gICAgICBzdWJzY3JpcHRpb24oKTtcblxuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYFtDb21taXRdIENsZWFuaW5nIHVwICR7Y29tbWl0SWR9YClcbiAgICAgICAgY2FjaGVTdWJzY3JpYmVycy5kZWxldGUoc3Vic2NyaXB0aW9uKTtcbiAgICAgIH1cbiAgICB9LCBbY29tbWl0SWRdKVxuXG4gICAgY29uc3QgY29tbWl0ID0gZGVsdGFDYWNoZS5hbGwuZ2V0KGNvbW1pdElkKSB8fCBudWxsO1xuICAgIGlmICghY29tbWl0KVxuICAgICAgcmV0dXJuIChjb25zb2xlLndhcm4oYFtDb21taXRdIENvbW1pdCAke2NvbW1pdElkfSBub3QgZm91bmQgaW4gZGVsdGEgY2FjaGVgKSwgbnVsbCk7XG5cbiAgICBjb25zdCBjb2xvciA9IFxuICAgICAgKGRlbHRhQ2FjaGUubmV4dFRhc2sgJiYgZGVsdGFDYWNoZS5uZXh0VGFzay5pZCA9PT0gY29tbWl0LmlkKSA/ICcjZTFkNjAwZmYnXG4gICAgICA6IGRlbHRhQ2FjaGUudGFyZ2V0cy5oYXMoY29tbWl0LmlkKSA/ICcjZGI1NWU3ZmYnXG4gICAgICA6IGRlbHRhQ2FjaGUuYWxsVGFza3MuaGFzKGNvbW1pdC5pZCkgPyAnI2VhOTMxYWZmJ1xuICAgICAgOiBkZWx0YUNhY2hlLmNyZWF0ZWQuaGFzKGNvbW1pdC5pZCkgPyAoZGVsdGFDYWNoZS5wcmV2VGFzayAmJiBkZWx0YUNhY2hlLnByZXZUYXNrLmlkID09PSBjb21taXQuaWQgPyAnIzRiYzg0N2ZmJyA6ICcjMjFhNTFjZmYnKVxuICAgICAgOiBkZWx0YUNhY2hlLnJlbW92ZWQuaGFzKGNvbW1pdC5pZCkgPyAnI2YyNTI1MmZmJ1xuICAgICAgOiBkZWx0YUNhY2hlLnVwZGF0ZWQuaGFzKGNvbW1pdC5pZCkgPyAnIzFhYjllYWZmJ1xuICAgICAgOiBkZWx0YUNhY2hlLnZpc2l0ZWQuaGFzKGNvbW1pdC5pZCkgPyAnIzZmNmY5N2ZmJ1xuICAgICAgOiAnI2NhY2FjYSc7XG4gICAgXG4gICAgaWYgKCFjb21taXQpXG4gICAgICByZXR1cm4gKGNvbnNvbGUubG9nKGBbQ29tbWl0XSAke2NvbW1pdElkfSBub3QgcmVhZHkgeWV0Pz9gKSwgbnVsbCk7XG5cbiAgICByZXR1cm4gdXNlTWVtbygoKSA9PiBoKENvbW1pdFByZXZpZXcsIHsgY29tbWl0LCByZW5kZXJDb21taXQsIGNvbG9yLCBvbkNsaWNrOiAoKSA9PiBzZXRTZWxlY3RlZENvbW1pdElkKGNvbW1pdC5pZCkgfSksIFtcbiAgICAgIGNvbW1pdC52ZXJzaW9uLFxuICAgICAgY29sb3IsXG4gICAgXSlcbiAgfSwgW10pXG5cbiAgY29uc3QgcmVsb2FkID0gKCkgPT4ge1xuICAgIGNvbW1pdENhY2hlLnNldFRyZWUoY29udHJvbGxlci5nZXRUcmVlKCkpXG4gICAgZGVsdGFDYWNoZS5yZXNldCgpO1xuICAgIGRlbHRhQ2FjaGUuaW5nZXN0RGVsdGEoY29udHJvbGxlci5nZXREZWx0YSgpKTtcbiAgICBkZWx0YUNhY2hlLmluZ2VzdFRocmVhZChjb250cm9sbGVyLmdldFRocmVhZCgpKTtcblxuICAgIHNldFJlbmRlckNvdW50ZXIoYyA9PiBjICsgMSlcbiAgfVxuXG4gIGNvbnN0IHZpZXdwb3J0UmVmID0gdXNlUmVmPEhUTUxFbGVtZW50IHwgbnVsbD4obnVsbCk7XG5cbiAgY29uc3QgW3NlbGVjdGVkQ29tbWl0SWQsIHNldFNlbGVjdGVkQ29tbWl0SWRdID0gdXNlU3RhdGU8Q29tbWl0SUQgfCBudWxsPihudWxsKVxuICBjb25zdCBbc2VsZWN0ZWRDb21taXREZXRhaWxzLCBzZXRTZWxlY3RlZENvbW1pdERldGFpbHNdID0gdXNlU3RhdGU8Q29tbWl0RGV0YWlsc1JlcG9ydCB8IG51bGw+KG51bGwpXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXNlbGVjdGVkQ29tbWl0SWQpXG4gICAgICByZXR1cm47XG5cbiAgICBjb25zdCBkZXRhaWxzID0gY29udHJvbGxlci5nZXREZXRhaWxzKHNlbGVjdGVkQ29tbWl0SWQpO1xuICAgIHNldFNlbGVjdGVkQ29tbWl0RGV0YWlscyhkZXRhaWxzKVxuICB9LCBbc2VsZWN0ZWRDb21taXRJZF0pXG5cbiAgY29uc3Qgcm9vdHMgPSBbLi4uZGVsdGFDYWNoZS5yb290cy5rZXlzKCldO1xuICBjb25zdCBjb21taXRzID0gZGVsdGFDYWNoZS5nZXRGbGF0KCk7XG5cbiAgY29uc3QgQ0hVTktfU0laRSA9IDg7XG5cbiAgcmV0dXJuIGgoJ2RpdicsIHsgc3R5bGU6IHsgZGlzcGxheTogJ2ZsZXgnLCAnZmxleC1kaXJlY3Rpb24nOiAnY29sdW1uJywgcG9zaXRpb246ICdhYnNvbHV0ZScsIHRvcDogMCwgbGVmdDogMCwgcmlnaHQ6IDAsIGJvdHRvbTogMCB9IH0sIFtcbiAgICBoKCdkaXYnLCB7IHN0eWxlOiB7IGZsZXg6IDAsIGRpc3BsYXk6ICdmbGV4JyB9IH0sIFtcbiAgICAgIGgoU2NoZWR1bGVDb250cm9scywge1xuICAgICAgICBjb250cm9sbGVyOiBjb250cm9sbGVyLnNjaGVkdWxlcixcbiAgICAgICAgYnVzOiBidXMuc2NoZWR1bGVyLFxuICAgICAgICByZWNvbmNpbGVyOiBjb250cm9sbGVyLFxuXG4gICAgICAgIHN0YXRlOiBpbnNpZ2h0U3RhdGUsXG4gICAgICAgIG9uU3RhdGVDaGFuZ2U6IHNldEluc2lnaHRTdGF0ZSxcbiAgICAgIH0pLFxuICAgICAgaCgnYnV0dG9uJywgeyBvbkNsaWNrOiByZWxvYWR9LCAnUmVsb2FkJyksXG4gICAgXSksXG4gICAgaCgnZGl2JywgeyBzdHlsZTogeyBmbGV4OiAxLCBvdmVyZmxvdzogJ2hpZGRlbicsIGJhY2tncm91bmQ6ICcjYzBkN2RkZmYnLCBkaXNwbGF5OiAnZmxleCcgfSB9LCBbXG4gICAgICBoKCdkaXYnLCB7IHN0eWxlOiB7IGZsZXg6IDEgfSB9LFxuICAgICAgICAvL2goVHJlZVZpZXdlciwgeyByb290cywgcmVuZGVyQ29tbWl0IH0pLFxuICAgICAgICBoKFZpcnR1YWwxRCwgeyB2aWV3cG9ydFJlZiwgd2luZG93UmFuZ2U6IDUsIGNodW5rQ291bnQ6IGNvbW1pdHMubGVuZ3RoIC8gQ0hVTktfU0laRSwgY2h1bmtTaXplOiAoMzMgKiBDSFVOS19TSVpFKSwgcmVuZGVyQ2h1bmsoaW5kZXgpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPCAwKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICByZXR1cm4gQXJyYXkuZnJvbSh7IGxlbmd0aDogQ0hVTktfU0laRSB9KS5tYXAoKF8sIGNodW5rSW5kZXgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcG9ydCA9IGNvbW1pdHNbKGluZGV4ICAqIENIVU5LX1NJWkUpICsgKGNodW5rSW5kZXgpXTtcbiAgICAgICAgICAgIGlmICghcmVwb3J0KVxuICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgICAgICAgICAgY29uc3QgY29sb3IgPSBnZXRDb21taXRDb2xvcihkZWx0YUNhY2hlLCByZXBvcnQuaWQpO1xuXG4gICAgICAgICAgICBjb25zdCBvbkNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICBzZXRTZWxlY3RlZENvbW1pdElkKHJlcG9ydC5pZCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlczogW3N0cmluZywgc3RyaW5nXVtdID0gW1xuICAgICAgICAgICAgICBpbnNpZ2h0U3RhdGUuY29tbWl0QnJlYWtwb2ludHMuaGFzKHJlcG9ydC5pZCkgPyBbJ0JyZWFrcG9pbnQnLCAnRW5hYmxlZCddIGFzIFtzdHJpbmcsIHN0cmluZ10gOiBudWxsXG4gICAgICAgICAgICBdLmZpbHRlcih4ID0+ICEheClcblxuICAgICAgICAgICAgcmV0dXJuIGgoJ2RpdicsIHsgc3R5bGU6IHsgJ21hcmdpbi1sZWZ0JzogKChyZXBvcnQuZGlzdGFuY2UgLSAxKSAqIDMyKSArICdweCcsIGhlaWdodDogJzMzcHgnIH0gfSwgW1xuICAgICAgICAgICAgICBoKENvbW1pdFByZXZpZXcsIHsgY29sb3IsIGNvbW1pdDogcmVwb3J0LCBvbkNsaWNrLCBhdHRyaWJ1dGVzIH0pXG4gICAgICAgICAgICBdKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9LCB9KVxuICAgICAgKSxcbiAgICAgIGgoJ2RpdicsIHsgc3R5bGU6IHsgJ21pbi13aWR0aCc6ICczMDBweCcsIGZsZXg6IDAsIGJhY2tncm91bmQ6ICcjZmZkZWFiZmYnIH0gfSwgW1xuICAgICAgICBkZWx0YUNhY2hlLnRocmVhZCAmJiBoKCdkaXYnLCB7IH0sIFtcbiAgICAgICAgICBoKCdkbCcsIHt9LCBbXG4gICAgICAgICAgICBoKCdkdCcsIHt9LCAnVGhyZWFkIElEJyksXG4gICAgICAgICAgICBoKCdkZCcsIHt9LCBkZWx0YUNhY2hlLnRocmVhZC5pZCksXG4gICAgICAgICAgICBoKCdkdCcsIHt9LCAnVGhyZWFkIERvbmUnKSxcbiAgICAgICAgICAgIGgoJ2RkJywge30sIGRlbHRhQ2FjaGUudGhyZWFkLmRvbmUudG9TdHJpbmcoKSksXG4gICAgICAgICAgICBoKCdkdCcsIHt9LCAnVGhyZWFkIFBhc3NlcycpLFxuICAgICAgICAgICAgaCgnZGQnLCB7fSwgZGVsdGFDYWNoZS50aHJlYWQucGFzc2VzKSxcbiAgICAgICAgICAgIGgoJ2R0Jywge30sICdUYXNrcyAoY291bnQpJyksXG4gICAgICAgICAgICBoKCdkZCcsIHt9LCBkZWx0YUNhY2hlLnRocmVhZC5wZW5kaW5nVGFza3MubGVuZ3RoKSxcbiAgICAgICAgICAgIGgoJ2R0Jywge30sICdWaXNpdGVkIChjb3VudCknKSxcbiAgICAgICAgICAgIGgoJ2RkJywge30sIGRlbHRhQ2FjaGUudGhyZWFkLnZpc2l0ZWQubGVuZ3RoKSxcbiAgICAgICAgICAgIGgoJ2R0Jywge30sICdDcmVhdGVkIChjb3VudCknKSxcbiAgICAgICAgICAgIGgoJ2RkJywge30sIGRlbHRhQ2FjaGUuY3JlYXRlZC5zaXplKSxcbiAgICAgICAgICAgIGgoJ2R0Jywge30sICdVcGRhdGVkIChjb3VudCknKSxcbiAgICAgICAgICAgIGgoJ2RkJywge30sIGRlbHRhQ2FjaGUudXBkYXRlZC5zaXplKSxcbiAgICAgICAgICAgIGgoJ2R0Jywge30sICdSZW1vdmVkIChjb3VudCknKSxcbiAgICAgICAgICAgIGgoJ2RkJywge30sIGRlbHRhQ2FjaGUucmVtb3ZlZC5zaXplKSxcbiAgICAgICAgICAgIGgoJ2R0Jywge30sICdNdXN0UmVuZGVyICcpLFxuICAgICAgICAgICAgaCgnZGQnLCB7fSwgZGVsdGFDYWNoZS50aHJlYWQubXVzdFJlbmRlci5tYXAoY29tbWl0SWQgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBjb21taXQgPSBkZWx0YUNhY2hlLmFsbC5nZXQoY29tbWl0SWQpO1xuICAgICAgICAgICAgICBpZiAoIWNvbW1pdClcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgY29uc3QgY29sb3IgPSBnZXRDb21taXRDb2xvcihkZWx0YUNhY2hlLCBjb21taXRJZCk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIGgoQ29tbWl0UHJldmlldywge1xuICAgICAgICAgICAgICAgIGNvbW1pdCxcbiAgICAgICAgICAgICAgICBjb2xvcixcbiAgICAgICAgICAgICAgICBvbkNsaWNrOiAoKSA9PiAoc2Nyb2xsVG9Db21taXRJbmRleChjb21taXRzLmluZGV4T2YoY29tbWl0KSksIHNldFNlbGVjdGVkQ29tbWl0SWQoY29tbWl0SWQpKVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSkpLFxuICAgICAgICAgICAgaCgnZHQnLCB7fSwgJ01pc3NlZCcpLFxuICAgICAgICAgICAgaCgnZGQnLCB7fSwgZGVsdGFDYWNoZS50aHJlYWQubWlzc2VkLm1hcChjb21taXRJZCA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGNvbW1pdCA9IGRlbHRhQ2FjaGUuYWxsLmdldChjb21taXRJZCk7XG4gICAgICAgICAgICAgIGlmICghY29tbWl0KVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICBjb25zdCBjb2xvciA9IGdldENvbW1pdENvbG9yKGRlbHRhQ2FjaGUsIGNvbW1pdElkKTtcblxuICAgICAgICAgICAgICByZXR1cm4gaChDb21taXRQcmV2aWV3LCB7XG4gICAgICAgICAgICAgICAgY29tbWl0LFxuICAgICAgICAgICAgICAgIGNvbG9yLFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s6ICgpID0+IChzY3JvbGxUb0NvbW1pdEluZGV4KGNvbW1pdHMuaW5kZXhPZihjb21taXQpKSwgc2V0U2VsZWN0ZWRDb21taXRJZChjb21taXRJZCkpXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KSksXG4gICAgICAgICAgXSlcbiAgICAgICAgXSksXG4gICAgICAgIGgoJ2hyJyksXG4gICAgICAgIHNlbGVjdGVkQ29tbWl0RGV0YWlscyAmJiBbXG4gICAgICAgICAgaChDb21taXRQcmV2aWV3LCB7XG4gICAgICAgICAgICBjb21taXQ6IHNlbGVjdGVkQ29tbWl0RGV0YWlscy5jb21taXQsXG4gICAgICAgICAgICBjb2xvcjogZ2V0Q29tbWl0Q29sb3IoZGVsdGFDYWNoZSwgc2VsZWN0ZWRDb21taXREZXRhaWxzLmNvbW1pdC5pZCksXG4gICAgICAgICAgICBvbkNsaWNrOiAoKSA9PiAoc2Nyb2xsVG9Db21taXRJbmRleChjb21taXRzLmluZGV4T2Yoc2VsZWN0ZWRDb21taXREZXRhaWxzLmNvbW1pdCkpLCBzZXRTZWxlY3RlZENvbW1pdElkKHNlbGVjdGVkQ29tbWl0RGV0YWlscy5jb21taXQuaWQpKVxuICAgICAgICAgIH0pLFxuICAgICAgICAgIGgoJ2J1dHRvbicsIHsgb25DbGljazogKCkgPT4ge1xuICAgICAgICAgICAgc2V0SW5zaWdodFN0YXRlKHN0YXRlID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgcHJldiA9IHN0YXRlLmNvbW1pdEJyZWFrcG9pbnRzO1xuICAgICAgICAgICAgICBpZiAocHJldi5oYXMoc2VsZWN0ZWRDb21taXREZXRhaWxzLmNvbW1pdC5pZCkpIHtcbiAgICAgICAgICAgICAgICBwcmV2LmRlbGV0ZShzZWxlY3RlZENvbW1pdERldGFpbHMuY29tbWl0LmlkKVxuICAgICAgICAgICAgICAgIHJldHVybiB7IC4uLnN0YXRlLCBjb21taXRCcmVha3BvaW50czogbmV3IFNldChwcmV2KSB9O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHByZXYuYWRkKHNlbGVjdGVkQ29tbWl0RGV0YWlscy5jb21taXQuaWQpXG4gICAgICAgICAgICAgIHJldHVybiB7IC4uLnN0YXRlLCBjb21taXRCcmVha3BvaW50czogbmV3IFNldChwcmV2KSB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH19LCAnVG9nZ2xlIEJyZWFrcG9pbnQnKSxcbiAgICAgICAgICBoKCdoMycsIHt9LCAnUGFyZW50JyksXG4gICAgICAgICAgKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudElkID0gc2VsZWN0ZWRDb21taXREZXRhaWxzLmNvbW1pdC5wYXJlbnQ7XG4gICAgICAgICAgICBpZiAoIXBhcmVudElkKVxuICAgICAgICAgICAgICByZXR1cm4gJ05PIFBBUkVOVCc7XG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBkZWx0YUNhY2hlLmFsbC5nZXQocGFyZW50SWQpO1xuICAgICAgICAgICAgaWYgKCFwYXJlbnQpXG4gICAgICAgICAgICAgIHJldHVybiBoKENvbW1pdEF0dHJpYnV0ZVRhZywgeyBuYW1lOiAnUGFyZW50SUQnLCB2YWx1ZTogcGFyZW50SWQudG9TdHJpbmcoKSB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGgoQ29tbWl0UHJldmlldywge1xuICAgICAgICAgICAgICBjb21taXQ6IHBhcmVudCxcbiAgICAgICAgICAgICAgY29sb3I6IGdldENvbW1pdENvbG9yKGRlbHRhQ2FjaGUsIHBhcmVudC5pZCksXG4gICAgICAgICAgICAgIG9uQ2xpY2s6ICgpID0+IChzY3JvbGxUb0NvbW1pdEluZGV4KGNvbW1pdHMuaW5kZXhPZihwYXJlbnQpKSwgc2V0U2VsZWN0ZWRDb21taXRJZChwYXJlbnQuaWQpKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSkoKSxcbiAgICAgICAgICBoKCdoMycsIHt9LCAnUHJvcHMnKSxcbiAgICAgICAgICBoKCd1bCcsIHt9LFxuICAgICAgICAgICAgT2JqZWN0LmVudHJpZXMoc2VsZWN0ZWRDb21taXREZXRhaWxzLnByb3BzKS5tYXAoKFtwcm9wLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIGgoJ2xpJywge30sIGAke3Byb3B9ID0gJHtnZXRUZXh0Rm9yVmFsdWUodmFsdWUpfWApO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICApXG4gICAgICAgIF1cbiAgICAgIF0pXG4gICAgXSlcbiAgXSlcbn1cblxuXG5leHBvcnQgY29uc3QgZ2V0VGV4dEZvclZhbHVlID0gKHZhbHVlOiBWYWx1ZVJlcG9ydCk6IHN0cmluZyA9PiB7XG4gIHN3aXRjaCAodmFsdWUudHlwZSkge1xuICAgIGNhc2UgJ3ByaW1pdGl2ZSc6XG4gICAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZS52YWx1ZSkge1xuICAgICAgICBjYXNlICdvYmplY3QnOlxuICAgICAgICAgIHJldHVybiBgbnVsbGA7XG4gICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgIHJldHVybiB2YWx1ZS52YWx1ZS50b1N0cmluZygpO1xuICAgICAgfVxuICAgIGNhc2UgJ2NvbXBsZXgnOlxuICAgICAgcmV0dXJuIHZhbHVlLm5hbWU7XG4gICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgIHJldHVybiBgdW5kZWZpbmVkYDtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICB2YWx1ZTtcbiAgfVxufVxuXG5jb25zdCBnZXRDb21taXRDb2xvciA9IChkZWx0YUNhY2hlOiBUaHJlYWRMb29rdXBDYWNoZSwgY29tbWl0SWQ6IENvbW1pdElEKSA9PiB7XG5cbiAgY29uc3QgY29sb3IgPSBcbiAgICAoZGVsdGFDYWNoZS5uZXh0VGFzayAmJiBkZWx0YUNhY2hlLm5leHRUYXNrLmlkID09PSBjb21taXRJZCkgPyAnI2UxZDYwMGZmJ1xuICAgIDogZGVsdGFDYWNoZS50YXJnZXRzLmhhcyhjb21taXRJZCkgPyAnI2RiNTVlN2ZmJ1xuICAgIDogZGVsdGFDYWNoZS5hbGxUYXNrcy5oYXMoY29tbWl0SWQpID8gJyNlYTkzMWFmZidcbiAgICA6IGRlbHRhQ2FjaGUuY3JlYXRlZC5oYXMoY29tbWl0SWQpID8gKGRlbHRhQ2FjaGUucHJldlRhc2sgJiYgZGVsdGFDYWNoZS5wcmV2VGFzay5pZCA9PT0gY29tbWl0SWQgPyAnIzRiYzg0N2ZmJyA6ICcjMjFhNTFjZmYnKVxuICAgIDogZGVsdGFDYWNoZS5yZW1vdmVkLmhhcyhjb21taXRJZCkgPyAnI2YyNTI1MmZmJ1xuICAgIDogZGVsdGFDYWNoZS51cGRhdGVkLmhhcyhjb21taXRJZCkgPyAnIzFhYjllYWZmJ1xuICAgIDogZGVsdGFDYWNoZS52aXNpdGVkLmhhcyhjb21taXRJZCkgPyAnIzZmNmY5N2ZmJ1xuICAgIDogJyNjYWNhY2EnO1xuXG4gIHJldHVybiBjb2xvcjtcbn0iLCAiXG5pbXBvcnQgeyBoLCBOb2RlIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuaW1wb3J0IHsgTm9kZUJ1aWxkZXIsIFJlbmRlclNwYWNlMiB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3QtYmFja3N0YWdlXCI7XG5pbXBvcnQgeyBjcmVhdGVEZWJ1Z1NjaGVkdWxlciwgRGVidWdSZWNvbmNpbGVyIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdC1kZWJ1Z1wiO1xuaW1wb3J0IHsgY3JlYXRlV2ViTm9kZUJ1aWxkZXIsIEhUTUwsIHJlbmRlciB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3Qtd2ViXCI7XG5pbXBvcnQgeyBJbnNpZ2h0QXBwIH0gZnJvbSBcIi4vSW5zaWdodEFwcFwiO1xuaW1wb3J0IHsgUmVjb25jaWxlcjIgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0LXJlY29uXCI7XG5cbmV4cG9ydCB0eXBlIERldk9wdGlvbnMgPSB7XG4gIG1vZGU/OiAnZXh0ZW5zaW9uJyB8ICdwb3B1cCcgfCAnbm9uZSdcbn07XG5cbmV4cG9ydCBjb25zdCByZW5kZXJERVYgPSAobm9kZTogTm9kZSwgYnVpbGRlcnM6IE5vZGVCdWlsZGVyPGFueSwgYW55PltdLCB7IG1vZGUgPSAnbm9uZScgfTogRGV2T3B0aW9ucyA9IHt9KSA9PiB7XG4gIGNvbnN0IHJlY29uY2lsZXIgPSBuZXcgRGVidWdSZWNvbmNpbGVyKCk7XG4gIGNvbnN0IHNwYWNlcyA9IGJ1aWxkZXJzLm1hcChidWlsZGVyID0+IG5ldyBSZW5kZXJTcGFjZTIocmVjb25jaWxlci50cmVlLCBidWlsZGVyKSk7XG4gIFxuICByZWNvbmNpbGVyLmJ1cyA9IHtcbiAgICByZW5kZXIoZGVsdGEpIHtcbiAgICAgIGZvciAoY29uc3Qgc3BhY2Ugb2Ygc3BhY2VzKVxuICAgICAgICBzcGFjZS5jcmVhdGUoZGVsdGEpO1xuICAgICAgZm9yIChjb25zdCBzcGFjZSBvZiBzcGFjZXMpXG4gICAgICAgIHNwYWNlLnVwZGF0ZShkZWx0YSk7XG4gICAgfSxcbiAgfVxuICBzd2l0Y2ggKG1vZGUpIHtcbiAgICBjYXNlICdwb3B1cCc6XG4gICAgICBjcmVhdGVEZWJ1Z1BvcHVwKHJlY29uY2lsZXIpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgfVxuXG4gIGNvbnN0IHJlZiA9IHJlY29uY2lsZXIubW91bnQobm9kZSk7XG4gIHJldHVybiB7cmVmLCByZWNvbmNpbGVyfVxufVxuXG5cbmV4cG9ydCBjb25zdCBjcmVhdGVEZWJ1Z1BvcHVwID0gYXN5bmMgKHJlY29uY2lsZXI6IERlYnVnUmVjb25jaWxlcikgPT4ge1xuICBjb25zdCBuZXdXaW5kb3cgPSB3aW5kb3cub3BlbignJywgXCJEZXZUb29sc1wiLCBcInBvcHVwXCIpO1xuICBpZiAoIW5ld1dpbmRvdylcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byBtYWtlL2ZpbmQgbmV3IHdpbmRvdyFgKTtcblxuICBjb25zdCBib2R5ID0gbmV3V2luZG93LmRvY3VtZW50LmJvZHk7XG4gIGZvciAoY29uc3QgY2hpbGQgb2YgWy4uLmJvZHkuY2hpbGROb2RlcywgLi4ubmV3V2luZG93LmRvY3VtZW50LmhlYWQuY2hpbGROb2Rlc10pXG4gICAgY2hpbGQucmVtb3ZlKCk7XG5cbiAgZm9yIChjb25zdCBoZWFkRWxlbWVudCBvZiBbLi4ud2luZG93LmRvY3VtZW50LmhlYWQuY2hpbGROb2Rlc10pXG4gICAgaWYgKGhlYWRFbGVtZW50IGluc3RhbmNlb2YgSFRNTFN0eWxlRWxlbWVudClcbiAgICAgICAgbmV3V2luZG93LmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoaGVhZEVsZW1lbnQuY2xvbmVOb2RlKHRydWUpKVxuICAgIGVsc2UgaWYgKGhlYWRFbGVtZW50IGluc3RhbmNlb2YgSFRNTExpbmtFbGVtZW50KSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gaGVhZEVsZW1lbnQuY2xvbmVOb2RlKHRydWUpIGFzIEhUTUxMaW5rRWxlbWVudDtcbiAgICAgIGNvbnN0IHNyYyA9IG5ldyBVUkwoZWxlbWVudC5ocmVmLCBkb2N1bWVudC5sb2NhdGlvbi5ocmVmKTtcbiAgICAgIGVsZW1lbnQuaHJlZiA9IHNyYy5ocmVmO1xuICAgICAgbmV3V2luZG93LmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZWxlbWVudClcbiAgICB9XG4gICAgXG4gIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPihvblJlYWR5ID0+IHtcbiAgICByZW5kZXIoXG4gICAgICBoKEluc2lnaHRBcHAsIHsgY29udHJvbGxlcjogcmVjb25jaWxlci5jb250cm9sbGVyLCBidXM6IHJlY29uY2lsZXIuZGVidWdCdXMsIGRvY3VtZW50OiBuZXdXaW5kb3cuZG9jdW1lbnQsIG9uUmVhZHkgfSksXG4gICAgICBib2R5LFxuICAgICAgeyB3aW5kb3c6IG5ld1dpbmRvdyB9XG4gICAgKTtcbiAgfSlcblxufSIsICJpbXBvcnQgeyBjcmVhdGVXZWJOb2RlQnVpbGRlciwgcmVoeWRyYXRlLCBTU1JQYXlsb2FkIH0gZnJvbSAnQGx1a2VrYWFsaW0vYWN0LXdlYic7XG5pbXBvcnQgeyBBcHAsIEh5ZHJhdGVNYXAgfSBmcm9tICcuL2FwcCc7XG5pbXBvcnQgeyBjcmVhdGVEZWJ1Z1BvcHVwIH0gZnJvbSAnQGx1a2VrYWFsaW0vYWN0LWluc2lnaHQnO1xuaW1wb3J0IHsgRGVidWdSZWNvbmNpbGVyIH0gZnJvbSAnQGx1a2VrYWFsaW0vYWN0LWRlYnVnJztcbmltcG9ydCB7IFJlbmRlclNwYWNlMiB9IGZyb20gJ0BsdWtla2FhbGltL2FjdC1iYWNrc3RhZ2UnO1xuXG5cbmNvbnN0IG1haW4gPSBhc3luYyAoKSA9PiB7XG4gIGNvbnN0IGRhdGFFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ1NTUi1EQVRBJylcbiAgY29uc3Qgcm9vdEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnU1NSLVJPT1QnKVxuICBpZiAoIWRhdGFFbGVtZW50IHx8ICFyb290RWxlbWVudClcbiAgICByZXR1cm47XG5cbiAgY29uc3QgcGF5bG9hZCA9IEpTT04ucGFyc2UoZGF0YUVsZW1lbnQuaW5uZXJUZXh0KSBhcyBTU1JQYXlsb2FkO1xuXG4gIGNvbnN0IHJlY29uY2lsZXIgPSBuZXcgRGVidWdSZWNvbmNpbGVyKCk7XG4gIGNvbnN0IHNwYWNlID0gbmV3IFJlbmRlclNwYWNlMihyZWNvbmNpbGVyLnRyZWUsIGNyZWF0ZVdlYk5vZGVCdWlsZGVyKHJvb3RFbGVtZW50KSlcblxuICBhd2FpdCBjcmVhdGVEZWJ1Z1BvcHVwKHJlY29uY2lsZXIpXG5cbiAgcmVoeWRyYXRlKEh5ZHJhdGVNYXAsIHJlY29uY2lsZXIsIHNwYWNlLCBwYXlsb2FkKTtcblxuICByZWNvbmNpbGVyLmRlYnVnQnVzLmV4dGVybmFsVXBkYXRlKCk7XG59XG5cbm1haW4oKTsiXSwKICAibWFwcGluZ3MiOiAiOzs7QUFPQSxNQUFNLGdCQUNOO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFhRSxLQUFLO0FBRUEsTUFBTSwwQkFBTixjQUFzQyxNQUFNO0FBQUEsSUFDakQsY0FBYztBQUNaLFlBQU0sYUFBYTtBQUFBLElBQ3JCO0FBQUEsRUFDRjtBQUdBLE1BQU0scUJBQ047QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNRSxLQUFLO0FBQ0EsTUFBTSxxQkFBTixjQUFpQyxNQUFNO0FBQUEsSUFDNUMsY0FBYztBQUNaLFlBQU0sa0JBQWtCO0FBQUEsSUFDMUI7QUFBQSxFQUNGOzs7QUNsQ0EsTUFBTSw0QkFBNEIsTUFBTTtBQUN0QyxVQUFNLElBQUksd0JBQXdCO0FBQUEsRUFDcEM7QUFDTyxNQUFNLHFCQUF5QztBQUFBLElBQ3BELFVBQVU7QUFBQSxJQUNWLFdBQVc7QUFBQSxJQUNYLFlBQVk7QUFBQSxFQUNkO0FBT08sTUFBTSxpQkFBaUIsQ0FDNUIsc0JBQ007QUFDTixRQUFJLE9BQU8sc0JBQXNCO0FBQy9CLGFBQVEsa0JBQThCO0FBQ3hDLFdBQU87QUFBQSxFQUNUO0FBQ08sTUFBTSxzQkFBc0IsQ0FBQyxNQUFZLFNBQWU7QUFDN0QsUUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFNLFFBQU87QUFDM0IsV0FDRSxLQUFLLFdBQVcsS0FBSyxVQUFV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QUFZLFVBQVUsSUFBSSxDQUFDO0FBQUEsZUFDMUQsdUJBQXVCLGlCQUFpQjtBQUMvQyxjQUFNLFVBQVUsWUFBWSxVQUFVLElBQUk7QUFDMUMsY0FBTSxNQUFNLElBQUksSUFBSSxRQUFRLE1BQU0sU0FBUyxTQUFTLElBQUk7QUFDeEQsZ0JBQVEsT0FBTyxJQUFJO0FBQ25CLGtCQUFVLFNBQVMsS0FBSyxZQUFZLE9BQU87QUFBQSxNQUM3QztBQUVGLFdBQU8sSUFBSSxRQUFjLGFBQVc7QUFDbEM7QUFBQSxRQUNFLEVBQUUsWUFBWSxFQUFFLFlBQVksV0FBVyxZQUFZLEtBQUssV0FBVyxVQUFVLFVBQVUsVUFBVSxVQUFVLFFBQVEsQ0FBQztBQUFBLFFBQ3BIO0FBQUEsUUFDQSxFQUFFLFFBQVEsVUFBVTtBQUFBLE1BQ3RCO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFFSDs7O0FDeERBLE1BQU0sT0FBTyxZQUFZO0FBQ3ZCLFVBQU0sY0FBYyxTQUFTLGVBQWUsVUFBVTtBQUN0RCxVQUFNLGNBQWMsU0FBUyxlQUFlLFVBQVU7QUFDdEQsUUFBSSxDQUFDLGVBQWUsQ0FBQztBQUNuQjtBQUVGLFVBQU0sVUFBVSxLQUFLLE1BQU0sWUFBWSxTQUFTO0FBRWhELFVBQU0sYUFBYSxJQUFJLGdCQUFnQjtBQUN2QyxVQUFNLFFBQVEsSUFBSSxhQUFhLFdBQVcsTUFBTSxxQkFBcUIsV0FBVyxDQUFDO0FBRWpGLFVBQU0saUJBQWlCLFVBQVU7QUFFakMsY0FBVSxZQUFZLFlBQVksT0FBTyxPQUFPO0FBRWhELGVBQVcsU0FBUyxlQUFlO0FBQUEsRUFDckM7QUFFQSxPQUFLOyIsCiAgIm5hbWVzIjogWyJ3aW5kb3ciLCAibmV4dCIsICJwcmV2IiwgIndpbmRvdyIsICJwcmV2SW5kZXgiLCAidXNlQ29udGV4dCIsICJwcm92aWRlciIsICJyZWYiLCAidXNlU3RhdGUiLCAidXNlRWZmZWN0IiwgImNvbW1pdCIsICJlbGVtZW50QmFyIiwgImVsZW1lbnROYW1lIiwgImNvbW1pdCIsICJzZWxlY3RlZCIsICJjb21taXRMaXN0IiwgInRvcCIsICJjb21taXRBdHRyaWJ1dGVUYWciLCAiY29tbWl0QXR0cmlidXRlVGFnTmFtZSIsICJjb21taXRBdHRyaWJ1dGVUYWdWYWx1ZSIsICJkb2N1bWVudCIsICJjIiwgInNldFJlbmRlckNvdW50ZXIiLCAiY29tbWl0Il0KfQo=
