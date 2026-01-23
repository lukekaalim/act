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
      if (el instanceof Text)
        console.log("UPDATE", el, next, prev);
      setProps(window2, el, next, prev);
    },
    link(el, parent) {
      console.log("LINK", el, parent);
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
        if (!newChildren.includes(child))
          child.remove();
      if (newChildren.length < 2)
        return;
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
          if (next.element.type === specialNodeTypes.suspend)
            console.log(`Creating suspense node`, result);
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
          id = window.setTimeout(onTimeout, 0);
        }
      },
      cancelCallback() {
        if (id !== null)
          window.clearTimeout(id);
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
    function useContext(context) {
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
    return { useContext, useState: useState3, useEffect: useEffect2 };
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

  // ../renderers/web/rehydrate.ts
  var primitiveToSymbolMap = {
    //'primitive:string': primitiveNodeTypes.string,
    //'primitive:number': primitiveNodeTypes.number,
    //'primitive:boolean': primitiveNodeTypes.boolean,
    "primitive:null": primitiveNodeTypes.null,
    "primitive:array": primitiveNodeTypes.array,
    "special:placeholder": specialNodeTypes.placeholder,
    "special:render": specialNodeTypes.render,
    [primitiveNodeTypes.null]: "primitive:null",
    [primitiveNodeTypes.array]: "primitive:array",
    [specialNodeTypes.placeholder]: "special:placeholder",
    [specialNodeTypes.render]: "special:render"
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
  var App = ({ done, useSSREffect, useSSRState }) => {
    const [name, setName] = useState("World");
    const [beers, setBeers] = useSSRState("beers", []);
    function onInput(event) {
      setName(event.target.value);
    }
    useSSREffect(() => {
      fetch("https://api.sampleapis.com/beers/ale").then((r) => r.json()).then((payload) => setBeers(payload.map((d) => d.name)));
    }, []);
    useEffect(() => {
      if (beers.length > 0)
        done();
    }, [beers]);
    return h("article", {}, [
      h("h1", {}, `Hello, ${name}`),
      h(ChildComponent),
      h("input", { type: "text", value: name, onInput }),
      h("ol", {}, beers.map((beer) => h("li", {}, beer)))
    ]);
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
  var InsightApp = ({ controller, bus, document: document2 = window.document }) => {
    const [c, setRenderCounter] = useState(0);
    const [insightState, setInsightState] = useState({
      commitBreakpoints: /* @__PURE__ */ new Set(),
      breakOnAfterUpdate: false,
      breakOnBeforeUpdate: true,
      paused: false
    });
    const commitCache = useRef(() => new CommitLookupCache()).current;
    const deltaCache = useRef(() => new ThreadLookupCache(commitCache)).current;
    useMemo(() => {
      commitCache.setTree(controller.getTree());
      deltaCache.reset();
    }, []);
    useEffect(() => {
      console.log("[Insight] Populate Cache");
      bus.onThreadDone = (thread, delta) => {
        console.log("[Insight] ThreadDone");
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
          if (deltaCache.report)
            commitCache.ingest(deltaCache.report);
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
        })
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
  var createDebugPopup = (reconciler) => {
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
    console.log("=============POPUP RENDER=============");
    render(
      h(InsightApp, { controller: reconciler.controller, bus: reconciler.debugBus, document: newWindow.document }),
      body,
      { window: newWindow }
    );
  };

  // client.ts
  var main = () => {
    const commitDataElement = document.getElementById("COMMITS");
    const attachElement = document.getElementById("ATTACH");
    const stateElement = document.getElementById("STATE");
    if (!commitDataElement || !attachElement || !stateElement)
      return;
    const { commits, mountId } = JSON.parse(commitDataElement.innerText);
    const reconciler = new DebugReconciler();
    const space = new RenderSpace2(reconciler.tree, createWebNodeBuilder(attachElement));
    createDebugPopup(reconciler);
    const refs = /* @__PURE__ */ new Map();
    const elements = /* @__PURE__ */ new Map();
    const roots = [];
    const state = JSON.parse(stateElement.textContent);
    const useSSRState = (key, _) => {
      const [value, setValue] = useState(state[key]);
      return [value, setValue];
    };
    const useSSREffect = () => {
    };
    for (const commit of commits) {
      refs.set(commit.id, CommitRef2.rehydrate(commit.id, commit.distance));
      if (mountId === commit.id)
        elements.set(commit.id, h(App, { useSSREffect, useSSRState, done() {
          console.log("All done!");
        } }));
      else {
        const elementType = primitiveToSymbolMap[commit.elementType] || commit.elementType || specialNodeTypes.placeholder;
        const props = Object.fromEntries(commit.props);
        console.log(elementType, commit.props);
        elements.set(commit.id, h(elementType, props));
      }
    }
    for (const dehydratedCommit of commits) {
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
      const node = document.querySelector(`[data-commit-id="${commit.ref.id}"]`);
      if (node instanceof HTMLElement) {
        space.nodeByCommit.set(commit.ref.id, node);
        space.commitByNode.set(node, commit);
      }
      if (commit.element.type === specialNodeTypes.render) {
        space.roots.set(commit.ref.id, commit);
      }
      reconciler.tree.commits.set(commit.ref.id, commit);
    }
    const mountRef = refs.get(mountId);
    reconciler.bus.render = (delta) => {
      console.log({ delta });
      space.bus.render(delta);
    };
    console.log("=============ITS MY RENDER=============");
    reconciler.render(mountRef);
  };
  main();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vY29yZS9lcnJvcnMudHMiLCAiLi4vY29yZS9ob29rcy50cyIsICIuLi9jb3JlL2lkLnRzIiwgIi4uL2NvcmUvZWxlbWVudC50cyIsICIuLi9jb3JlL2NvbnRleHQudHMiLCAiLi4vY29yZS9ub2RlLnRzIiwgIi4uL2NvcmUvc3BlY2lhbC50cyIsICIuLi9jb3JlL21vZC50cyIsICIuLi9yZW5kZXJlcnMvd2ViL3Byb3BzLnRzIiwgIi4uL3JlbmRlcmVycy93ZWIvc3BhY2UudHMiLCAiLi4vcmVuZGVyZXJzL3dlYi9lbGVtZW50LnRzIiwgIi4uL3JlbmRlcmVycy9iYWNrc3RhZ2Uvc3BhY2UyLnRzIiwgIi4uL3JlbmRlcmVycy93ZWIvc2NoZWR1bGVyLnRzIiwgIi4uL3JlY29uL2FsZ29yaXRobXMudHMiLCAiLi4vcmVjb24vcG9vbC50cyIsICIuLi9yZWNvbi9jb21taXQudHMiLCAiLi4vcmVjb24vZGVsdGEudHMiLCAiLi4vcmVjb24vaG9va3MudHMiLCAiLi4vcmVjb24vdXBkYXRlLnRzIiwgIi4uL3JlY29uL2VsZW1lbnQudHMiLCAiLi4vcmVjb24vdGhyZWFkLnRzIiwgIi4uL3JlY29uL3N0YXRlLnRzIiwgIi4uL3JlY29uL3RyZWUudHMiLCAiLi4vcmVjb24vcmVjb25jaWxlci50cyIsICIuLi9yZW5kZXJlcnMvd2ViL3JlbmRlci50cyIsICIuLi9yZW5kZXJlcnMvd2ViL3JlaHlkcmF0ZS50cyIsICJhcHAudHMiLCAiLi4vbm9kZV9tb2R1bGVzL0BzaW5kcmVzb3JodXMvZm52MWEvaW5kZXguanMiLCAiLi4vbm9kZV9tb2R1bGVzL0BzaW5kcmVzb3JodXMvc3RyaW5nLWhhc2gvaW5kZXguanMiLCAiLi4vdG9vbGluZy9pbnNpZ2h0L1RyZWVWaWV3ZXIubW9kdWxlLmNzcyIsICIuLi90b29saW5nL2luc2lnaHQvQXR0cmlidXRlVGFnLm1vZHVsZS5jc3MiLCAiLi4vdG9vbGluZy9pbnNpZ2h0L0F0dHJpYnV0ZVRhZy50cyIsICIuLi90b29saW5nL2luc2lnaHQvVHJlZVZpZXdlci50cyIsICIuLi90b29saW5nL2RlYnVnL3V0aWxzLnRzIiwgIi4uL3Rvb2xpbmcvZGVidWcvcmVwb3J0LnRzIiwgIi4uL3Rvb2xpbmcvZGVidWcvc2NoZWR1bGVyLnRzIiwgIi4uL3Rvb2xpbmcvZGVidWcvcmVjb25jaWxlci50cyIsICIuLi90b29saW5nL2luc2lnaHQvU2NoZWR1bGVDb250cm9scy50cyIsICIuLi90b29saW5nL2luc2lnaHQvbG9va3VwLnRzIiwgIi4uL3Rvb2xpbmcvaW5zaWdodC9WaXJ0dWFsLnRzIiwgIi4uL3Rvb2xpbmcvaW5zaWdodC9JbnNpZ2h0QXBwLnRzIiwgIi4uL3Rvb2xpbmcvaW5zaWdodC91dGlscy50cyIsICJjbGllbnQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImV4cG9ydCBjbGFzcyBNYWdpY0Vycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihgQWRkaXRpb25hbCBtYWdpYyBpcyBuZWVkZWQgdG8gYmUgYWJsZSB0byBydW4gdGhpcyBmdW5jdGlvbmApO1xuICB9XG59XG5cblxuY29uc3QgdW5zZXRIb29rVGV4dCA9XG5gXG5BIGhvb2sgd2FzIHJ1biwgYnV0IGl0IGRpZG50IGhhdmUgYW55IGltcGxlbWVudGF0aW9ucyBzZXQgdXAgZm9yIGl0LlxuXG5UaGlzIGVycm9yIG1pZ2h0IGJlIGNhdXNlZCBieSBtYW51YWxseSBjYWxsaW5nIGEgY29tcG9uZW50IGZ1bmN0aW9uXG4ob3IgYSBob29rIGRpcmVjdGx5KSBvdXRzaWRlIG9mIGFjdCwgb3IgYnkgbXVsdGlwbGUgY29waWVzIG9mXG5BY3QgaW4gYSBwcm9qZWN0IGF0IG9uY2UhXG5cblRoZSByZW5kZXJlciBpcyBzdXBwb3NlZCB0byBzZXQgdXAgaW1wbGVtZW50YXRpb24gZm9yIGVhY2ggaG9vayBiZWZvcmVcbml0IHJ1bnMgdGhlIGNvbXBvbmVudC5cblxuQ2hlY2sgdGhlIGxvY2F0aW9uIG9mIHRoaXMgZXJyb3IsIGFuZCB3aGljaCB2ZXJzaW9uIG9mIGFjdCB5b3VyXG5yZW5kZXJlciB1c2VzIGludGVybmFseS4gWW91IG1pZ2h0IGdldCB0aGlzIGVycm9yIGlmIHRob3NlIGFyZSB0d29cbmRpZmZlcmVudCBwYWNrYWdlcyFcbmAudHJpbSgpO1xuXG5leHBvcnQgY2xhc3MgVW5zZXRIb29rSW1wbGVtZW50YXRpb24gZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKHVuc2V0SG9va1RleHQpO1xuICB9XG59XG5cblxuY29uc3QgdW5rbm93bkVsZW1lbnRUZXh0ID1cbmBcbkVuY291bnRlcmVkIGFuIG9iamVjdCB0aGF0IGlzIG5vdCBhbnkgb2YgdGhlIGV4cGVjdGVkIG5vZGUgdHlwZXMsIGxpa2VcbnN0cmluZywgbnVtYmVyLCBib29sZWFuLCBhcnJheSwgbnVsbCwgb3IgdGhlIHJlc3VsdCBvZiBhIGNhbGwgdG8gY3JlYXRlRWxlbWVudC5cblxuTWF5YmUgc29tZXRoaW5nIHdhcyBhY2NpZGVudGFsbHkgcmV0dXJuZWQgZnJvbSBhIENvbXBvbmVudCwgb3Igd2FzIHBhc3NlZFxuYXMgYSBjaGlsZCB0byBhbiBlbGVtZW50P1xuYC50cmltKCk7XG5leHBvcnQgY2xhc3MgVW5rbm93bkVsZW1lbnRUeXBlIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcih1bmtub3duRWxlbWVudFRleHQpXG4gIH1cbn0iLCAiaW1wb3J0IHsgQ29udGV4dCB9IGZyb20gXCIuL2NvbnRleHQudHNcIjtcbmltcG9ydCB7IFVuc2V0SG9va0ltcGxlbWVudGF0aW9uIH0gZnJvbSBcIi4vZXJyb3JzLnRzXCI7XG5cbmV4cG9ydCB0eXBlIEhvb2tJbXBsZW1lbnRhdGlvbiA9IHtcbiAgdXNlU3RhdGU6IHR5cGVvZiB1c2VTdGF0ZTtcbiAgdXNlRWZmZWN0OiB0eXBlb2YgdXNlRWZmZWN0O1xuICB1c2VDb250ZXh0OiB0eXBlb2YgdXNlQ29udGV4dDtcbn07XG5jb25zdCBwbGFjZWhvbGRlckltcGxlbWVudGF0aW9uID0gKCkgPT4ge1xuICB0aHJvdyBuZXcgVW5zZXRIb29rSW1wbGVtZW50YXRpb24oKTtcbn07XG5leHBvcnQgY29uc3QgaG9va0ltcGxlbWVudGF0aW9uOiBIb29rSW1wbGVtZW50YXRpb24gPSB7XG4gIHVzZVN0YXRlOiBwbGFjZWhvbGRlckltcGxlbWVudGF0aW9uLFxuICB1c2VFZmZlY3Q6IHBsYWNlaG9sZGVySW1wbGVtZW50YXRpb24sXG4gIHVzZUNvbnRleHQ6IHBsYWNlaG9sZGVySW1wbGVtZW50YXRpb24sXG59O1xuXG5leHBvcnQgdHlwZSBEZXBzID0gdW5rbm93bltdIHwgbnVsbDtcbmV4cG9ydCB0eXBlIFZhbHVlT3JDYWxjdWxhdG9yPFQ+ID1cbiAgfCBFeGNsdWRlPFQsICguLi5hcmdzOiB1bmtub3duW10pID0+IHVua25vd24+XG4gIHwgKCgpID0+IFQpO1xuXG5leHBvcnQgY29uc3QgY2FsY3VsYXRlVmFsdWUgPSA8VD4oXG4gIHZhbHVlT3JDYWxjdWxhdG9yOiBWYWx1ZU9yQ2FsY3VsYXRvcjxUPlxuKTogVCA9PiB7XG4gIGlmICh0eXBlb2YgdmFsdWVPckNhbGN1bGF0b3IgPT09IFwiZnVuY3Rpb25cIilcbiAgICByZXR1cm4gKHZhbHVlT3JDYWxjdWxhdG9yIGFzICgpID0+IFQpKCk7XG4gIHJldHVybiB2YWx1ZU9yQ2FsY3VsYXRvcjtcbn07XG5leHBvcnQgY29uc3QgY2FsY3VsYXRlRGVwc0NoYW5nZSA9IChwcmV2OiBEZXBzLCBuZXh0OiBEZXBzKSA9PiB7XG4gIGlmICghcHJldiB8fCAhbmV4dCkgcmV0dXJuIHRydWU7XG4gIHJldHVybiAoXG4gICAgcHJldi5sZW5ndGggIT09IG5leHQubGVuZ3RoIHx8IHByZXYuc29tZSgodmFsdWUsIGkpID0+IHZhbHVlICE9PSBuZXh0W2ldKVxuICApO1xufTtcbmV4cG9ydCBjb25zdCBydW5VcGRhdGVyID0gPFQ+KFxuICBwcmV2OiBULFxuICB1cGRhdGVyOiBVcGRhdGVyPFQ+XG4pOiBUID0+IHtcbiAgaWYgKHR5cGVvZiB1cGRhdGVyID09PSBcImZ1bmN0aW9uXCIpXG4gICAgcmV0dXJuICh1cGRhdGVyIGFzIChwcmV2OiBUKSA9PiBUKShwcmV2KTtcbiAgcmV0dXJuIHVwZGF0ZXI7XG59O1xuXG4vKipcbiAqIFVzZSBTdGF0ZVxuICpcbiAqIFN0b3JlIGEgdmFsdWUgaW5zaWRlIHRoZSBjb21wb25lbnQgc3RhdGUsIGFuZCBhcXVpcmVcbiAqIGFuZCBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIHVwZGF0ZSB0aGF0IHZhbHVlLFxuICogdHJpZ2dlciBhIHJlLXJlbmRlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHVzZVN0YXRlID0gPFQ+KFxuICBpbml0aWFsVmFsdWU6IFZhbHVlT3JDYWxjdWxhdG9yPFQ+XG4pOiBbVCwgU3RhdGVTZXR0ZXI8VD5dID0+IHtcbiAgcmV0dXJuIGhvb2tJbXBsZW1lbnRhdGlvbi51c2VTdGF0ZShpbml0aWFsVmFsdWUpO1xufTtcbmV4cG9ydCB0eXBlIFN0YXRlU2V0dGVyPFQ+ID0gKHVwZGF0ZXI6IFVwZGF0ZXI8VD4pID0+IHZvaWQ7XG5leHBvcnQgdHlwZSBVcGRhdGVyPFQ+ID0gVCB8ICgocHJldjogVCkgPT4gVCk7XG5cbi8qKlxuICogVXNlIEVmZmVjdFxuICpcbiAqIFBhc3NpbmcgYSBmdW5jdGlvbiBpbnRvIHRoaXMgaG9vayBjYXVzZXMgaXQgdG8gYmUgcnVuIGFmdGVyXG4gKiBhIHJlbmRlciBhcyBhICoqc2lkZSBlZmZlY3QqKi4gWW91IGRlZmluZSBfd2hpY2hfIHJlbmRlcnMgdGhpc1xuICogc2lkZSBlZmZlY3QgdHJpZ2dlcnMgdmlhIHNlY29uZCBhcmd1bWVudCwgYSAqKkRlcHMqKiBhcnJheS5cbiAqL1xuZXhwb3J0IGNvbnN0IHVzZUVmZmVjdCA9IChlZmZlY3Q6IEVmZmVjdENvbnN0cnVjdG9yLCBkZXBzOiBEZXBzID0gW10pOiB2b2lkID0+IHtcbiAgcmV0dXJuIGhvb2tJbXBsZW1lbnRhdGlvbi51c2VFZmZlY3QoZWZmZWN0LCBkZXBzKTtcbn07XG5leHBvcnQgdHlwZSBFZmZlY3RDb25zdHJ1Y3RvciA9ICgpID0+IEVmZmVjdENsZWFudXA7XG5leHBvcnQgdHlwZSBFZmZlY3RDbGVhbnVwID0gdm9pZCB8ICgoKSA9PiB2b2lkKVxuXG4vKipcbiAqIFVzZSBDb250ZXh0XG4gKlxuICogUmV0cmlldmVzIHRoZSB2YWx1ZSB0aGF0IGEgKkNvbnRleHRQcm92aWRlciogbWF5IGhhdmUgc2V0XG4gKiBlYXJsaWVyIGluIHRoZSB0cmVlLCBvciBpZiB0aGVyZSBhcmUgbm9uZSBwcmVzZW50LFxuICogcmV0dXJucyB0aGUgY29udGV4dCdzIGRlZmF1bHQgdmFsdWUuXG4gKi9cbmV4cG9ydCBjb25zdCB1c2VDb250ZXh0ID0gPFQ+KGNvbnRleHQ6IENvbnRleHQ8VD4pOiBUID0+IHtcbiAgcmV0dXJuIGhvb2tJbXBsZW1lbnRhdGlvbi51c2VDb250ZXh0KGNvbnRleHQpO1xufTtcblxuZXhwb3J0IHR5cGUgUmVmPGluIG91dCBUPiA9IHtcbiAgY3VycmVudDogVDtcbn07XG5leHBvcnQgdHlwZSBSZWFkb25seVJlZjxvdXQgVD4gPSB7XG4gIHJlYWRvbmx5IGN1cnJlbnQ6IFQ7XG59O1xuXG5leHBvcnQgY29uc3QgcmVmU3ltYm9sID0gU3ltYm9sKCk7XG5leHBvcnQgY29uc3QgbWVtb1N5bWJvbCA9IFN5bWJvbCgpO1xuXG5leHBvcnQgY29uc3QgdXNlUmVmID0gPFQ+KGluaXRpYWxWYWx1ZTogVmFsdWVPckNhbGN1bGF0b3I8VD4pOiBSZWY8VD4gPT4ge1xuICBjb25zdCBbcmVmXSA9IHVzZVN0YXRlKCgpID0+ICh7IGN1cnJlbnQ6IGNhbGN1bGF0ZVZhbHVlKGluaXRpYWxWYWx1ZSksIFtyZWZTeW1ib2xdOiB0cnVlIH0pKTtcbiAgcmV0dXJuIHJlZjtcbn07XG5leHBvcnQgY29uc3QgdXNlTWVtbyA9IDxUPihjYWxjdWxhdGU6ICgpID0+IFQsIGRlcHM6IERlcHMpOiBUID0+IHtcbiAgY29uc3QgcHJldkRlcHMgPSB1c2VSZWYoZGVwcyk7XG4gIGNvbnN0IHZhbHVlUmVmID0gdXNlUmVmKGNhbGN1bGF0ZSk7XG5cbiAgaWYgKGNhbGN1bGF0ZURlcHNDaGFuZ2UocHJldkRlcHMuY3VycmVudCwgZGVwcykpIHtcbiAgICBwcmV2RGVwcy5jdXJyZW50ID0gZGVwcztcbiAgICB2YWx1ZVJlZi5jdXJyZW50ID0gY2FsY3VsYXRlKCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlUmVmLmN1cnJlbnQ7XG59O1xuIiwgImxldCBsYXRlc3RJZCA9IDA7XG5cbmRlY2xhcmUgY29uc3Qgb3BhcXVlVHlwZTogdW5pcXVlIHN5bWJvbDtcbmV4cG9ydCB0eXBlIE9wYXF1ZUlEPFQgZXh0ZW5kcyBzdHJpbmc+ID0gbnVtYmVyICYgeyByZWFkb25seSBbb3BhcXVlVHlwZV06IFQgfTtcblxuXG4vKipcbiAqIFByb2R1Y2VzIGEgKHJlbGF0aXZlbHkgd2l0aGluIHRoaXMgcnVudGltZSkgdW5pcXVlIGluY3JlbWVudGluZyB2YWx1ZS5cbiAqIFxuICogSWYgbmFtZXNwYWNlIGlzIHBhc3NlZCwgdGhlbiB0aGUgaW5jcmVtZW50aW5nIHZhbHVlIGlzIHVuaXF1ZSB0byB0aGVcbiAqIG5hbWVzcGFjZSAob3RoZXJ3aXNlIGlzIGdsb2JhbGx5IHNoYXJlZCB3aXRoIGFsbCBvdGhlciBpZHMpXG4gKiBcbiAqIFRoZSBcIk9wYXF1ZUlEXCIgdHlwZSBoZWxwcyBhdm9pZCBjcm9zcy1jb250YW1pbmF0aW9uIG9mIGRpZmZlcmVudCBJRCB0eXBlc1xuICogKGJlaW5nIGF1dG9tYXRpY2FsbHkgY2FzdCB0byBudW1iZXIgYW5kIHN1Y2gpIGF0IFR5cGUgdGltZSwgYnV0IHByb3ZpZGVzXG4gKiBubyBydW50aW1lIGNoZWNrcy5cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZUlkID0gPFQgZXh0ZW5kcyBzdHJpbmc+KG5hbWVzcGFjZT86IFQpOiBPcGFxdWVJRDxUPiA9PiB7XG4gIGlmIChuYW1lc3BhY2UpIHtcbiAgICBpZiAoIShuYW1lc3BhY2UgaW4gbmFtZXNwYWNlcykpXG4gICAgICBuYW1lc3BhY2VzW25hbWVzcGFjZV0gPSAwO1xuICAgXG4gICAgcmV0dXJuIG5hbWVzcGFjZXNbbmFtZXNwYWNlXSsrIGFzIE9wYXF1ZUlEPFQ+O1xuICB9XG4gIHJldHVybiBsYXRlc3RJZCsrIGFzIE9wYXF1ZUlEPFQ+O1xufTtcblxuY29uc3QgbmFtZXNwYWNlczogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuXG4oZ2xvYmFsVGhpcykuX19MVUtFS0FBTElNX0FDVF9HTE9CQUxfTkFNRVNQQUNFX0lEID0gbmFtZXNwYWNlcztcblxuZGVjbGFyZSBnbG9iYWwge1xuICB2YXIgX19MVUtFS0FBTElNX0FDVF9HTE9CQUxfTkFNRVNQQUNFX0lEOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+O1xufSIsICJpbXBvcnQgeyBDb21wb25lbnQsIEVtcHR5UHJvcHMgfSBmcm9tIFwiLi9jb21wb25lbnQudHNcIjtcbmltcG9ydCB7IGNyZWF0ZUlkLCBPcGFxdWVJRCB9IGZyb20gXCIuL2lkLnRzXCI7XG5pbXBvcnQgeyBQcm9wcyB9IGZyb20gXCIuL21vZC50c1wiO1xuaW1wb3J0IHsgTm9kZSB9IGZyb20gXCIuL25vZGUudHNcIjtcblxuLyoqXG4gKiBUaGlzIGlzIGEgdW5pcXVlIHZhbHVlIHRoYXQgaXMgZ2VuZXJhdGVkXG4gKiBldmVyeSB0aW1lIHlvdSBjYWxsIGNyZWF0ZUVsZW1lbnQgLSBpdFxuICogaXMgdXNlZCB0byBjb21wYXJlIHR3byBkaWZmZXJlbnQgZWxlbWVudHNcbiAqIGFuZCBxdWlja2x5IGRldGVybWluZSBpZiB0aGV5IGFyZSB0aGUgc2FtZS5cbiAqL1xuZXhwb3J0IHR5cGUgRWxlbWVudElEID0gT3BhcXVlSUQ8XCJFbGVtZW50SURcIj47XG5cbi8qKlxuICogVGhlIFwiRWxlbWVudFwiIGlzIHRoZSBmdW5kYW1lbnRhbCBidWlsZGluZ1xuICogYmxvY2sgb2YgYWN0IC0gQ29tcG9uZW50cyByZXR1cm4gYW4gRWxlbWVudFxuICogVHJlZSwgd2hpY2ggdGhlbiBldmVudHVhbGx5IGJlY29tZXMgYSB0cmVlXG4gKiBvZiBDb21taXRzLlxuICovXG5leHBvcnQgdHlwZSBFbGVtZW50ID0ge1xuICB0eXBlOiBFbGVtZW50VHlwZTtcbiAgaWQ6IEVsZW1lbnRJRDtcbiAgcHJvcHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICBjaGlsZHJlbjogTm9kZTtcbn07XG5cbmV4cG9ydCB0eXBlIEVsZW1lbnRUeXBlPFQgZXh0ZW5kcyBQcm9wcyA9IEVtcHR5UHJvcHM+ID0gbnVsbCB8IHN0cmluZyB8IHN5bWJvbCB8IENvbXBvbmVudDxUPjtcbmV4cG9ydCB0eXBlIEVsZW1lbnRLZXkgPSBzdHJpbmcgfCBudW1iZXIgfCBzeW1ib2w7XG5cbmNvbnN0IEVNUFRZX1BST1BTID0gT2JqZWN0LmZyZWV6ZSh7fSk7XG5cbi8qKlxuICogR2VuZXJhdGUgYSB1bmlxdWUgZWxlbWVudC4gRWFjaCBlbGVtZW50IGhhcyBhbiBpbnRlcm5hbFxuICogSUQgdG8gcXVpY2tseSB0ZWxsIGlmIGVsZW1lbnRzIGFyZSBkaWZmZXJlbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbGVtZW50PFR5cGUgZXh0ZW5kcyBFbGVtZW50VHlwZTxhbnk+PihcbiAgdHlwZTogVHlwZSxcbiAgcHJvcHM6IFR5cGUgZXh0ZW5kcyBFbGVtZW50VHlwZTxpbmZlciBYPiA/IFggJiB7IGtleT86IEVsZW1lbnRLZXkgfSA6IG5ldmVyLFxuICBjaGlsZHJlbj86IE5vZGVcbik6IEVsZW1lbnQ7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRWxlbWVudChcbiAgdHlwZTogc3RyaW5nIHwgc3ltYm9sLFxuICBwcm9wcz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+ICYgeyBrZXk/OiBFbGVtZW50S2V5IH0sXG4gIGNoaWxkcmVuPzogTm9kZVxuKTogRWxlbWVudDtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbGVtZW50PFR5cGUgZXh0ZW5kcyBDb21wb25lbnQ8RW1wdHlQcm9wcz4+KFxuICB0eXBlOiBUeXBlLFxuICBwcm9wcz86IHsga2V5PzogRWxlbWVudEtleSB9LFxuICBjaGlsZHJlbj86IE5vZGVcbik6IEVsZW1lbnQ7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRWxlbWVudChcbiAgdHlwZTogRWxlbWVudFR5cGUsXG4gIHByb3BzPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gJiB7IGtleT86IEVsZW1lbnRLZXkgfSxcbiAgY2hpbGRyZW46IE5vZGUgPSBbXVxuKTogRWxlbWVudCB7XG4gIHJldHVybiB7XG4gICAgaWQ6IGNyZWF0ZUlkKFwiRWxlbWVudElEXCIpLFxuICAgIHR5cGUsXG4gICAgcHJvcHM6IHByb3BzIHx8IEVNUFRZX1BST1BTLFxuICAgIGNoaWxkcmVuLFxuICB9IGFzIEVsZW1lbnQ7XG59XG5cbmV4cG9ydCBjb25zdCBoID0gY3JlYXRlRWxlbWVudDtcbiIsICJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi9jb21wb25lbnQudHNcIjtcbmltcG9ydCB7IGggfSBmcm9tIFwiLi9lbGVtZW50LnRzXCI7XG5pbXBvcnQgeyBNYWdpY0Vycm9yIH0gZnJvbSBcIi4vZXJyb3JzLnRzXCI7XG5pbXBvcnQgeyBPcGFxdWVJRCwgY3JlYXRlSWQgfSBmcm9tIFwiLi9pZC50c1wiO1xuXG5leHBvcnQgdHlwZSBDb250ZXh0SUQgPSBPcGFxdWVJRDxcIkNvbnRleHRJRFwiPjtcbmV4cG9ydCB0eXBlIENvbnRleHQ8VD4gPSB7XG4gIFByb3ZpZGVyOiBDb21wb25lbnQ8eyB2YWx1ZTogVCB9PixcbiAgZGVmYXVsdFZhbHVlOiBULFxuICBpZDogQ29udGV4dElELFxufVxuXG5leHBvcnQgY29uc3QgcHJvdmlkZXJOb2RlVHlwZSA9IFN5bWJvbChcInByb3ZpZGVyXCIpO1xuXG5leHBvcnQgY29uc3QgY3JlYXRlQ29udGV4dCA9IDxUPihkZWZhdWx0VmFsdWU6IFQpOiBDb250ZXh0PFQ+ID0+IHtcbiAgY29uc3QgaWQgPSBjcmVhdGVJZDwnQ29udGV4dElEJz4oXCJDb250ZXh0SURcIik7XG4gIHJldHVybiB7XG4gICAgUHJvdmlkZXIoeyB2YWx1ZSwgY2hpbGRyZW4gfSkge1xuICAgICAgcmV0dXJuIGgocHJvdmlkZXJOb2RlVHlwZSwgeyB2YWx1ZSwgaWQgfSwgY2hpbGRyZW4pO1xuICAgIH0sXG4gICAgZGVmYXVsdFZhbHVlLFxuICAgIGlkLFxuICB9XG59O1xuIiwgImltcG9ydCB7IEVsZW1lbnQgfSBmcm9tIFwiLi9lbGVtZW50LnRzXCI7XG5pbXBvcnQgeyBVbmtub3duRWxlbWVudFR5cGUgfSBmcm9tIFwiLi9lcnJvcnMudHNcIjtcbmltcG9ydCB7IGggfSBmcm9tIFwiLi9lbGVtZW50LnRzXCI7XG5cbmV4cG9ydCB0eXBlIE5vZGUgPVxuICB8IHN0cmluZ1xuICB8IG51bWJlclxuICB8IGJvb2xlYW5cbiAgfCBudWxsXG4gIHwgRWxlbWVudFxuICB8IE5vZGVbXVxuXG5leHBvcnQgY29uc3QgcHJpbWl0aXZlTm9kZVR5cGVzID0ge1xuICBzdHJpbmc6ICAgU3ltYm9sKFwic3RyaW5nLW5vZGVcIiksXG4gIG51bWJlcjogICBTeW1ib2woXCJudW1iZXItbm9kZVwiKSxcbiAgYm9vbGVhbjogIFN5bWJvbChcImJvb2xlYW4tbm9kZVwiKSxcbiAgbnVsbDogICAgIFN5bWJvbChcIm51bGwtbm9kZVwiKSxcbiAgYXJyYXk6ICAgIFN5bWJvbChcImFycmF5LW5vZGVcIiksXG59IGFzIGNvbnN0O1xuXG4vKipcbiAqIEFueSBub2RlIHRyZWUgcmVwcmVzZW50cyBvbmUgb3IgbW9yZSBlbGVtZW50c1xuICovXG5leHBvcnQgY29uc3QgY29udmVydE5vZGVUb0VsZW1lbnRzID0gKG5vZGU6IE5vZGUpOiBFbGVtZW50W10gPT4ge1xuICBjb25zdCBub2RlQXJyYXkgPSBBcnJheS5pc0FycmF5KG5vZGUpID8gbm9kZSA6IFtub2RlXTtcblxuICByZXR1cm4gbm9kZUFycmF5Lm1hcChjb252ZXJ0Tm9kZVRvRWxlbWVudCk7XG59XG5cbmV4cG9ydCBjb25zdCBjb252ZXJ0Tm9kZVRvRWxlbWVudCA9IChub2RlOiBOb2RlKTogRWxlbWVudCA9PiB7XG4gIHN3aXRjaCAodHlwZW9mIG5vZGUpIHtcbiAgICBjYXNlICdib29sZWFuJzpcbiAgICAgIHJldHVybiBoKHByaW1pdGl2ZU5vZGVUeXBlcy5ib29sZWFuLCB7IHZhbHVlOiBub2RlIH0pO1xuICAgIGNhc2UgJ251bWJlcic6XG4gICAgICByZXR1cm4gaChwcmltaXRpdmVOb2RlVHlwZXMubnVtYmVyLCB7IHZhbHVlOiBub2RlIH0pO1xuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICByZXR1cm4gaChwcmltaXRpdmVOb2RlVHlwZXMuc3RyaW5nLCB7IHZhbHVlOiBub2RlIH0pO1xuXG4gICAgY2FzZSAnb2JqZWN0JzogXG4gICAgICBpZiAobm9kZSA9PT0gbnVsbClcbiAgICAgICAgcmV0dXJuIGgocHJpbWl0aXZlTm9kZVR5cGVzLm51bGwpO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkobm9kZSkpXG4gICAgICAgIHJldHVybiBoKHByaW1pdGl2ZU5vZGVUeXBlcy5hcnJheSwge30sIG5vZGUpO1xuICAgICAgXG4gICAgICByZXR1cm4gbm9kZTtcbiAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5kZWZpbmVkIGlzIG5vdCBhIHZhbGlkIGFjdCBlbGVtZW50IWApO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgVW5rbm93bkVsZW1lbnRUeXBlKClcbiAgfVxufSIsICJpbXBvcnQgeyBDb21wb25lbnQsIEVsZW1lbnRUeXBlLCBSZWYgfSBmcm9tIFwiLi9tb2RcIjtcbmltcG9ydCB7IHByb3ZpZGVyTm9kZVR5cGUgfSBmcm9tICcuL2NvbnRleHQnO1xuaW1wb3J0IHsgTm9kZSB9IGZyb20gJy4vbm9kZSc7XG5cbmV4cG9ydCBjb25zdCBib3VuZGFyeU5vZGVUeXBlID0gU3ltYm9sKCdib3VuZGFyeScpO1xuZXhwb3J0IGNvbnN0IGZhbGxiYWNrTm9kZVR5cGUgPSBTeW1ib2woJ2ZhbGxiYWNrJyk7XG5leHBvcnQgY29uc3Qgc3VzcGVuZE5vZGVUeXBlID0gU3ltYm9sKCdzdXNwZW5kJyk7XG5leHBvcnQgY29uc3QgcmVuZGVyTm9kZVR5cGUgPSBTeW1ib2woJ3JlbmRlcicpO1xuZXhwb3J0IGNvbnN0IHBsYWNlaG9sZGVyTm9kZVR5cGUgPSBTeW1ib2woJ3BsYWNlaG9sZGVyJyk7XG5cbmV4cG9ydCB0eXBlIEJvdW5kYXJ5UHJvcHMgPSB7XG4gIGZhbGxiYWNrPzogTm9kZSxcblxuICBvblRocm93PzogKHZhbHVlOiB1bmtub3duLCBhbGxWYWx1ZXM6IHVua25vd25bXSkgPT4gdW5rbm93bixcbiAgb25DbGVhcj86ICgpID0+IHVua25vd24sXG5cbiAgcmVmPzogUmVmPG51bGwgfCB7IGNsZWFyOiAoKSA9PiB2b2lkIH0+XG59XG5leHBvcnQgdHlwZSBSZW5kZXJSb290UHJvcHMgPSB7XG4gIHR5cGU6IHN0cmluZyB8IHN5bWJvbCxcbn1cbmV4cG9ydCB0eXBlIFN1c3BlbmRQcm9wcyA9IHtcbiAgc3VzcGVuZGVkOiBib29sZWFuLFxufVxuXG5leHBvcnQgY29uc3QgQm91bmRhcnk6IENvbXBvbmVudDxCb3VuZGFyeVByb3BzPiA9IGJvdW5kYXJ5Tm9kZVR5cGUgYXMgYW55O1xuZXhwb3J0IGNvbnN0IFJlbmRlclJvb3Q6IENvbXBvbmVudDxSZW5kZXJSb290UHJvcHM+ID0gcmVuZGVyTm9kZVR5cGUgYXMgYW55O1xuZXhwb3J0IGNvbnN0IEZhbGxiYWNrOiBDb21wb25lbnQgPSBmYWxsYmFja05vZGVUeXBlIGFzIGFueTtcbmV4cG9ydCBjb25zdCBTdXNwZW5kOiBDb21wb25lbnQ8U3VzcGVuZFByb3BzPiA9IHN1c3BlbmROb2RlVHlwZSBhcyBhbnk7XG5cbmV4cG9ydCB0eXBlIFNwZWNpYWxOb2RlVHlwZSA9XG4gIHwgdHlwZW9mIGJvdW5kYXJ5Tm9kZVR5cGVcbiAgfCB0eXBlb2YgcmVuZGVyTm9kZVR5cGVcbiAgfCB0eXBlb2YgcHJvdmlkZXJOb2RlVHlwZVxuICB8IHR5cGVvZiBmYWxsYmFja05vZGVUeXBlXG4gIHwgdHlwZW9mIHN1c3BlbmROb2RlVHlwZVxuICB8IHR5cGVvZiBwbGFjZWhvbGRlck5vZGVUeXBlXG5cbmV4cG9ydCBjb25zdCBzcGVjaWFsTm9kZVR5cGVzID0ge1xuICBib3VuZGFyeTogYm91bmRhcnlOb2RlVHlwZSxcbiAgcmVuZGVyOiByZW5kZXJOb2RlVHlwZSxcbiAgcHJvdmlkZXI6IHByb3ZpZGVyTm9kZVR5cGUsXG4gIGZhbGxiYWNrOiBmYWxsYmFja05vZGVUeXBlLFxuICBzdXNwZW5kOiBzdXNwZW5kTm9kZVR5cGUsXG4gIHBsYWNlaG9sZGVyOiBwbGFjZWhvbGRlck5vZGVUeXBlLFxufSIsICJleHBvcnQgKiBmcm9tICcuL2NvbXBvbmVudC50cyc7XG5leHBvcnQgKiBmcm9tICcuL2hvb2tzLnRzJztcbmV4cG9ydCAqIGZyb20gJy4vY29udGV4dC50cyc7XG5leHBvcnQgKiBmcm9tICcuL2Vycm9ycy50cyc7XG5cbmV4cG9ydCAqIGZyb20gJy4vZWxlbWVudC50cyc7XG5leHBvcnQgKiBmcm9tICcuL25vZGUudHMnO1xuZXhwb3J0ICogZnJvbSAnLi9pZC50cyc7XG5leHBvcnQgKiBmcm9tICcuL3NwZWNpYWwudHMnO1xuXG5kZWNsYXJlIGdsb2JhbCB7XG4gIHZhciBfX0xVS0VLQUFMSU1fQUNUX0dMT0JBTF9DSEVDSzogbnVtYmVyO1xufVxuXG5pZiAoZ2xvYmFsVGhpc1snX19MVUtFS0FBTElNX0FDVF9HTE9CQUxfQ0hFQ0snXSkge1xuICBjb25zb2xlLndhcm4oYFRoZXJlIGFyZSBtdWx0aXBsZSAoYXQgbGVhc3QgJHtnbG9iYWxUaGlzLl9fTFVLRUtBQUxJTV9BQ1RfR0xPQkFMX0NIRUNLfSkgY29waWVzIG9mIEFjdCBydW5uaW5nIWApXG4gIGdsb2JhbFRoaXMuX19MVUtFS0FBTElNX0FDVF9HTE9CQUxfQ0hFQ0srKztcbn0gZWxzZSB7XG4gIGdsb2JhbFRoaXMuX19MVUtFS0FBTElNX0FDVF9HTE9CQUxfQ0hFQ0sgPSAxO1xufVxuIiwgImltcG9ydCAqIGFzIGFjdCBmcm9tICdAbHVrZWthYWxpbS9hY3QnO1xuXG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBXaW5kb3cge1xuICAgIEhUTUxFbGVtZW50OiB0eXBlb2YgSFRNTEVsZW1lbnQsXG4gICAgU1ZHRWxlbWVudDogdHlwZW9mIFNWR0VsZW1lbnQsXG4gICAgVGV4dDogdHlwZW9mIFRleHQsXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHNldFByb3BzID0gKFxuICB3aW5kb3c6IFdpbmRvdyxcbiAgbm9kZTogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50IHwgVGV4dCxcbiAgXG4gIG5leHQ6IGFjdC5FbGVtZW50LFxuICBwcmV2OiBudWxsIHwgYWN0LkVsZW1lbnRcbikgPT4ge1xuICBpZiAobm9kZSBpbnN0YW5jZW9mIHdpbmRvdy5IVE1MRWxlbWVudCkge1xuICAgIHNldEhUTUxFbGVtZW50UHJvcHMobm9kZSwgbmV4dCwgcHJldik7XG4gIH1cbiAgaWYgKG5vZGUgaW5zdGFuY2VvZiB3aW5kb3cuU1ZHRWxlbWVudCkge1xuICAgIHNldFNWR0VsZW1lbnRQcm9wcyhub2RlLCBuZXh0LCBwcmV2KTtcbiAgfVxuICBpZiAobm9kZSBpbnN0YW5jZW9mIHdpbmRvdy5UZXh0KSB7XG4gICAgaWYgKG5vZGUudGV4dENvbnRlbnQgIT09IG5leHQucHJvcHMudmFsdWUpXG4gICAgICBub2RlLnRleHRDb250ZW50ID0gbmV4dC5wcm9wcy52YWx1ZSBhcyBzdHJpbmdcbiAgfVxufVxuXG5leHBvcnQgY29uc3Qgc2V0U1ZHRWxlbWVudFByb3BzID0gKFxuICBub2RlOiBTVkdFbGVtZW50LFxuICBcbiAgbmV4dDogYWN0LkVsZW1lbnQsXG4gIHByZXY6IG51bGwgfCBhY3QuRWxlbWVudFxuKSA9PiB7XG4gIHNldFByb3BPYmplY3Qobm9kZSBhcyBhbnksIG5leHQucHJvcHMsIHByZXYgJiYgcHJldi5wcm9wcywgKG5hbWUsIG5leHQsIHByZXYpID0+IHtcbiAgICBpZiAobmFtZS5zdGFydHNXaXRoKCdvbicpKSB7XG4gICAgICBjb25zdCBldmVudE5hbWUgPSBuYW1lLnNsaWNlKDIpLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICBzZXRFdmVudFByb3Aobm9kZSBhcyBhbnksIGV2ZW50TmFtZSwgbmV4dCwgcHJldik7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICBjYXNlICdyZWYnOlxuICAgICAgICAobmV4dCBhcyBhbnkpLmN1cnJlbnQgPSBub2RlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGNhc2UgJ3N0eWxlJzpcbiAgICAgICAgcmV0dXJuIChzZXRTdHlsZVByb3Aobm9kZS5zdHlsZSwgbmV4dCBhcyBhbnksIHByZXYgYXMgYW55KSwgdHJ1ZSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShuYW1lLCBuZXh0IGFzIGFueSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gIH0pO1xufVxuXG5leHBvcnQgY29uc3Qgc2V0SFRNTEVsZW1lbnRQcm9wcyA9IChcbiAgbm9kZTogSFRNTEVsZW1lbnQsXG4gIFxuICBuZXh0OiBhY3QuRWxlbWVudCxcbiAgcHJldjogbnVsbCB8IGFjdC5FbGVtZW50XG4pID0+IHtcbiAgc2V0UHJvcE9iamVjdChub2RlIGFzIGFueSwgbmV4dC5wcm9wcywgcHJldiAmJiBwcmV2LnByb3BzLCAobmFtZSwgbmV4dCwgcHJldikgPT4ge1xuICAgIGlmIChuYW1lLnN0YXJ0c1dpdGgoJ29uJykpIHtcbiAgICAgIGNvbnN0IGV2ZW50TmFtZSA9IG5hbWUuc2xpY2UoMikudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICAgIHNldEV2ZW50UHJvcChub2RlIGFzIGFueSwgZXZlbnROYW1lLCBuZXh0LCBwcmV2KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAobmFtZS5zdGFydHNXaXRoKCdkYXRhLScpKSB7XG4gICAgICBpZiAobmV4dCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAgIGVsc2VcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUobmFtZSwgbmV4dCBhcyBzdHJpbmcpO1xuICAgIH1cbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgJ3JlZic6XG4gICAgICAgIChuZXh0IGFzIGFueSkuY3VycmVudCA9IG5vZGU7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgY2FzZSAnc3R5bGUnOlxuICAgICAgICByZXR1cm4gKHNldFN0eWxlUHJvcChub2RlLnN0eWxlLCBuZXh0IGFzIGFueSwgcHJldiBhcyBhbnkpLCB0cnVlKTtcbiAgICAgIGNhc2UgJ2NsYXNzTmFtZSc6XG4gICAgICAgIG5vZGUuY2xhc3NOYW1lID0gbmV4dCBhcyBzdHJpbmc7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgY2FzZSAnY2xhc3NMaXN0JzpcbiAgICAgICAgY29uc3QgY2xhc3NOYW1lcyA9IChuZXh0IGFzIHN0cmluZ1tdKS5maWx0ZXIoQm9vbGVhbikuam9pbignICcpO1xuICAgICAgICBub2RlLmNsYXNzTmFtZSA9IGNsYXNzTmFtZXM7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSlcbn1cblxuZXhwb3J0IGNvbnN0IHNldEV2ZW50UHJvcCA9IChcbiAgbm9kZTogRXZlbnRTb3VyY2UsXG4gIHR5cGU6IHN0cmluZyxcbiAgbmV4dDogdW5rbm93bixcbiAgcHJldjogdW5rbm93bixcbikgPT4ge1xuICBpZiAocHJldiA9PT0gbmV4dClcbiAgICByZXR1cm47XG4gIGlmIChwcmV2KSB7XG4gICAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIHByZXYgYXMgYW55KVxuICB9XG4gIGlmIChuZXh0KSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKHR5cGUsIG5leHQgYXMgYW55KVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBzZXRTdHlsZVByb3AgPSAoXG4gIG5vZGU6IENTU1N0eWxlRGVjbGFyYXRpb24sXG4gIHN0eWxlOiBudWxsIHwgUmVjb3JkPGtleW9mIENTU1N0eWxlRGVjbGFyYXRpb24sIHN0cmluZyB8IG51bWJlcj4sXG4gIHByZXZTdHlsZTogbnVsbCB8IFJlY29yZDxrZXlvZiBDU1NTdHlsZURlY2xhcmF0aW9uLCBzdHJpbmcgfCBudW1iZXI+LFxuKSA9PiB7XG4gIHNldFByb3BPYmplY3Qobm9kZSBhcyBhbnksIHN0eWxlLCBwcmV2U3R5bGUsIChuYW1lLCB2YWx1ZSkgPT5cbiAgICAobm9kZS5zZXRQcm9wZXJ0eShuYW1lLCB2YWx1ZSBhcyBzdHJpbmcpLCB0cnVlKSlcbn1cblxuY29uc3Qgc2V0UHJvcE9iamVjdCA9IChcbiAgdGFyZ2V0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgbmV4dDogbnVsbCB8IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICBwcmV2OiBudWxsIHwgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gIGFzc2lnbjogbnVsbCB8ICgobmFtZTogc3RyaW5nLCBuZXh0OiB1bmtub3duLCBwcmV2OiB1bmtub3duKSA9PiBib29sZWFuKSA9IG51bGwsIFxuKSA9PiB7XG4gIGNvbnN0IG5hbWVzID0gbmV3IFNldChbXG4gICAgLi4uT2JqZWN0LmtleXMobmV4dCB8fCB7fSksXG4gICAgLi4uT2JqZWN0LmtleXMocHJldiB8fCB7fSlcbiAgXSk7XG5cbiAgZm9yIChjb25zdCBuYW1lIG9mIG5hbWVzKSB7XG4gICAgY29uc3QgbmV4dFZhbHVlID0gKG5leHQgfHwge30pW25hbWVdO1xuICAgIGNvbnN0IHN1Y2Nlc3NmdWxBc3NpZ24gPSBhc3NpZ24gJiYgYXNzaWduKG5hbWUsIG5leHRWYWx1ZSwgKHByZXYgfHwge30pW25hbWVdKTtcbiAgICBpZiAoIXN1Y2Nlc3NmdWxBc3NpZ24pIHtcbiAgICAgIGlmICh0YXJnZXRbbmFtZV0gIT09IG5leHRWYWx1ZSkge1xuICAgICAgICB0YXJnZXRbbmFtZV0gPSBuZXh0VmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG59IiwgImltcG9ydCAqIGFzIGFjdCBmcm9tICdAbHVrZWthYWxpbS9hY3QnO1xuXG5pbXBvcnQgeyBzZXRQcm9wcyB9IGZyb20gJy4vcHJvcHMudHMnO1xuaW1wb3J0IHsgTm9kZUJ1aWxkZXIgfSBmcm9tICdAbHVrZWthYWxpbS9hY3QtYmFja3N0YWdlJztcblxuZXhwb3J0IGNvbnN0IEhUTUw6IGFjdC5Db21wb25lbnQgPSAoeyBjaGlsZHJlbiB9KSA9PiBhY3QuaChhY3QucmVuZGVyTm9kZVR5cGUsIHsgdHlwZTogJ3dlYjpodG1sJyB9LCBjaGlsZHJlbik7XG5leHBvcnQgY29uc3QgU1ZHOiBhY3QuQ29tcG9uZW50ID0gKHsgY2hpbGRyZW4gfSkgPT4gYWN0LmgoYWN0LnJlbmRlck5vZGVUeXBlLCB7IHR5cGU6ICd3ZWI6c3ZnJyB9LCBjaGlsZHJlbik7XG5cbmNvbnN0IGRlZmF1bHRXaW5kb3cgPSAoZ2xvYmFsVGhpcy53aW5kb3cpO1xuXG5leHBvcnQgY29uc3QgY3JlYXRlV2ViTm9kZUJ1aWxkZXIgPSAoXG4gIHJvb3Q6IEhUTUxFbGVtZW50LFxuICB3aW5kb3c6IFdpbmRvdyA9IGRlZmF1bHRXaW5kb3dcbik6IE5vZGVCdWlsZGVyPEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudCB8IFRleHQsICd3ZWI6aHRtbCcgfCAnd2ViOnN2Zyc+ID0+ICh7XG4gIHJvb3RzOiBuZXcgU2V0KFsnd2ViOmh0bWwnLCAnd2ViOnN2ZyddIGFzIGNvbnN0KSxcblxuICBjcmVhdGUoZWxlbWVudCwgcm9vdFR5cGUpIHtcbiAgICBjb25zdCB0YWcgPSBlbGVtZW50LnR5cGU7XG4gICAgXG4gICAgc3dpdGNoICh0eXBlb2YgdGFnKSB7XG4gICAgICBjYXNlICdzeW1ib2wnOiB7XG4gICAgICAgIHN3aXRjaCAodGFnKSB7XG4gICAgICAgICAgY2FzZSBhY3QucHJpbWl0aXZlTm9kZVR5cGVzLnN0cmluZzpcbiAgICAgICAgICBjYXNlIGFjdC5wcmltaXRpdmVOb2RlVHlwZXMubnVtYmVyOlxuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5kb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIjxlbXB0eSB0ZXh0PlwiKTtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNhc2UgJ3N0cmluZyc6IHtcbiAgICAgICAgc3dpdGNoIChyb290VHlwZSkge1xuICAgICAgICAgIGNhc2UgJ3dlYjpodG1sJzpcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sJywgdGFnKTtcbiAgICAgICAgICBjYXNlICd3ZWI6c3ZnJzpcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIHRhZyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSxcbiAgdXBkYXRlKGVsLCBuZXh0LCBwcmV2KSB7XG4gICAgaWYgKGVsIGluc3RhbmNlb2YgVGV4dClcbiAgICAgIGNvbnNvbGUubG9nKCdVUERBVEUnLCBlbCwgbmV4dCwgcHJldilcbiAgICBzZXRQcm9wcyh3aW5kb3csIGVsLCBuZXh0LCBwcmV2KTtcbiAgfSxcbiAgbGluayhlbCwgcGFyZW50KSB7XG4gICAgY29uc29sZS5sb2coJ0xJTksnLCBlbCwgcGFyZW50KTtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZWwpO1xuICB9LFxuICBsaW5rUm9vdChjaGlsZCkge1xuICAgIHJvb3QuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICB9LFxuICB1bmxpbmsoZWwsIHBhcmVudCkge1xuICAgIGlmIChlbC5wYXJlbnROb2RlID09PSBwYXJlbnQpXG4gICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoZWwpO1xuICB9LFxuICBkZXN0cm95KGVsKSB7XG4gICAgaWYgKGVsLnBhcmVudE5vZGUpXG4gICAgICBlbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGVsKVxuICB9LFxuICBzdXNwZW5kKGVsLCBwYXJlbnQpIHtcbiAgICBpZiAoZWwgaW5zdGFuY2VvZiBIVE1MRWxlbWVudClcbiAgICAgIGVsLnN0eWxlLm9wYWNpdHkgPSAwLjUudG9TdHJpbmcoKTtcbiAgfSxcbiAgdW5zdXNwZW5kKGVsLCBwYXJlbnQpIHtcbiAgICBpZiAoZWwgaW5zdGFuY2VvZiBIVE1MRWxlbWVudClcbiAgICAgIGVsLnN0eWxlLm9wYWNpdHkgPSAoMSkudG9TdHJpbmcoKTtcbiAgfSxcbiAgc29ydChlbCwgbmV3Q2hpbGRyZW4pIHtcbiAgICBpZiAoZWwgaW5zdGFuY2VvZiBUZXh0KVxuICAgICAgcmV0dXJuO1xuXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBlbC5jaGlsZE5vZGVzKVxuICAgICAgaWYgKCFuZXdDaGlsZHJlbi5pbmNsdWRlcyhjaGlsZCBhcyBIVE1MRWxlbWVudCkpXG4gICAgICAgIGNoaWxkLnJlbW92ZSgpO1xuXG4gICAgaWYgKG5ld0NoaWxkcmVuLmxlbmd0aCA8IDIpXG4gICAgICByZXR1cm47XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5ld0NoaWxkcmVuLmxlbmd0aDsgaSsrKVxuICAgICAgaWYgKGVsLmNoaWxkcmVuW2ldICE9PSBuZXdDaGlsZHJlbltpXSlcbiAgICAgICAgZWwuaW5zZXJ0QmVmb3JlKG5ld0NoaWxkcmVuW2ldLCBlbC5jaGlsZHJlbltpXSlcbiAgfSxcbn0pIiwgImltcG9ydCAqIGFzIGFjdCBmcm9tICdAbHVrZWthYWxpbS9hY3QnO1xuaW1wb3J0IHsgSFRNTFRhZ05hbWUgfSBmcm9tIFwiLi90YWdzXCI7XG5cbnR5cGUgRXZlbnRNYXAgPSB7XG4gIG9uQ2xpY2s6IFwiY2xpY2tcIixcblxuICBvbk1vdXNlRW50ZXI6IFwibW91c2VlbnRlclwiLFxuICBvbk1vdXNlTW92ZTogXCJtb3VzZW1vdmVcIixcbiAgb25Nb3VzZUxlYXZlOiBcIm1vdXNlbGVhdmVcIixcblxuICBvblBvaW50ZXJFbnRlcjogXCJwb2ludGVyZW50ZXJcIixcbiAgb25Qb2ludGVyTW92ZTogXCJwb2ludGVybW92ZVwiLFxuICBvblBvaW50ZXJMZWF2ZTogXCJwb2ludGVybGVhdmVcIixcblxuICBvbktleURvd246IFwia2V5ZG93blwiLFxuICBvbktleVVwOiBcImtleXVwXCIsXG5cbiAgb25Gb2N1czogXCJmb2N1c1wiLFxuICBvbkJsdXI6ICdibHVyJyxcblxuICBvbklucHV0OiBcImlucHV0XCIsXG4gIG9uQ2hhbmdlOiBcImNoYW5nZVwiLFxufVxuXG50eXBlIEVsZW1lbnRNYXAgPSB7XG4gIFwiYnV0dG9uXCI6IEhUTUxCdXR0b25FbGVtZW50LFxuICBcImRpdlwiOiBIVE1MRGl2RWxlbWVudCxcbiAgXCJmb3JtXCI6IEhUTUxGb3JtRWxlbWVudCxcbiAgXCJpbnB1dFwiOiBIVE1MSW5wdXRFbGVtZW50LFxuICBcInByZVwiOiBIVE1MUHJlRWxlbWVudCxcbiAgXCJjYW52YXNcIjogSFRNTENhbnZhc0VsZW1lbnQsXG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVTcGlkZXJFbGVtZW50ID0gPFR5cGUgZXh0ZW5kcyBIVE1MVGFnTmFtZT4oXG4gIHR5cGU6IFR5cGUsXG4gIHByb3BzPzoge1xuICAgIHJlZj86IGFjdC5SZWY8bnVsbCB8IEhUTUxFbGVtZW50PixcbiAgICBrZXk/OiBzdHJpbmcgfCBudW1iZXIsXG4gICAgc3R5bGU/OiB7IFtrZXkgaW4ga2V5b2YgQ1NTU3R5bGVEZWNsYXJhdGlvbl0/OiBudW1iZXIgfCBzdHJpbmcgfSxcbiAgICBjbGFzc0xpc3Q/OiByZWFkb25seSAoc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwgfCB2b2lkKVtdLFxuICAgIGNsYXNzTmFtZT86IHN0cmluZyxcbiAgfVxuICAgICYgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgICAmIHtcbiAgICAgIC8vW2tleSBpbiBrZXlvZiBIVE1MRWxlbWVudF0/OiBIVE1MRWxlbWVudFtrZXldIGV4dGVuZHMgRnVuY3Rpb24gPyBuZXZlciA6IEhUTUxFbGVtZW50W2tleV1cbiAgICB9XG4gICAgJiB7XG4gICAgICBba2V5IGluIGtleW9mIEV2ZW50TWFwXT86ICh0aGlzOiBIVE1MRWxlbWVudCwgZXY6IEhUTUxFbGVtZW50RXZlbnRNYXBbRXZlbnRNYXBba2V5XV0pID0+IHVua25vd25cbiAgICB9LFxuICBjaGlsZHJlbj86IGFjdC5Ob2RlLFxuKTogYWN0LkVsZW1lbnQgPT4ge1xuICByZXR1cm4gYWN0LmNyZWF0ZUVsZW1lbnQodHlwZSwgcHJvcHMsIGNoaWxkcmVuKVxufTtcblxuZXhwb3J0IGNvbnN0IGhzID0gY3JlYXRlU3BpZGVyRWxlbWVudDtcbiIsICJpbXBvcnQgeyBwcmltaXRpdmVOb2RlVHlwZXMsIHNwZWNpYWxOb2RlVHlwZXMsIFN1c3BlbmRQcm9wcyB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcbmltcG9ydCB7IENvbW1pdDIsIENvbW1pdElELCBDb21taXRSZWYyLCBDb21taXRUcmVlMiwgRGVsdGEsIFJlY29uY2lsZXJFdmVudEJ1cyB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3QtcmVjb25cIlxuaW1wb3J0IHsgTm9kZUJ1aWxkZXIgfSBmcm9tIFwiLi9idWlsZGVyXCI7XG5cbnR5cGUgUGFyZW50U2VhcmNoUmVzdWx0PFROb2RlPiA9IHtcbiAgLyoqXG4gICAqIFlvdSBtaWdodCBub3QgaGF2ZSBhIHBhcmVudCAtIG5vXG4gICAqIGNvbW1pdCBtZWFucyB0aGVyZSBhcmUgbm8gTm9kZXMgYWJvdmUgeW91IC0ganVzdCBSb290LlxuICAgKi9cbiAgY29tbWl0OiBDb21taXQyIHwgbnVsbCxcbiAgLyoqXG4gICAqIFlvdXIgcGFyZW50IG1pZ2h0IGJlIGEgdmFsaWQgbm9kZSxcbiAgICogb3IgaXQgbWlnaHQgYmUgXCJudWxsXCJcbiAgICovXG4gIG5vZGU6IFROb2RlIHwgbnVsbCxcblxuICBhdHRhY2hhYmxlOiBib29sZWFuLFxufVxuXG4vKipcbiAqIFRoZSBSZW5kZXJTcGFjZSBjbGFzc1xuICovXG5leHBvcnQgY2xhc3MgUmVuZGVyU3BhY2UyPFROb2RlLCBUUm9vdCBleHRlbmRzIHN0cmluZyB8IHN5bWJvbD4ge1xuICAvKiogVGhlIENvbW1pdFRyZWUgdGhpcyByZW5kZXIgc3BhY2UgaXMgY29ubmVjdGVkIHRvICovXG4gIHRyZWU6IENvbW1pdFRyZWUyO1xuXG4gIC8qKiBBIHJldmVyc2UgbWFwIHRvIGxvb2sgdXAgQ29tbWl0cyBnaXZlbiBqdXN0IHRoZSBub2RlIHRoZXkgcmVwcmVzZW50ICovXG4gIG5vZGVCeUNvbW1pdDogTWFwPENvbW1pdElELCBUTm9kZT4gPSBuZXcgTWFwKCk7XG4gIC8qKiBBIHJldmVyc2UgbWFwIHRvIGxvb2sgdXAgQ29tbWl0cyBnaXZlbiBqdXN0IHRoZSBub2RlIHRoZXkgcmVwcmVzZW50ICovXG4gIGNvbW1pdEJ5Tm9kZTogTWFwPFROb2RlLCBDb21taXQyPiA9IG5ldyBNYXAoKTtcblxuICAvKiogRm9yIGEgZ2l2ZW4gQ29tbWl0SUQsIGZpbmQgaXQncyBjbG9zZXN0IFwicmVhbFwiIHBhcmVudCAoYSBhbmNlc3RvciB3aXRoIGEgbm9uLW51bGwgVE5vZGUpICovXG4gIHBhcmVudEJ5Tm9kZTogTWFwPENvbW1pdElELCBDb21taXQyPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogQSBzZXQgb2YgYWxsIHNwZWNpYWwgUm9vdCBlbGVtZW50IElEcyBpbiB0aGUgdHJlZS5cbiAgICogQSBSb290IGVsZW1lbnQgaGVscHMgdGVsbCBhIHJlbmRlcmVyIHdoYXQga2luZCBvZiBlbGVtZW50XG4gICAqIHRvIHJlbmRlciwgYmFzZWQgb24gaXQncyBjbG9zZXN0IFJvb3QuXG4gICAqL1xuICByb290czogTWFwPENvbW1pdElELCBDb21taXQyPiA9IG5ldyBNYXAoKTtcbiAgYnVzOiBSZWNvbmNpbGVyRXZlbnRCdXM7XG4gIGJ1aWxkZXI6IE5vZGVCdWlsZGVyPFROb2RlLCBUUm9vdD47XG5cbiAgY29uc3RydWN0b3IodHJlZTogQ29tbWl0VHJlZTIsIGJ1aWxkZXI6IE5vZGVCdWlsZGVyPFROb2RlLCBUUm9vdD4pIHtcbiAgICB0aGlzLnRyZWUgPSB0cmVlO1xuICAgIHRoaXMuYnVzID0ge1xuICAgICAgcmVuZGVyOiAoZGVsdGEpID0+IHtcbiAgICAgICAgdGhpcy5jcmVhdGUoZGVsdGEpO1xuICAgICAgICB0aGlzLnVwZGF0ZShkZWx0YSk7XG4gICAgICB9LFxuICAgIH1cbiAgICB0aGlzLmJ1aWxkZXIgPSBidWlsZGVyO1xuICB9XG5cbiAgZmluZENoaWxkcmVuKGlkOiBDb21taXRJRCwgaWdub3JlRmlyc3QgPSBmYWxzZSwgaWdub3JlU3VzcGVuZGVkID0gdHJ1ZSk6IFROb2RlW10ge1xuICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5vZGVCeUNvbW1pdC5nZXQoaWQpO1xuICAgIGlmIChub2RlICYmICFpZ25vcmVGaXJzdClcbiAgICAgIHJldHVybiBbbm9kZV07XG5cbiAgICBjb25zdCBjb21taXQgPSB0aGlzLnRyZWUuY29tbWl0cy5nZXQoaWQpO1xuICAgIGlmICghY29tbWl0KVxuICAgICAgcmV0dXJuIFtdO1xuICAgIGlmIChjb21taXQuZWxlbWVudC50eXBlID09PSBwcmltaXRpdmVOb2RlVHlwZXMubnVsbClcbiAgICAgIHJldHVybiBbXTtcbiAgICAvLyBzdXNwZW5kZWQgbm9kZXMgZG9uJ3QgY291bnQgYXMgY2hpbGRyZW5cbiAgICBpZiAoaWdub3JlU3VzcGVuZGVkICYmIGNvbW1pdC5pc1N1c3BlbmRlZCgpKVxuICAgICAgcmV0dXJuIFtdO1xuXG4gICAgcmV0dXJuIGNvbW1pdC5jaGlsZHJlbi5tYXAoYyA9PiB0aGlzLmZpbmRDaGlsZHJlbihjLmlkKSkuZmxhdCgxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBcImZpbmQgcGFyZW50XCIgY2FuIHJldHVybiAzIHR5cGVzIG9mIHJlc3VsdHM6XG4gICAqICAtIEFuIGFuY2VzdG9yIGhhcyBhIG5vZGUhIHdlIHJldHVybiB0aGF0LlxuICAgKiAgLSBBbiBhbmNlc3RvciBpcyBhIFwibnVsbFwiIG5vZGUgLSB3ZSByZXR1cm4gdGhlIHNwZWNpYWwgZm9ybSBvZiBcImNvbW1pdCBidXQgbm8gbm9kZVwiXG4gICAqICAtIE5vIGFuY2VzdG9yIGhhcyBhIG5vZGUgLSB5b3UgbWlnaHQgYmUgbmVhciB0aGUgcm9vdFxuICAgKiBAcGFyYW0gcmVmIFxuICAgKiBAcmV0dXJucyBcbiAgICovXG4gIGZpbmRQYXJlbnQocmVmOiBDb21taXRSZWYyKTogUGFyZW50U2VhcmNoUmVzdWx0PFROb2RlPiB7XG4gICAgbGV0IGFuY2VzdG9yOiBDb21taXRSZWYyIHwgbnVsbCA9IHJlZjtcbiAgICBsZXQgYXR0YWNoYWJsZSA9IHRydWU7XG5cbiAgICB3aGlsZSAoYW5jZXN0b3IpIHtcbiAgICAgIGlmIChhbmNlc3Rvci5pZCAhPT0gcmVmLmlkKSB7XG4gICAgICAgIGNvbnN0IGNvbW1pdCA9IHRoaXMudHJlZS5jb21taXRzLmdldChhbmNlc3Rvci5pZCkgfHwgbnVsbDtcblxuICAgICAgICAvLyBFYXJseSBleGl0IG91dCBvZiBwYXJlbnQgbG9va3VwIGlmIHNvbWVvbmUgb24gdGhlIHBhdGggaXMgbnVsbDtcbiAgICAgICAgaWYgKGNvbW1pdCAmJiBjb21taXQuZWxlbWVudC50eXBlID09PSBwcmltaXRpdmVOb2RlVHlwZXMubnVsbClcbiAgICAgICAgICByZXR1cm4geyBjb21taXQsIG5vZGU6IG51bGwsIGF0dGFjaGFibGU6IGZhbHNlIH07XG5cbiAgICAgICAgLy8gbWF5YmUgYSBiYWQgaWRlYS4uLiB3ZSdsbCBzZWVcbiAgICAgICAgaWYgKGNvbW1pdCAmJiBjb21taXQuaXNTdXNwZW5kZWQoKSlcbiAgICAgICAgICBhdHRhY2hhYmxlID0gZmFsc2U7XG5cbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMubm9kZUJ5Q29tbWl0LmdldChhbmNlc3Rvci5pZCk7XG4gICAgICAgIC8vIElmIHlvdSBmaW5kIGFuIGVsZW1lbnQgd2l0aCBhIG5vZGVcbiAgICAgICAgaWYgKG5vZGUpXG4gICAgICAgICAgcmV0dXJuIHsgY29tbWl0LCBub2RlLCBhdHRhY2hhYmxlIH1cbiAgICAgIH1cbiAgICAgIGFuY2VzdG9yID0gYW5jZXN0b3IucGFyZW50O1xuICAgIH1cblxuICAgIC8vIHRoaXMgZWxlbWVudCBoYXMgbm8gXCJub2RlXCIgcGFyZW50cyAtIGl0IGlzIHByb2JhYmx5IGEgXCJyb290XCIgY29tbWl0XG4gICAgcmV0dXJuIHsgY29tbWl0OiBudWxsLCBub2RlOiBudWxsLCBhdHRhY2hhYmxlIH07XG4gIH1cblxuICBmaW5kUm9vdChyZWY6IENvbW1pdFJlZjIpIHtcbiAgICBsZXQgYW5jZXN0b3I6IENvbW1pdFJlZjIgfCBudWxsID0gcmVmO1xuXG4gICAgd2hpbGUgKGFuY2VzdG9yKSB7XG4gICAgICBjb25zdCByb290ID0gdGhpcy5yb290cy5nZXQoYW5jZXN0b3IuaWQpO1xuICAgICAgaWYgKHJvb3QpXG4gICAgICAgIHJldHVybiByb290O1xuICAgICAgYW5jZXN0b3IgPSBhbmNlc3Rvci5wYXJlbnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBuZXdOb2RlczogU2V0PFtDb21taXQyLCBUTm9kZV0+ID0gbmV3IFNldCgpO1xuICBuZWVkc1Jlb3JkZXI6IFNldDxDb21taXRJRD4gPSBuZXcgU2V0KCk7XG5cbiAgY3JlYXRlKGRlbHRhczogRGVsdGEpIHtcbiAgICB0aGlzLm5ld05vZGVzLmNsZWFyKCk7XG4gICAgdGhpcy5uZWVkc1Jlb3JkZXIuY2xlYXIoKTtcblxuICAgIGZvciAoY29uc3QgbmV4dCBvZiBkZWx0YXMuZnJlc2gudmFsdWVzKCkpIHtcbiAgICAgIGlmIChuZXh0LmVsZW1lbnQudHlwZSA9PT0gc3BlY2lhbE5vZGVUeXBlcy5yZW5kZXIpIHtcbiAgICAgICAgLy8gYWRkIHJlbmRlciBib3VuZGFyeVxuICAgICAgICB0aGlzLnJvb3RzLnNldChuZXh0LnJlZi5pZCwgbmV4dCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3Qgcm9vdCA9IHRoaXMuZmluZFJvb3QobmV4dC5yZWYpO1xuICAgICAgaWYgKCFyb290KVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgY29uc3Qgcm9vdFR5cGUgPSByb290LmVsZW1lbnQucHJvcHNbJ3R5cGUnXSBhcyBUUm9vdDtcblxuICAgICAgLy8gdGVzdCB0byBzZWUgaWYgdGhpcyBlbGVtZW50XG4gICAgICAvLyBiZWxvbmdzIHRvIHRoaXMgXG4gICAgICBpZiAodGhpcy5idWlsZGVyLnJvb3RzLmhhcyhyb290VHlwZSkgKSB7XG4gICAgICAgIC8vIFRyeSB0byBjcmVhdGUgYSA8VD4gZm9yIGV2ZXJ5IG5ldyBjb21taXRcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuYnVpbGRlci5jcmVhdGUobmV4dC5lbGVtZW50LCByb290VHlwZSwgbmV4dC5yZWYpO1xuICAgICAgICAvLyBOb3QgYWxsIGNvbW1pdHMgaGF2ZSBhIGNvcnJlc3BvbmRpbmcgbm9kZVxuICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgIHRoaXMubmV3Tm9kZXMuYWRkKFtuZXh0LCBub2RlXSk7XG4gICAgICAgICAgdGhpcy5ub2RlQnlDb21taXQuc2V0KG5leHQucmVmLmlkLCBub2RlKTtcbiAgICAgICAgICB0aGlzLmNvbW1pdEJ5Tm9kZS5zZXQobm9kZSwgbmV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB1cGRhdGUoZGVsdGFzOiBEZWx0YSkge1xuICAgIGNvbnN0IHtcbiAgICAgIGxpbmssXG4gICAgICB1bmxpbmssXG4gICAgICBsaW5rUm9vdCxcbiAgICAgIHNvcnQsXG4gICAgICB1cGRhdGUsXG4gICAgICBkZXN0cm95LFxuICAgICAgdW5saW5rUm9vdCxcbiAgICAgIHN1c3BlbmQgPSB1bmxpbmssXG4gICAgICB1bnN1c3BlbmQgPSBsaW5rXG4gICAgfSA9IHRoaXMuYnVpbGRlcjtcblxuICAgIGlmIChsaW5rIHx8IHNvcnQpIHtcbiAgICAgIC8vIExvb3AgdGhyb3VnaCBuZXdseSBjcmVhdGVkIG5vZGVzXG4gICAgICBmb3IgKGNvbnN0IFtuZXh0LCBub2RlXSBvZiB0aGlzLm5ld05vZGVzKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZmluZFBhcmVudChuZXh0LnJlZik7XG5cbiAgICAgICAgaWYgKG5leHQuZWxlbWVudC50eXBlID09PSBzcGVjaWFsTm9kZVR5cGVzLnN1c3BlbmQpXG4gICAgICAgICAgY29uc29sZS5sb2coYENyZWF0aW5nIHN1c3BlbnNlIG5vZGVgLCByZXN1bHQpXG5cbiAgICAgICAgaWYgKHJlc3VsdC5jb21taXQgJiYgcmVzdWx0Lm5vZGUgJiYgcmVzdWx0LmF0dGFjaGFibGUpIHtcbiAgICAgICAgICB0aGlzLm5lZWRzUmVvcmRlci5hZGQocmVzdWx0LmNvbW1pdC5yZWYuaWQpXG5cbiAgICAgICAgICBpZiAobGluaylcbiAgICAgICAgICAgIGxpbmsobm9kZSwgcmVzdWx0Lm5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxpbmtSb290ICYmICFyZXN1bHQuY29tbWl0ICYmIHJlc3VsdC5hdHRhY2hhYmxlKVxuICAgICAgICAgIGxpbmtSb290KG5vZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh1cGRhdGUpIHtcbiAgICAgIGZvciAoY29uc3QgeyBwcmV2LCBuZXh0LCBtb3ZlZCB9IG9mIGRlbHRhcy5jaGFuZ2VkLnZhbHVlcygpKSB7XG5cbiAgICAgICAgLy8gc3VzcGVuc2UgY29kZVxuICAgICAgICBpZiAobmV4dC5lbGVtZW50LnR5cGUgPT09IHNwZWNpYWxOb2RlVHlwZXMuc3VzcGVuZCkge1xuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZmluZFBhcmVudChuZXh0LnJlZik7XG5cbiAgICAgICAgICBjb25zdCB3YXNTdXNwZW5kZWQgPSAhIXByZXYucHJvcHMuc3VzcGVuZGVkO1xuICAgICAgICAgIGNvbnN0IGlzU3VzcGVuZGVkID0gISFuZXh0LmVsZW1lbnQucHJvcHMuc3VzcGVuZGVkO1xuXG4gICAgICAgICAgY29uc3Qgc3VzcGVuc2VDaGFuZ2VkID0gd2FzU3VzcGVuZGVkICE9PSBpc1N1c3BlbmRlZDtcbiAgICAgICAgICBpZiAoc3VzcGVuc2VDaGFuZ2VkICYmIHJlc3VsdC5jb21taXQgJiYgcmVzdWx0Lm5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMubmVlZHNSZW9yZGVyLmFkZChyZXN1bHQuY29tbWl0LnJlZi5pZCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdGhpcy5maW5kQ2hpbGRyZW4obmV4dC5yZWYuaWQsIHRydWUsIGZhbHNlKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgaWYgKGlzU3VzcGVuZGVkICYmIHN1c3BlbmQpIHtcbiAgICAgICAgICAgICAgICBzdXNwZW5kKGNoaWxkLCByZXN1bHQubm9kZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIGlmICghaXNTdXNwZW5kZWQgJiYgdW5zdXNwZW5kKSB7XG4gICAgICAgICAgICAgICAgdW5zdXNwZW5kKGNoaWxkLCByZXN1bHQubm9kZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5ub2RlQnlDb21taXQuZ2V0KG5leHQucmVmLmlkKTtcbiAgICAgICAgaWYgKCFub2RlKVxuICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgIHVwZGF0ZShub2RlLCBuZXh0LmVsZW1lbnQsIHByZXYsIG5leHQucmVmKTtcblxuICAgICAgICBpZiAobW92ZWQpIHtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmZpbmRQYXJlbnQobmV4dC5yZWYpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmIChyZXN1bHQuY29tbWl0KSB7XG4gICAgICAgICAgICB0aGlzLm5lZWRzUmVvcmRlci5hZGQocmVzdWx0LmNvbW1pdC5yZWYuaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBuZXh0IG9mIGRlbHRhcy5mcmVzaC52YWx1ZXMoKSkge1xuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5ub2RlQnlDb21taXQuZ2V0KG5leHQucmVmLmlkKTtcbiAgICAgICAgaWYgKG5vZGUpXG4gICAgICAgICAgdXBkYXRlKG5vZGUsIG5leHQuZWxlbWVudCwgbnVsbCwgbmV4dC5yZWYpO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IHByZXYgb2YgZGVsdGFzLnJlbW92ZWQudmFsdWVzKCkpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5vZGVCeUNvbW1pdC5nZXQocHJldi5yZWYuaWQpO1xuICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgdGhpcy5ub2RlQnlDb21taXQuZGVsZXRlKHByZXYucmVmLmlkKTtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5maW5kUGFyZW50KHByZXYucmVmKTtcbiAgICAgICAgaWYgKHBhcmVudC5jb21taXQgJiYgcGFyZW50Lm5vZGUpXG4gICAgICAgICAgdGhpcy5uZWVkc1Jlb3JkZXIuYWRkKHBhcmVudC5jb21taXQucmVmLmlkKVxuXG4gICAgICAgIHRoaXMuY29tbWl0QnlOb2RlLmRlbGV0ZShub2RlKTtcbiAgICAgICAgaWYgKHVubGluayAmJiBwYXJlbnQubm9kZSlcbiAgICAgICAgICB1bmxpbmsobm9kZSwgcGFyZW50Lm5vZGUpO1xuICAgICAgICBpZiAodW5saW5rUm9vdCAmJiAhcGFyZW50LmNvbW1pdClcbiAgICAgICAgICB1bmxpbmtSb290KG5vZGUpXG4gICAgICAgIGlmIChkZXN0cm95KVxuICAgICAgICAgIGRlc3Ryb3kobm9kZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHNvcnQpIHtcbiAgICAgIGZvciAoY29uc3QgaWQgb2YgdGhpcy5uZWVkc1Jlb3JkZXIpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMubm9kZUJ5Q29tbWl0LmdldChpZCk7XG4gICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB0aGlzLmZpbmRDaGlsZHJlbihpZCwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgICAgc29ydChub2RlLCBjaGlsZHJlbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBTY2hlZHVsZXIgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0LXJlY29uXCI7XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVET01TY2hlZHVsZXIgPSAoKTogU2NoZWR1bGVyID0+IHtcbiAgbGV0IGlkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgbGV0IGNhbGxiYWNrRnVuYyA9ICgpID0+IGNvbnNvbGUuZXJyb3IoYERPTVNjaGVkdWxlciBnb3QgY2FsbGJhY2sgYmVmb3JlIGNhbGxiYWNrIGZ1bmN0aW9uIHdhcyBjb25maWd1cmVkYClcbiAgbGV0IHN5bmNjYWxsX2F2YWlsYWJsZSA9IGZhbHNlO1xuICBsZXQgc3luY2NhbGxfcmVxdWVzdGVkID0gZmFsc2U7XG4gIGNvbnN0IHRpbWVfYnVkZ2V0ID0gNjA7XG5cbiAgY29uc3Qgb25UaW1lb3V0ID0gKCkgPT4ge1xuICAgIGNvbnN0IHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgaWQgPSBudWxsO1xuXG4gICAgc3luY2NhbGxfYXZhaWxhYmxlID0gdHJ1ZTtcbiAgICAvLyBhdCBsZWFzdCAxIGNhbGxcbiAgICBjYWxsYmFja0Z1bmMoKTtcblxuICAgIC8vIGlmIGNhbGxiYWNrIGZ1bmMgcmUtcmVxdWVzdGVkIGEgY2FsbCxcbiAgICAvLyBkbyB0aGUgcmVzdCBpbiBzeW5jXG4gICAgd2hpbGUgKHN5bmNjYWxsX3JlcXVlc3RlZCkge1xuICAgICAgc3luY2NhbGxfcmVxdWVzdGVkID0gZmFsc2U7XG4gICAgICBjb25zdCBub3cgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgIFxuICAgICAgaWYgKG5vdyAtIHN0YXJ0ID49IHRpbWVfYnVkZ2V0KSB7XG4gICAgICAgIHN5bmNjYWxsX2F2YWlsYWJsZSA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgXG4gICAgICBjYWxsYmFja0Z1bmMoKTtcbiAgICB9XG4gICAgc3luY2NhbGxfYXZhaWxhYmxlID0gZmFsc2U7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHNldENhbGxiYWNrRnVuYyhuZXdDYWxsYmFja0Z1bmMpIHtcbiAgICAgIGNhbGxiYWNrRnVuYyA9IG5ld0NhbGxiYWNrRnVuYztcbiAgICB9LFxuICAgIGlzQ2FsbGJhY2tQZW5kaW5nKCkge1xuICAgICAgcmV0dXJuIGlkICE9PSBudWxsO1xuICAgIH0sXG4gICAgcmVxdWVzdENhbGxiYWNrKCkge1xuICAgICAgaWYgKHN5bmNjYWxsX2F2YWlsYWJsZSkge1xuICAgICAgICBzeW5jY2FsbF9yZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoIWlkKSB7XG4gICAgICAgIGlkID0gd2luZG93LnNldFRpbWVvdXQob25UaW1lb3V0LCAwKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGNhbmNlbENhbGxiYWNrKCkge1xuICAgICAgaWYgKGlkICE9PSBudWxsKVxuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KGlkKTtcbiAgICB9LFxuICB9XG59XG4iLCAiaW1wb3J0IHsgTWFnaWNFcnJvciB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcblxuLyoqXG4gKiBDaGFuZ2VSZXBvcnRcbiAqL1xuZXhwb3J0IGNsYXNzIENoYW5nZVJlcG9ydDIge1xuICAvKipcbiAgICogVGhlIGluZGljZXMgb2YgZWxlbWVudHMgdGhhdCB3ZXJlIHJlbW92ZWRcbiAgICovXG4gIHJlbW92ZWQ6IG51bWJlcltdID0gW107XG4gIC8qKlxuICAgKiBUaGUgaW5kaWNlcyBvZiB0aGUgcHJldmlvdXMgcG9zaXRpb24gdGhhdCBhbiBlbGVtZW50XG4gICAqIHdhcyBpbiwgb3IgLTEgaWYgaXQgZGlkbid0IGV4aXN0IGluIHRoZSBcInByZXZzXCIgYXJyYXkuXG4gICAqL1xuICB0cmFuc2Zvcm06IG51bWJlcltdID0gW107XG5cbiAgLyoqXG4gICAqIEEgKGhvcGVmdWxseSkgZmFzdGVyIHNpbmdsZS1lbnRyeSByZXBvcnQgZ2VuZXJhdG9yXG4gICAqIEBwYXJhbSBwcmV2IFxuICAgKiBAcGFyYW0gbmV4dCBcbiAgICogQHBhcmFtIGVxdWFsaXR5VGVzdCBcbiAgICogQHJldHVybnMgXG4gICAqL1xuICBzdGF0aWMgZ2VuZXJhdGVTaW5nbGVzPFByZXYsIE5leHQ+KHByZXY6IFByZXYsIG5leHQ6IE5leHQsIGVxdWFsaXR5VGVzdDogQ2hhbmdlRXF1YWxpdHlUZXN0PFByZXYsIE5leHQ+KSB7XG4gICAgY29uc3QgcmVwb3J0ID0gbmV3IENoYW5nZVJlcG9ydDIoKTtcblxuICAgIGlmIChlcXVhbGl0eVRlc3QocHJldiwgbmV4dCwgMCwgMCkpIHtcbiAgICAgIHJlcG9ydC50cmFuc2Zvcm0ucHVzaCgwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVwb3J0LnRyYW5zZm9ybS5wdXNoKC0xKTtcbiAgICAgIHJlcG9ydC5yZW1vdmVkLnB1c2goMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcG9ydDtcbiAgfVxuXG4gIHN0YXRpYyBnZW5lcmF0ZTxQcmV2LCBOZXh0PihwcmV2czogUHJldltdLCBuZXh0czogTmV4dFtdLCBlcXVhbGl0eVRlc3Q6IENoYW5nZUVxdWFsaXR5VGVzdDxQcmV2LCBOZXh0Pikge1xuICAgIGlmIChwcmV2cy5sZW5ndGggPT09IDAgJiYgbmV4dHMubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIENoYW5nZVJlcG9ydDIuZ2VuZXJhdGVTaW5nbGVzKHByZXZzWzBdLCBuZXh0c1swXSwgZXF1YWxpdHlUZXN0KTtcblxuICAgIGNvbnN0IHJlcG9ydCA9IG5ldyBDaGFuZ2VSZXBvcnQyKCk7XG4gICAgY29uc3QgdmlzaXRlZCA9IG5ldyBTZXQoKTtcblxuICAgIGZvciAobGV0IG5leHRJbmRleCA9IDA7IG5leHRJbmRleCA8IG5leHRzLmxlbmd0aDsgbmV4dEluZGV4KyspIHtcbiAgICAgIGNvbnN0IG5leHQgPSBuZXh0c1tuZXh0SW5kZXhdO1xuICAgICAgY29uc3QgcHJldkluZGV4ID0gcHJldnMuZmluZEluZGV4KChwcmV2LCBwcmV2SW5kZXgpID0+IGVxdWFsaXR5VGVzdChwcmV2LCBuZXh0LCBwcmV2SW5kZXgsIG5leHRJbmRleCkpO1xuICAgICAgcmVwb3J0LnRyYW5zZm9ybS5wdXNoKHByZXZJbmRleCk7XG4gICAgICBpZiAocHJldkluZGV4ICE9PSAtMSlcbiAgICAgICAgdmlzaXRlZC5hZGQocHJldkluZGV4KTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmV2cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCF2aXNpdGVkLmhhcyhpKSlcbiAgICAgICAgcmVwb3J0LnJlbW92ZWQucHVzaChpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVwb3J0O1xuICB9XG59XG5cbmV4cG9ydCB0eXBlIENoYW5nZUVxdWFsaXR5VGVzdDxQcmV2LCBOZXh0PiA9IChwcmV2OiBQcmV2LCBuZXh0OiBOZXh0LCBwcmV2SW5kZXg6IG51bWJlciwgbmV4dEluZGV4OiBudW1iZXIpID0+IGJvb2xlYW47XG5cbmV4cG9ydCBjb25zdCBmaXJzdCA9IDxYLCBZPihhcnJheTogUmVhZG9ubHlBcnJheTxYPiwgZnVuYzogKHZhbHVlOiBYLCBpbmRleDogbnVtYmVyKSA9PiBZIHwgbnVsbCk6IFkgfCBudWxsID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHZhbHVlID0gYXJyYXlbaV07XG4gICAgY29uc3QgcmVzdWx0ID0gZnVuYyh2YWx1ZSwgaSk7XG4gICAgaWYgKHJlc3VsdCAhPT0gbnVsbClcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBjb25zdCBsYXN0ID0gPFgsIFkgZXh0ZW5kcyB7fT4oYXJyYXk6IFJlYWRvbmx5QXJyYXk8WD4sIGZ1bmM6ICh2YWx1ZTogWCwgaW5kZXg6IG51bWJlcikgPT4gWSB8IG51bGwgfCBmYWxzZSB8IHVuZGVmaW5lZCB8IDApOiBZIHwgbnVsbCA9PiB7XG4gIGZvciAobGV0IGkgPSBhcnJheS5sZW5ndGggLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgY29uc3QgdmFsdWUgPSBhcnJheVtpXTtcbiAgICBjb25zdCByZXN1bHQgPSBmdW5jKHZhbHVlLCBpKTtcbiAgICBpZiAocmVzdWx0KVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cbiIsICJcbi8qKlxuICogQSBzaG9ydCB1dGlsaXR5IGZvciByZS11c2luZyBvbGQgb2JqZWN0c1xuICogdG8gYXZvaWQgZG9pbmcgdG9vIG11Y2ggR0MgdGhyYXNoaW5nLCBhdCB0aGVcbiAqIGNvc3Qgb2YgaW5jcmVhc2VkIG1lbW9yeS5cbiAqIFxuICogRG9uJ3Qga25vdyB5ZXQgaWYgdGhlIHRyYWRlIG9mZiBpdCB3b3J0aCBpdC5cbiAqL1xuZXhwb3J0IHR5cGUgT2JqZWN0UG9vbDxULCBUQXJncyBleHRlbmRzIHVua25vd25bXT4gPSB7XG4gIG1heFNpemU6IG51bWJlcixcbiAgc2l6ZTogbnVtYmVyLFxuXG4gIGFsbDogVFtdLFxuICBhdmFpbGFibGU6IFRbXSxcblxuICBhY3F1aXJlKC4uLmFyZ3M6IFRBcmdzKTogVCxcbiAgcmVsZWFzZSh2YWx1ZTogVCk6IHZvaWQsXG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVPYmplY3RQb29sID0gPFQsIFRBcmdzIGV4dGVuZHMgdW5rbm93bltdPihcbiAgYnVpbGQ6ICguLi5hcmdzOiBUQXJncykgPT4gVCxcbiAgYXNzaWduOiAodmFsdWU6IFQsIC4uLmFyZ3M6IFRBcmdzKSA9PiB2b2lkLFxuKTogT2JqZWN0UG9vbDxULCBUQXJncz4gPT4ge1xuICBjb25zdCBwb29sID0ge1xuICAgIG1heFNpemU6IDI1NixcbiAgICBhdmFpbGFibGU6IFtdIGFzIFRbXSxcbiAgICBhbGw6IFtdIGFzIFRbXSxcbiAgICBnZXQgc2l6ZSgpIHtcbiAgICAgIHJldHVybiBwb29sLmF2YWlsYWJsZS5sZW5ndGg7XG4gICAgfSxcbiAgICBhY3F1aXJlKC4uLmFyZ3M6IFRBcmdzKTogVCB7XG4gICAgICBsZXQgb2JqZWN0ID0gcG9vbC5hdmFpbGFibGUucG9wKCk7XG4gICAgICBpZiAoIW9iamVjdCkge1xuICAgICAgICBvYmplY3QgPSBidWlsZCguLi5hcmdzKTtcbiAgICAgICAgcG9vbC5hbGwucHVzaChvYmplY3QpO1xuICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgICAgfVxuXG4gICAgICBhc3NpZ24ob2JqZWN0LCAuLi5hcmdzKTtcbiAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgfSxcbiAgICByZWxlYXNlKHZhbHVlOiBUKSB7XG4gICAgICAvL2lmIChwb29sLnNpemUgPCBwb29sLm1heFNpemUpXG4gICAgICBwb29sLmF2YWlsYWJsZS5wdXNoKHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHBvb2w7XG59IiwgImltcG9ydCB7IGNyZWF0ZUlkLCBFbGVtZW50LCBPcGFxdWVJRCwgc3BlY2lhbE5vZGVUeXBlcywgU3VzcGVuZFByb3BzIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuaW1wb3J0IHsgY3JlYXRlT2JqZWN0UG9vbCB9IGZyb20gXCIuL3Bvb2xcIjtcblxuLyoqXG4gKiBBIHNpbmdsZSBjb25zaXN0ZW50IGlkIHJlcHJlc2VudGluZyBhIGNvbW1pdCBpbiB0aGUgYWN0IHRyZWUuXG4gKiBEb2VzIG5vdCBjaGFuZ2UuXG4gKi9cbmV4cG9ydCB0eXBlIENvbW1pdElEID0gT3BhcXVlSUQ8XCJDb21taXRJRFwiPjtcbi8qKlxuICogQSBJRCBmb3IgYSBwYXJ0aWN1bGFyIF9zdGF0ZV8gYSAqKkNvbW1pdCoqIGlzIGluIC0gZXZlcnkgdGltZSBpdCBvciBpdHNcbiAqIGNoaWxkcmVuIGNoYW5nZSwgYSBjb21taXQgd2l0aCB0aGUgc2FtZSBJZCBidXQgYSBuZXcgQ29tbWl0VmVyc2lvblxuICogaXMgYWRkZWQgdG8gdGhlIHRyZWUsIHJlcGxhY2luZyB0aGUgcHJldmlvdXMuXG4gKi9cbmV4cG9ydCB0eXBlIENvbW1pdFZlcnNpb24gPSBPcGFxdWVJRDxcIkNvbW1pdFZlcnNpb25cIj47XG5cbmV4cG9ydCBjbGFzcyBDb21taXRSZWYyIHtcbiAgaWQ6IENvbW1pdElEO1xuICBwYXJlbnQ6IG51bGwgfCBDb21taXRSZWYyO1xuICBsZW5ndGg6IG51bWJlcjtcblxuICBwcml2YXRlIGNvbnN0cnVjdG9yKGlkOiBDb21taXRJRCwgcGFyZW50OiBDb21taXRSZWYyIHwgbnVsbCkge1xuICAgIHRoaXMuaWQgPSBpZDtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICBpZiAocGFyZW50KVxuICAgICAgdGhpcy5sZW5ndGggPSBwYXJlbnQubGVuZ3RoICsgMTtcbiAgICBlbHNlXG4gICAgICB0aGlzLmxlbmd0aCA9IDE7XG4gIH1cblxuICAvKlxuICBbU3ltYm9sLml0ZXJhdG9yXSgpIHtcbiAgICByZXR1cm4gdGhpcy5hbmNlc3RvcnMoKTtcbiAgfVxuICAgICovXG4gIFxuICAvKipcbiAgICogSXRlcmF0ZSB0aG91Z2ggYWxsIFwicGFyZW50XCIgY29tbWl0IHJlZnMsXG4gICAqIGluY2x1ZGluZyBpdHNlbGYgYXMgdGhlIGZpcnN0IGVudHJ5LlxuICAgKiBcbiAgICogQHJldHVybnMgSXRlcmF0b3I8Q29tbWl0UmVmMj5cbiAgICovXG4gICphbmNlc3RvcnMoKSB7XG4gICAgbGV0IHJlZjogQ29tbWl0UmVmMiB8IG51bGwgPSB0aGlzO1xuXG4gICAgd2hpbGUgKHJlZikge1xuICAgICAgeWllbGQgcmVmO1xuICAgICAgcmVmID0gcmVmLnBhcmVudDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogXG4gICAqIEBwYXJhbSBjbGltYmVyIEEgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyBldmVyeSBhbmNlc3RvciBjb21taXQgcmVmLFxuICAgKiBpbmNsdWRpbmcgdGhpcyBvbmUuIFJldHVybiBcInRydWVcIiB0byBzdG9wIGNsaW1iaW5nIGVhcmx5LlxuICAgKi9cbiAgY2xpbWIoY2xpbWJlcjogKHJlZjogQ29tbWl0UmVmMikgPT4gYm9vbGVhbiB8IHZvaWQpIHtcbiAgICBsZXQgcmVmOiBDb21taXRSZWYyIHwgbnVsbCA9IHRoaXM7XG4gICAgd2hpbGUgKHJlZikge1xuICAgICAgaWYgKGNsaW1iZXIocmVmKSlcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICByZWYgPSByZWYucGFyZW50O1xuICAgIH1cbiAgfVxuXG4gIGZpbmQ8VD4odGVzdDogKGlkOiBDb21taXRSZWYyKSA9PiBUIHwgbnVsbCB8IHVuZGVmaW5lZCB8IGZhbHNlKTogVCB8IG51bGwge1xuICAgIGxldCByZXN1bHQ6IFQgfCBudWxsID0gbnVsbDtcbiAgICB0aGlzLmNsaW1iKHJlZiA9PiB7XG4gICAgICBjb25zdCBjdXJyZW50UmVzdWx0ID0gdGVzdChyZWYpO1xuICAgICAgaWYgKGN1cnJlbnRSZXN1bHQpIHtcbiAgICAgICAgcmVzdWx0ID0gY3VycmVudFJlc3VsdFxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBzdGF0aWMgZnJlc2gocGFyZW50OiBDb21taXRSZWYyIHwgbnVsbCkge1xuICAgIHJldHVybiBuZXcgQ29tbWl0UmVmMihjcmVhdGVJZCgnQ29tbWl0SUQnKSwgcGFyZW50KTtcbiAgfVxuICBzdGF0aWMgcmVoeWRyYXRlKGlkOiBDb21taXRJRCwgbGVuZ3RoOiBudW1iZXIpIHtcbiAgICBjb25zdCByZWYgPSBuZXcgQ29tbWl0UmVmMihpZCwgbnVsbCk7XG4gICAgcmVmLmxlbmd0aCA9IGxlbmd0aDtcbiAgICByZXR1cm4gcmVmO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb21taXQyIHtcbiAgc3RhdGljIHBvb2wgPSAoKSA9PiBjcmVhdGVPYmplY3RQb29sPENvbW1pdDIsIENvbnN0cnVjdG9yUGFyYW1ldGVyczx0eXBlb2YgQ29tbWl0Mj4+KFxuICAgIGZ1bmN0aW9uIGFsbG9jIChyZWYsIGVsLCBjaCkgeyByZXR1cm4gbmV3IENvbW1pdDIocmVmLCBlbCwgY2gpIH0sXG4gICAgZnVuY3Rpb24gcmVhc3NpZ24oYywgcmVmLCBlbCwgY2gpIHtcbiAgICAgIGMucmVmID0gcmVmO1xuICAgICAgYy5lbGVtZW50ID0gZWw7XG4gICAgICBjLmNoaWxkcmVuID0gY2g7XG4gICAgICBjLnZlcnNpb24gPSBjcmVhdGVJZCgnQ29tbWl0VmVyc2lvbicpO1xuICAgIH1cbiAgKVxuXG4gIHJlZjogQ29tbWl0UmVmMjtcblxuICBlbGVtZW50OiBFbGVtZW50O1xuICBjaGlsZHJlbjogQ29tbWl0UmVmMltdO1xuXG4gIHZlcnNpb246IENvbW1pdFZlcnNpb24gPSBjcmVhdGVJZCgnQ29tbWl0VmVyc2lvbicpO1xuXG4gIGNvbnN0cnVjdG9yKHJlZjogQ29tbWl0UmVmMiwgZWxlbWVudDogRWxlbWVudCwgY2hpbGRyZW46IENvbW1pdFJlZjJbXSkge1xuICAgIHRoaXMucmVmID0gcmVmO1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuO1xuICB9XG5cbiAgdXBkYXRlKGVsZW1lbnQ6IG51bGwgfCBFbGVtZW50ID0gbnVsbCwgY2hpbGRyZW46IG51bGwgfCBDb21taXRSZWYyW10gPSBudWxsKSB7XG4gICAgdGhpcy52ZXJzaW9uID0gY3JlYXRlSWQoJ0NvbW1pdFZlcnNpb24nKTtcbiAgICBcbiAgICBpZiAoZWxlbWVudClcbiAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgaWYgKGNoaWxkcmVuKVxuICAgICAgdGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuO1xuICB9XG5cbiAgaXNTdXNwZW5kZWQoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuZWxlbWVudC50eXBlID09PSBzcGVjaWFsTm9kZVR5cGVzLnN1c3BlbmRcbiAgICAgICYmICh0aGlzLmVsZW1lbnQucHJvcHMgYXMgU3VzcGVuZFByb3BzKS5zdXNwZW5kZWRcbiAgICApO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgRWxlbWVudCB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcbmltcG9ydCB7IENvbW1pdDIsIENvbW1pdElEIH0gZnJvbSBcIi4vY29tbWl0LnRzXCI7XG5pbXBvcnQgeyBFZmZlY3RJRCwgRWZmZWN0VGFzayB9IGZyb20gXCIuL3N0YXRlLnRzXCI7XG5cbi8qKlxuICogVGhlIERlbHRhIGNsYXNzIHJlcHJlc2VudHMgYW4gYWNjdW11bGF0aW9uXG4gKiBvZiBjaGFuZ2VzIG92ZXIgdGltZS5cbiAqIFxuICogQSBXb3JrVGhyZWFkIG1heSBkbyBzZXZlcmFsIFwicGFzc2VzXCIgb3ZlciB0aGUgQ29tbWl0VHJlZSxcbiAqIGJ1dCBhbGwgb2YgdGhvc2UgY2hhbmdlcyBhcmUgd3JpdHRlbiB0byB0aGUgc2FtZSBEZWx0YS5cbiAqIFxuICogVGhlIERlbHRhIGtlZXBzIHRyYWNrIG9mIG9ubHkgdGhlIGltbWVkaWF0ZWx5IHByaW9yIHN0YXRlICh0aGVcbiAqIGxhc3Qgb25lIHRoYXQgd2FzIHNlbnQgdG8gdGhlIFJlbmRlcmVyKSwgYW5kIHRoZSBmaW5hbCBzdGF0ZS5cbiAqIFxuICogSWYgYSBwYXNzIGNhdXNlcyBhIGNvbXBvbmVudCB0byBiZSByZW5kZXJlZC91cGRhdGVkIHNldmVyYWwgdGltZXMsXG4gKiBpdCB3aWxsIG9ubHkgYmUgcmVjb3JkZWQgaW4gdGhlIGRlbHRhIG9uY2UgZm9yIGl0J3MgZmluYWwgc3RhdGUuIFNpbWlsYXJseSxcbiAqIGlmIGFuIGVsZW1lbnQgaXMgY3JlYXRlIGluIG9uZSBwYXNzLCBidXQgcmVtb3ZlZCBpbiBhIGFub3RoZXIsIHRoZW4gaXQgd2lsbFxuICogYmUgZW50aXJlbHkgZXhjbHVkZWQgZnJvbSB0aGUgZGVsdGEgLSBhbmQgdGhlIHJlbmRlcmVyIHdpbGwgbmV2ZXIga25vdyBpdCBleGlzdGVkLlxuICogXG4gKiBUaGUgRGVsdGEgcmVjb3JkcyBDb21taXRzIGFzIHdlbGwgYXMgRWZmZWN0cyB0aGlzIHdheS5cbiAqL1xuZXhwb3J0IGNsYXNzIERlbHRhIHtcbiAgZnJlc2g6IE1hcDxDb21taXRJRCwgQ29tbWl0Mj4gPSBuZXcgTWFwKCk7XG4gIGNoYW5nZWQ6IE1hcDxDb21taXRJRCwgeyBwcmV2OiBFbGVtZW50LCBuZXh0OiBDb21taXQyLCBtb3ZlZDogYm9vbGVhbiB9PiA9IG5ldyBNYXAoKTtcbiAgcmVtb3ZlZDogTWFwPENvbW1pdElELCBDb21taXQyPiA9IG5ldyBNYXAoKTtcblxuICBlZmZlY3RzOiBNYXA8RWZmZWN0SUQsIEVmZmVjdFRhc2s+ID0gbmV3IE1hcCgpO1xuICBjbGVhbnVwczogTWFwPEVmZmVjdElELCBFZmZlY3RUYXNrPiA9IG5ldyBNYXAoKTtcblxuICBnZXQgc2l6ZSgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgKyB0aGlzLmZyZXNoLnNpemVcbiAgICAgICsgdGhpcy5jaGFuZ2VkLnNpemVcbiAgICAgICsgdGhpcy5yZW1vdmVkLnNpemVcbiAgICApXG4gIH1cblxuICBhZGQoY29tbWl0OiBDb21taXQyKSB7XG4gICAgdGhpcy5mcmVzaC5zZXQoY29tbWl0LnJlZi5pZCwgY29tbWl0KVxuICB9XG4gIHVwZGF0ZShwcmV2OiBFbGVtZW50LCBuZXh0OiBDb21taXQyLCBtb3ZlZDogYm9vbGVhbikge1xuICAgIGlmICh0aGlzLmZyZXNoLmhhcyhuZXh0LnJlZi5pZCkpIHtcbiAgICAgIHRoaXMuZnJlc2guc2V0KG5leHQucmVmLmlkLCBuZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY2hhbmdlID0gdGhpcy5jaGFuZ2VkLmdldChuZXh0LnJlZi5pZCk7XG4gICAgICBpZiAoY2hhbmdlKSB7XG4gICAgICAgIGNoYW5nZS5uZXh0ID0gbmV4dDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY2hhbmdlZC5zZXQobmV4dC5yZWYuaWQsIHsgcHJldiwgbmV4dCwgbW92ZWQgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGRlbGV0ZShjb21taXQ6IENvbW1pdDIpIHtcbiAgICBpZiAodGhpcy5mcmVzaC5oYXMoY29tbWl0LnJlZi5pZCkpIHtcbiAgICAgIHRoaXMuZnJlc2guZGVsZXRlKGNvbW1pdC5yZWYuaWQpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGlmICh0aGlzLmNoYW5nZWQuaGFzKGNvbW1pdC5yZWYuaWQpKVxuICAgICAgICB0aGlzLmNoYW5nZWQuZGVsZXRlKGNvbW1pdC5yZWYuaWQpO1xuXG4gICAgICB0aGlzLnJlbW92ZWQuc2V0KGNvbW1pdC5yZWYuaWQsIGNvbW1pdCk7XG4gICAgfVxuICB9XG5cbiAgYWRkRWZmZWN0cyh0YXNrczogRWZmZWN0VGFza1tdKSB7XG4gICAgZm9yIChjb25zdCB0YXNrIG9mIHRhc2tzKSB7XG4gICAgICB0aGlzLmVmZmVjdHMuc2V0KHRhc2suaWQsIHRhc2spO1xuICAgIH1cbiAgfVxuXG4gIGFkZENsZWFudXBzKHRhc2tzOiBFZmZlY3RUYXNrW10pIHtcbiAgICBmb3IgKGNvbnN0IHRhc2sgb2YgdGFza3MpIHtcbiAgICAgIHRoaXMuZWZmZWN0cy5kZWxldGUodGFzay5pZCk7XG4gICAgICB0aGlzLmNsZWFudXBzLnNldCh0YXNrLmlkLCB0YXNrKTtcbiAgICB9XG4gIH1cbn0iLCAiaW1wb3J0IHtcbiAgaG9va0ltcGxlbWVudGF0aW9uLCBDb250ZXh0LFxuICBWYWx1ZU9yQ2FsY3VsYXRvciwgY2FsY3VsYXRlVmFsdWUsIFN0YXRlU2V0dGVyLFxuICBydW5VcGRhdGVyLFxuICBjcmVhdGVJZCxcbiAgY2FsY3VsYXRlRGVwc0NoYW5nZSxcbiAgRWZmZWN0Q29uc3RydWN0b3IsXG4gIERlcHMsXG4gIEhvb2tJbXBsZW1lbnRhdGlvblxufSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5pbXBvcnQgeyBDb21wb25lbnRTdGF0ZSwgRWZmZWN0SUQsIEVmZmVjdFRhc2sgfSBmcm9tIFwiLi9zdGF0ZVwiO1xuaW1wb3J0IHsgQ29tbWl0UmVmMiB9IGZyb20gXCIuL2NvbW1pdFwiO1xuaW1wb3J0IHsgUmVjb25jaWxlcjIgfSBmcm9tIFwiLi9yZWNvbmNpbGVyXCI7XG5pbXBvcnQgeyBsYXN0IH0gZnJvbSBcIi4vYWxnb3JpdGhtc1wiO1xuXG4vKipcbiAqIEEgZnJlc2ggc2V0IG9mIGhvb2sgZnVuY3Rpb25zIGlzIGNyZWF0ZWQgcGVyIGNvbXBvbmVudCBydW4uXG4gKi9cbmV4cG9ydCBjb25zdCBsb2FkSG9va3MyID0gKFxuICByZWNvbmNpbGVyOiBSZWNvbmNpbGVyMixcblxuICBzdGF0ZTogQ29tcG9uZW50U3RhdGUsXG4gIHJlZjogQ29tbWl0UmVmMlxuKTogSG9va0ltcGxlbWVudGF0aW9uID0+IHtcblxuICBmdW5jdGlvbiB1c2VDb250ZXh0PFQ+KGNvbnRleHQ6IENvbnRleHQ8VD4pOiBUIHtcbiAgICBjb25zdCBzdGF0ZUluZGV4ID0gc3RhdGUuaG9va0luZGV4Kys7XG5cbiAgICBpZiAoIXN0YXRlLnByb3ZpZGVycy5oYXMoc3RhdGVJbmRleCkpIHtcbiAgICAgIGNvbnN0IHByb3ZpZGVyID0gcmVmLmZpbmQocmVmID0+IHtcbiAgICAgICAgY29uc3QgcHJvdmlkZXIgPSByZWNvbmNpbGVyLnRyZWUuY29udGV4dHMuZ2V0KHJlZi5pZClcbiAgICAgICAgaWYgKHByb3ZpZGVyICYmIHByb3ZpZGVyLmNvbnRleHRJZCA9PT0gY29udGV4dC5pZClcbiAgICAgICAgICByZXR1cm4gcHJvdmlkZXI7XG4gICAgICB9KVxuICAgICAgaWYgKHByb3ZpZGVyKSB7XG4gICAgICAgIHByb3ZpZGVyLmNvbnN1bWVycy5zZXQocmVmLmlkLCByZWYpO1xuICAgICAgfVxuICAgICAgc3RhdGUucHJvdmlkZXJzLnNldChzdGF0ZUluZGV4LCBwcm92aWRlcik7XG4gICAgfVxuICAgIGNvbnN0IHByb3ZpZGVyID0gc3RhdGUucHJvdmlkZXJzLmdldChzdGF0ZUluZGV4KTtcbiAgICBpZiAocHJvdmlkZXIpXG4gICAgICByZXR1cm4gcHJvdmlkZXIudmFsdWUgYXMgVDtcbiAgICByZXR1cm4gY29udGV4dC5kZWZhdWx0VmFsdWU7XG4gIH1cblxuICBmdW5jdGlvbiB1c2VTdGF0ZTxUPihpbml0aWFsVmFsdWU6IFZhbHVlT3JDYWxjdWxhdG9yPFQ+KTogW1QsIFN0YXRlU2V0dGVyPFQ+XSB7XG4gICAgY29uc3Qgc3RhdGVJbmRleCA9IHN0YXRlLmhvb2tJbmRleCsrO1xuICAgIGlmICghc3RhdGUudmFsdWVzLmhhcyhzdGF0ZUluZGV4KSlcbiAgICAgIHN0YXRlLnZhbHVlcy5zZXQoc3RhdGVJbmRleCwgY2FsY3VsYXRlVmFsdWUoaW5pdGlhbFZhbHVlKSk7XG5cbiAgICBjb25zdCB2YWx1ZSA9IHN0YXRlLnZhbHVlcy5nZXQoc3RhdGVJbmRleCkgYXMgVDtcbiAgICBjb25zdCBzZXRWYWx1ZTogU3RhdGVTZXR0ZXI8VD4gPSAodXBkYXRlcikgPT4ge1xuICAgICAgaWYgKHN0YXRlLnVubW91bnRlZClcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY29uc3QgcHJldlZhbHVlID0gc3RhdGUudmFsdWVzLmdldChzdGF0ZUluZGV4KSBhcyBUO1xuICAgICAgY29uc3QgbmV4dFZhbHVlID0gcnVuVXBkYXRlcihwcmV2VmFsdWUsIHVwZGF0ZXIpO1xuICAgICAgaWYgKHByZXZWYWx1ZSA9PT0gbmV4dFZhbHVlKVxuICAgICAgICByZXR1cm47XG4gICAgICBcbiAgICAgIHN0YXRlLnZhbHVlcy5zZXQoc3RhdGVJbmRleCwgbmV4dFZhbHVlKTtcbiAgICAgIHJlY29uY2lsZXIucmVuZGVyKHJlZik7XG4gICAgfTtcbiAgICByZXR1cm4gW3ZhbHVlLCBzZXRWYWx1ZV07XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIHVzZUVmZmVjdChlZmZlY3Q6IEVmZmVjdENvbnN0cnVjdG9yLCBkZXBzOiBEZXBzID0gbnVsbCkge1xuICAgIGNvbnN0IGVmZmVjdEluZGV4ID0gc3RhdGUuaG9va0luZGV4Kys7XG4gICAgaWYgKCFzdGF0ZS5lZmZlY3RzLmhhcyhlZmZlY3RJbmRleCkpXG4gICAgICBzdGF0ZS5lZmZlY3RzLnNldChlZmZlY3RJbmRleCwgY3JlYXRlSWQoXCJFZmZlY3RJRFwiKSk7XG4gICAgXG4gICAgY29uc3QgcHJldkRlcHMgPSBzdGF0ZS5kZXBzLmdldChlZmZlY3RJbmRleCkgfHwgbnVsbDtcbiAgICBjb25zdCBlZmZlY3RJZCA9IHN0YXRlLmVmZmVjdHMuZ2V0KGVmZmVjdEluZGV4KSBhcyBFZmZlY3RJRDtcbiAgICBzdGF0ZS5kZXBzLnNldChlZmZlY3RJbmRleCwgZGVwcyk7XG4gICAgY29uc3QgZGVwc0NoYW5nZXMgPSBjYWxjdWxhdGVEZXBzQ2hhbmdlKHByZXZEZXBzLCBkZXBzKVxuICAgIFxuICAgIGlmIChkZXBzQ2hhbmdlcykge1xuICAgICAgaWYgKCFzdGF0ZS5lZmZlY3RUYXNrcylcbiAgICAgICAgc3RhdGUuZWZmZWN0VGFza3MgPSBbXTtcbiAgICAgIFxuICAgICAgc3RhdGUuZWZmZWN0VGFza3MucHVzaCh7XG4gICAgICAgIGlkOiBlZmZlY3RJZCxcbiAgICAgICAgcmVmLFxuICAgICAgICBmdW5jKCkge1xuICAgICAgICAgIGNvbnN0IHByZXZDbGVhbnVwID0gc3RhdGUuY2xlYW51cHMuZ2V0KGVmZmVjdElkKTtcbiAgICAgICAgICBpZiAocHJldkNsZWFudXApIHtcbiAgICAgICAgICAgIHN0YXRlLmNsZWFudXBzLmRlbGV0ZShlZmZlY3RJZCk7XG4gICAgICAgICAgICBwcmV2Q2xlYW51cCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzdGF0ZS5jbGVhbnVwcy5zZXQoZWZmZWN0SWQsIGVmZmVjdCgpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHsgdXNlQ29udGV4dCwgdXNlU3RhdGUsIHVzZUVmZmVjdCB9O1xufTsiLCAiaW1wb3J0IHsgY29udmVydE5vZGVUb0VsZW1lbnRzLCBjcmVhdGVJZCwgRWxlbWVudCwgTm9kZSwgc3BlY2lhbE5vZGVUeXBlcyB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcbmltcG9ydCB7IENoYW5nZUVxdWFsaXR5VGVzdCwgQ2hhbmdlUmVwb3J0MiB9IGZyb20gXCIuL2FsZ29yaXRobXMudHNcIjtcbmltcG9ydCB7IENvbW1pdDIsIENvbW1pdElELCBDb21taXRSZWYyIH0gZnJvbSBcIi4vY29tbWl0LnRzXCI7XG5pbXBvcnQgeyBjcmVhdGVPYmplY3RQb29sLCBPYmplY3RQb29sIH0gZnJvbSBcIi4vcG9vbC50c1wiO1xuXG4vKipcbiAqIEEgcmVxdWVzdCB0byB0cmFuc2Zvcm0gcGFydCBvZiBhIHRyZWUgc3BlY2lmaWVkIGJ5XG4gKiB0aGUgXCJyZWZcIi4gQ29udGFpbnMgdGhlIGhpc3RvcnkgbmVlZGVkIHRvIHJlc29sdmUgdGhpc1xuICogcmVxdWVzdFxuICovXG5leHBvcnQgY2xhc3MgV29ya1Rhc2sge1xuICBzdGF0aWMgcG9vbCA9IGNyZWF0ZU9iamVjdFBvb2w8V29ya1Rhc2ssIFBhcmFtZXRlcnM8dHlwZW9mIHRoaXMubmV3Pj4oXG4gICAgKHJlZiwgcHJldiwgbmV4dCwgbW92ZWQpID0+IG5ldyBXb3JrVGFzayhyZWYsIHByZXYsICBuZXh0LCBtb3ZlZCksXG4gICAgKHRhc2ssIHJlZiwgcHJldiwgbmV4dCwgbW92ZWQgPSBmYWxzZSkgPT4ge1xuICAgICAgdGFzay5yZWYgPSByZWY7XG4gICAgICB0YXNrLnByZXYgPSBwcmV2O1xuICAgICAgdGFzay5uZXh0ID0gbmV4dDtcbiAgICAgIHRhc2subW92ZWQgPSBtb3ZlZDtcbiAgICB9XG4gIClcblxuICAvKipcbiAgICogVGhlIGNvbW1pdCB0aGF0IHNob3VsZCBldmFsdWF0ZSB0aGlzXG4gICAqIHVwZGF0ZSAoaWYgdGhpcyBjb21taXQgZG9lcyBub3QgZXhpc3QsXG4gICAqIGl0IHNob3VsZCB1c2UgdGhpcyBhcyBpdCdzIElEIGFuZCBQYXRoKS5cbiAgICogKi9cbiAgcmVmOiBDb21taXRSZWYyO1xuXG4gIC8qKiBJZiBudWxsLCB0aGlzIHVwZGF0ZSBzaG91bGQgY2F1c2VcbiAgICogdGhpcyBjb21taXQgdG8gYmUgY3JlYXRlZCAqL1xuICBwcmV2OiBudWxsIHwgQ29tbWl0MjtcbiAgLyoqIElmIG51bGwsIHRoaXMgdXBkYXRlIHNob3VsZCBjYXVzZVxuICAgKiB0aGlzIGNvbW1pdCB0byBiZSByZW1vdmVkXG4gICAqL1xuICBuZXh0OiBudWxsIHwgRWxlbWVudDtcblxuICAvLyBUT0RPOiBtYXliZSBleHBvc2UgcHJldi9uZXh0IGluZGV4IGluZm9ybWF0aW9uP1xuICBtb3ZlZDogYm9vbGVhbjtcblxuICBwcml2YXRlIGNvbnN0cnVjdG9yKHJlZjogQ29tbWl0UmVmMiwgcHJldjogbnVsbCB8IENvbW1pdDIsIG5leHQ6IG51bGwgfCBFbGVtZW50LCBtb3ZlZDogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgdGhpcy5yZWYgPSByZWY7XG4gICAgdGhpcy5wcmV2ID0gcHJldjtcbiAgICB0aGlzLm5leHQgPSBuZXh0O1xuICAgIHRoaXMubW92ZWQgPSBtb3ZlZDtcbiAgfVxuXG4gIGZyZWUoKSB7XG4gICAgV29ya1Rhc2sucG9vbC5yZWxlYXNlKHRoaXMpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgbmV3KHJlZjogQ29tbWl0UmVmMiwgcHJldjogbnVsbCB8IENvbW1pdDIsIG5leHQ6IG51bGwgfCBFbGVtZW50LCBtb3ZlZDogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgcmV0dXJuIHRoaXMucG9vbC5hY3F1aXJlKHJlZiwgcHJldiwgbmV4dCwgbW92ZWQpXG4gIH1cblxuICBzdGF0aWMgZnJlc2gocmVmOiBDb21taXRSZWYyLCBuZXh0OiBFbGVtZW50KSB7XG4gICAgcmV0dXJuIFdvcmtUYXNrLm5ldyhyZWYsIG51bGwsIG5leHQpXG4gIH1cbiAgc3RhdGljIGV4aXN0aW5nKHByZXY6IENvbW1pdDIsIG5leHQ6IEVsZW1lbnQpIHtcbiAgICByZXR1cm4gV29ya1Rhc2submV3KHByZXYucmVmLCBwcmV2LCBuZXh0KVxuICB9XG4gIHN0YXRpYyBtb3ZlKHByZXY6IENvbW1pdDIsIG5leHQ6IEVsZW1lbnQpIHtcbiAgICByZXR1cm4gV29ya1Rhc2submV3KHByZXYucmVmLCBwcmV2LCBuZXh0LCB0cnVlKVxuICB9XG4gIHN0YXRpYyByZW1vdmUocHJldjogQ29tbWl0Mikge1xuICAgIHJldHVybiBXb3JrVGFzay5uZXcocHJldi5yZWYsIHByZXYsIG51bGwpXG4gIH1cbiAgc3RhdGljIHZpc2l0KHByZXY6IENvbW1pdDIpIHtcbiAgICByZXR1cm4gV29ya1Rhc2submV3KHByZXYucmVmLCBwcmV2LCBwcmV2LmVsZW1lbnQpXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGtleWVkRWxlbWVudEVxdWFsaXR5VGVzdDI6ICBDaGFuZ2VFcXVhbGl0eVRlc3Q8Q29tbWl0MiwgRWxlbWVudD4gPSAocHJldiwgbmV4dCwgcHJldl9pbmRleCwgbmV4dF9pbmRleCkgPT4ge1xuICBjb25zdCBjb21wYXRpYmxlID0gcHJldi5lbGVtZW50LnR5cGUgPT09IG5leHQudHlwZSB8fCBwcmV2LmVsZW1lbnQudHlwZSA9PT0gc3BlY2lhbE5vZGVUeXBlcy5wbGFjZWhvbGRlcjtcbiAgaWYgKCFjb21wYXRpYmxlKVxuICAgIHJldHVybiBmYWxzZTtcbiAgY29uc3QgcHJldktleSA9IHByZXYuZWxlbWVudC5wcm9wcy5rZXk7XG4gIGNvbnN0IG5leHRLZXkgPSBuZXh0LnByb3BzLmtleTtcbiAgaWYgKHByZXZLZXkgfHwgbmV4dEtleSlcbiAgICByZXR1cm4gcHJldktleSA9PT0gbmV4dEtleTtcblxuICByZXR1cm4gcHJldl9pbmRleCA9PT0gbmV4dF9pbmRleDtcbn1cbiIsICJpbXBvcnQge1xuICBFbGVtZW50LCBOb2RlLFxuICBjb252ZXJ0Tm9kZVRvRWxlbWVudHMsXG4gIENvbXBvbmVudCxcbiAgaG9va0ltcGxlbWVudGF0aW9uLFxuICBGYWxsYmFjayxcbiAgaCxcbiAgU3VzcGVuZCxcbn0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuaW1wb3J0IHsgQ29tbWl0MiwgQ29tbWl0UmVmMiB9IGZyb20gXCIuL2NvbW1pdFwiO1xuaW1wb3J0IHsgbG9hZEhvb2tzMiB9IGZyb20gXCIuL2hvb2tzXCI7XG5pbXBvcnQgeyBCb3VuZGFyeVN0YXRlLCBDb21wb25lbnRTdGF0ZSwgQ29udGV4dFN0YXRlLCBFZmZlY3RUYXNrIH0gZnJvbSBcIi4vc3RhdGVcIjtcbmltcG9ydCB7IGtleWVkRWxlbWVudEVxdWFsaXR5VGVzdDIsIFdvcmtUYXNrIH0gZnJvbSBcIi4vdXBkYXRlXCI7XG5pbXBvcnQgeyBDaGFuZ2VSZXBvcnQyIH0gZnJvbSBcIi4vYWxnb3JpdGhtc1wiO1xuaW1wb3J0IHsgUmVjb25jaWxlcjIgfSBmcm9tIFwiLi9yZWNvbmNpbGVyXCI7XG5pbXBvcnQgeyBDb21taXRUcmVlMiB9IGZyb20gXCIuL3RyZWVcIjtcblxuLyoqXG4gKiBBIGRhdGEgc3RydWN0dXJlIHRoYXQgcmVwcmVzZW50cyB0aGUgaW1tZWRpYXRlIG91dHB1dFxuICogaW5zZXJ0aW5nIHNvbWV0aGluZyBpbnRvIHRoZSB0cmVlIHN1Y2ggYXM6XG4gKiAgLSBXaGF0IHRoZSBuZXcgY2hpbGRyZW4gd291bGQgYmVcbiAqICAtIEFkZGl0aW9uYWwgdGFza3MgdGhhdCBtaWdodCBuZWVkIHRvIGJlIGRvbmVcbiAqICAtIFNpZGUgZWZmZWN0cyBmcm9tIHJ1bm5pbmcgY29tcG9uZW50c1xuICogIC0gUmVqZWN0aW9uIHZhbHVlc1xuICogIC0gRXh0cmEgcmVuZGVyaW5nIHRhcmdldHMgdGhhdCBub3cgbmVlZCB0byBiZSBhY2NvdW50ZWQgZm9yXG4gKi9cbmV4cG9ydCBjbGFzcyBFbGVtZW50T3V0cHV0MiB7XG4gIGVsZW1lbnQ6IEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcmVmOiBDb21taXRSZWYyO1xuXG4gIGNoaWxkcmVuOiBFbGVtZW50W10gPSBbXTtcblxuICBwcmV2Q2hpbGRyZW46IENvbW1pdDJbXSB8IG51bGwgPSBudWxsO1xuXG4gIGNoaWxkUmVmczogQ29tbWl0UmVmMltdID0gW107XG4gIC8qKlxuICAgKiBQcm9jZXNzaW5nIGFuIGVsZW1lbnQgb2Ygc29tZSBraW5kIG9mdGVuXG4gICAqIGltcGxpZXMgY2hhbmdlcyB0byBpdCdzIGNoaWxkcmVuOiB0aGUgT3V0cHV0XG4gICAqIHdpbGwgcHJvZHVjZSBhZGRpdGlvbmFsIHRhc2tzIHRoYXQgYSB0aHJlYWQgc2hvdWxkIGVucXVldWUuXG4gICAqL1xuICB1cGRhdGVzOiBXb3JrVGFza1tdID0gW11cbiAgXG4gIGVmZmVjdHM6IG51bGwgfCBFZmZlY3RUYXNrW10gPSBudWxsO1xuICBjbGVhbnVwczogbnVsbCB8IEVmZmVjdFRhc2tbXSA9IG51bGw7XG5cbiAgZXh0cmFUYXJnZXRzOiBudWxsIHwgQ29tbWl0UmVmMltdID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihyZWY6IENvbW1pdFJlZjIpIHtcbiAgICB0aGlzLnJlZiA9IHJlZjtcbiAgfVxuXG4gIHByb2Nlc3NDb21wb25lbnQoY29tcG9uZW50OiBDb21wb25lbnQ8e30+LCBlbGVtZW50OiBFbGVtZW50LCB0cmVlOiBDb21taXRUcmVlMiwgc3RhdGU6IENvbXBvbmVudFN0YXRlKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICBzdGF0ZS5lZmZlY3RUYXNrcyA9IG51bGw7XG4gICAgXG4gICAgc3RhdGUuaG9va0luZGV4ID0gMDtcbiAgICBpZiAoIXN0YXRlLmhvb2tzKVxuICAgICAgc3RhdGUuaG9va3MgPSBsb2FkSG9va3MyKHRyZWUucmVjb25jaWxlciwgc3RhdGUsIHRoaXMucmVmKTtcblxuICAgIGhvb2tJbXBsZW1lbnRhdGlvbi51c2VDb250ZXh0ID0gc3RhdGUuaG9va3MudXNlQ29udGV4dDtcbiAgICBob29rSW1wbGVtZW50YXRpb24udXNlRWZmZWN0ID0gc3RhdGUuaG9va3MudXNlRWZmZWN0O1xuICAgIGhvb2tJbXBsZW1lbnRhdGlvbi51c2VTdGF0ZSA9IHN0YXRlLmhvb2tzLnVzZVN0YXRlO1xuXG4gICAgY29uc3QgcHJvcHMgPSB7XG4gICAgICAuLi50aGlzLmVsZW1lbnQucHJvcHMsXG4gICAgICBjaGlsZHJlbjogdGhpcy5lbGVtZW50LmNoaWxkcmVuLFxuICAgIH0gYXMgUGFyYW1ldGVyczx0eXBlb2YgY29tcG9uZW50PlswXTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgdGhpcy5zZXROb2RlKGNvbXBvbmVudChwcm9wcykpO1xuICAgICAgaWYgKHN0YXRlLnJlamVjdGlvbikge1xuICAgICAgICBzdGF0ZS5yZWplY3Rpb24gPSBudWxsO1xuXG4gICAgICAgIGlmIChzdGF0ZS5ib3VuZGFyeSlcbiAgICAgICAgICBzdGF0ZS5ib3VuZGFyeS5jbGVhclRocm93KHRoaXMucmVmKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZWZmZWN0cyA9IHN0YXRlLmVmZmVjdFRhc2tzO1xuICAgICAgdGhpcy5jYWxjdWxhdGVEaWZmKCk7XG4gICAgfSBjYXRjaCAodGhyb3duVmFsdWUpIHtcbiAgICBcbiAgICAgIGlmICghc3RhdGUuYm91bmRhcnkpIHtcbiAgICAgICAgY29uc3QgYm91bmRhcnkgPSB0cmVlLmZpbmRDbG9zZXN0Qm91bmRhcnkodGhpcy5yZWYpO1xuICAgICAgICBpZiAoIWJvdW5kYXJ5KVxuICAgICAgICAgIHRocm93IHRocm93blZhbHVlO1xuXG4gICAgICAgIHN0YXRlLmJvdW5kYXJ5ID0gYm91bmRhcnk7XG4gICAgICB9XG4gICAgICAvLyB1cGRhdGUgY29tcG9uZW50IHN0YXRlIHRvIGtub3cgd2UgcmVqZWN0ZWRcbiAgICAgIHN0YXRlLnJlamVjdGlvbiA9IHsgdmFsdWU6IHRocm93blZhbHVlIH07XG4gICAgICBzdGF0ZS5ib3VuZGFyeS5hZGRUaHJvdyh0aGlzLnJlZiwgdGhyb3duVmFsdWUpO1xuXG4gICAgICBpZiAodGhpcy5wcmV2Q2hpbGRyZW4pXG4gICAgICAgIHRoaXMuY2hpbGRSZWZzID0gdGhpcy5wcmV2Q2hpbGRyZW4ubWFwKGMgPT4gYy5yZWYpO1xuICAgIH1cbiAgfVxuXG4gIHByb2Nlc3NQcmltaXRpdmUoZWxlbWVudDogRWxlbWVudCkge1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5zZXROb2RlKHRoaXMuZWxlbWVudC5jaGlsZHJlbik7XG4gICAgdGhpcy5jYWxjdWxhdGVEaWZmKCk7XG4gIH1cblxuICBwcm9jZXNzUHJvdmlkZXIoZWxlbWVudDogRWxlbWVudCwgc3RhdGU6IENvbnRleHRTdGF0ZTx1bmtub3duPikge1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5zZXROb2RlKHRoaXMuZWxlbWVudC5jaGlsZHJlbik7XG5cbiAgICBpZiAoc3RhdGUudmFsdWUgIT09IGVsZW1lbnQucHJvcHMudmFsdWUpIHtcbiAgICAgIHN0YXRlLnZhbHVlID0gZWxlbWVudC5wcm9wcy52YWx1ZTtcbiAgICAgIHRoaXMuZXh0cmFUYXJnZXRzID0gWy4uLnN0YXRlLmNvbnN1bWVycy52YWx1ZXMoKV07XG4gICAgfVxuICAgIHRoaXMuY2FsY3VsYXRlRGlmZigpO1xuICB9XG4gIHByb2Nlc3NCb3VuZGFyeShlbGVtZW50OiBFbGVtZW50LCBzdGF0ZTogQm91bmRhcnlTdGF0ZSkge1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgY29uc3QgZmFsbGJhY2tFbGVtZW50ID0gISFlbGVtZW50LnByb3BzLmZhbGxiYWNrICYmIGgoRmFsbGJhY2ssIHt9LCBlbGVtZW50LnByb3BzLmZhbGxiYWNrIGFzIE5vZGUpXG5cbiAgICBpZiAoc3RhdGUubW9kZSA9PT0gJ25vcm1hbCcpIHtcbiAgICAgIHRoaXMuc2V0Tm9kZShbaChTdXNwZW5kLCB7IHN1c3BlbmRlZDogZmFsc2UgfSwgdGhpcy5lbGVtZW50LmNoaWxkcmVuKV0pO1xuICAgICAgdGhpcy5jYWxjdWxhdGVEaWZmKCk7XG4gICAgfSBlbHNlIGlmIChmYWxsYmFja0VsZW1lbnQpIHtcbiAgICAgIC8vIEhhbmRsZSBhIGJvdW5kYXJ5XG4gICAgICB0aGlzLnNldE5vZGUoW2goU3VzcGVuZCwgeyBzdXNwZW5kZWQ6IHRydWUgfSwgdGhpcy5lbGVtZW50LmNoaWxkcmVuKSwgZmFsbGJhY2tFbGVtZW50XSk7XG4gICAgICB0aGlzLmNhbGN1bGF0ZURpZmYoKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBjaGlsZEVsZW1lbnQgPSB0aGlzLmNoaWxkcmVuW2ldO1xuICAgICAgICBpZiAoY2hpbGRFbGVtZW50LmlkID09PSBmYWxsYmFja0VsZW1lbnQuaWQpIHtcbiAgICAgICAgICBjb25zdCBjaGlsZENvbW1pdCA9IHRoaXMuY2hpbGRSZWZzW2ldO1xuICAgICAgICAgIHN0YXRlLmZhbGxiYWNrUmVmID0gY2hpbGRDb21taXQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVEaWZmKCkge1xuICAgIGlmICh0aGlzLnByZXZDaGlsZHJlbiAmJiB0aGlzLmNoaWxkcmVuLmxlbmd0aCAhPT0gMCkge1xuICAgICAgY29uc3QgY2hhbmdlcyA9IENoYW5nZVJlcG9ydDIuZ2VuZXJhdGUodGhpcy5wcmV2Q2hpbGRyZW4sIHRoaXMuY2hpbGRyZW4sIGtleWVkRWxlbWVudEVxdWFsaXR5VGVzdDIpO1xuXG4gICAgICBmb3IgKGxldCBjaGlsZEluZGV4ID0gMDsgY2hpbGRJbmRleCA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBjaGlsZEluZGV4KyspIHtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gY2hhbmdlcy50cmFuc2Zvcm1bY2hpbGRJbmRleF07XG4gICAgICBcbiAgICAgICAgaWYgKHRyYW5zZm9ybSA9PT0gLTEpIHtcbiAgICAgICAgICBjb25zdCBuZXdSZWYgPSBDb21taXRSZWYyLmZyZXNoKHRoaXMucmVmKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZXMucHVzaChXb3JrVGFzay5mcmVzaChuZXdSZWYsIHRoaXMuY2hpbGRyZW5bY2hpbGRJbmRleF0pKTtcbiAgICAgICAgICB0aGlzLmNoaWxkUmVmcy5wdXNoKG5ld1JlZik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29uc3QgcHJldkNvbW1pdCA9IHRoaXMucHJldkNoaWxkcmVuW3RyYW5zZm9ybV1cbiAgICAgICAgICB0aGlzLmNoaWxkUmVmcy5wdXNoKHByZXZDb21taXQucmVmKTtcbiAgICAgICAgICBjb25zdCBtb3ZlZCA9IGNoaWxkSW5kZXggIT09IHRyYW5zZm9ybTtcbiAgICAgICAgICBpZiAobW92ZWQpXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZXMucHVzaChXb3JrVGFzay5tb3ZlKHByZXZDb21taXQsIHRoaXMuY2hpbGRyZW5bY2hpbGRJbmRleF0pKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZXMucHVzaChXb3JrVGFzay5leGlzdGluZyhwcmV2Q29tbWl0LCB0aGlzLmNoaWxkcmVuW2NoaWxkSW5kZXhdKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZvciAobGV0IHJlbW92ZWRJbmRleCA9IDA7IHJlbW92ZWRJbmRleCA8IGNoYW5nZXMucmVtb3ZlZC5sZW5ndGg7IHJlbW92ZWRJbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IHByZXZDb21taXQgPSB0aGlzLnByZXZDaGlsZHJlbltjaGFuZ2VzLnJlbW92ZWRbcmVtb3ZlZEluZGV4XV1cbiAgICAgICAgdGhpcy51cGRhdGVzLnB1c2goV29ya1Rhc2sucmVtb3ZlKHByZXZDb21taXQpKVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIXRoaXMucHJldkNoaWxkcmVuKSB7XG4gICAgICAvLyBJZiB0aGVyZSB3ZXJlIG5vIHByZXZpb3VzIGNoaWxkcmVuLCBhbHdheXMgZ2VuZXJhdGUgXCJDcmVhdGVcIiB0YXNrc1xuICAgICAgdGhpcy51cGRhdGVzID0gdGhpcy5jaGlsZHJlbi5tYXAoY2hpbGQgPT4gV29ya1Rhc2suZnJlc2goQ29tbWl0UmVmMi5mcmVzaCh0aGlzLnJlZiksIGNoaWxkKSk7XG4gICAgICB0aGlzLmNoaWxkUmVmcyA9IHRoaXMudXBkYXRlcy5tYXAoYyA9PiBjLnJlZik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRoZXJlIHdpbGwgYmUgbm8gY2hpbGRyZW4gaW4gdGhlIGZ1dHVyZSwgZ2VuZXJhdGUgXCJSZW1vdmVcIiB0YXNrc1xuICAgICAgdGhpcy51cGRhdGVzID0gdGhpcy5wcmV2Q2hpbGRyZW4ubWFwKGNoaWxkID0+IFdvcmtUYXNrLnJlbW92ZShjaGlsZCkpO1xuICAgICAgdGhpcy5jaGlsZFJlZnMgPSBbXTtcbiAgICB9XG4gIH1cblxuICBzZXROb2RlKG5vZGU6IE5vZGUpIHtcbiAgICB0aGlzLmNoaWxkcmVuID0gY29udmVydE5vZGVUb0VsZW1lbnRzKG5vZGUpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgY3JlYXRlSWQsIEVsZW1lbnQgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5pbXBvcnQgeyBDb21taXQyLCBDb21taXRJRCwgQ29tbWl0UmVmMiB9IGZyb20gXCIuL2NvbW1pdC50c1wiO1xuaW1wb3J0IHsgRGVsdGEgfSBmcm9tIFwiLi9kZWx0YS50c1wiO1xuaW1wb3J0IHsgQ29tbWl0VHJlZTIgfSBmcm9tIFwiLi90cmVlLnRzXCI7XG5pbXBvcnQgeyBXb3JrVGFzayB9IGZyb20gXCIuL3VwZGF0ZS50c1wiO1xuaW1wb3J0IHsgRWZmZWN0VGFzayB9IGZyb20gXCIuL3N0YXRlLnRzXCI7XG5cbmV4cG9ydCB0eXBlIFdvcmtSZWFzb24gPVxuICB8IHsgdHlwZTogJ21vdW50JywgZWxlbWVudDogRWxlbWVudCwgcmVmOiBDb21taXRSZWYyIH1cbiAgfCB7IHR5cGU6ICd1bm1vdW50JywgcmVmOiBDb21taXRSZWYyIH1cbiAgfCB7IHR5cGU6ICd0YXJnZXQnLCByZWY6IENvbW1pdFJlZjIgfVxuXG5leHBvcnQgdHlwZSBRdWV1ZVJlc3VsdCA9XG4gIHwgJ25ldy10YXNrJ1xuICB8ICdtaXNzZWQnXG4gIHwgJ2V4aXN0aW5nLXRhcmdldCdcbiAgfCAnZXhpc3RpbmctdGFzaydcblxuLyoqXG4gKiBBIHRlbXBvcmFyeSBkYXRhIHN0cnVjdHVyZSB0aGF0IGNhcnJpZXMgdGhlIHN0YXRlIG9mIGFcbiAqIHdvcmstaW4tcHJvZ3Jlc3MgdXBkYXRlIHRvIHRoZSB0cmVlLlxuICpcbiAqIEFuIHVwZGF0ZSB0byB0aGUgdHJlZSBpcyBkZXNpZ25lZCB0byBiZSBicm9rZW4gdXAgLSB0aGUgc2NoZWR1bGVyXG4gKiB3aWxsIGNvbnRpbnVhbGx5IGNhbGwgdGhlIFwid29ya1wiIGZ1bmN0aW9uIG1hbnkgdGltZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBXb3JrVGhyZWFkMiB7XG4gIHRyZWU6IENvbW1pdFRyZWUyO1xuXG4gIC8qKlxuICAgKiBFYWNoIHRpbWUgYW4gZXh0ZXJuYWwgc3lzdGVtIGFkZHMgYW4gdXBkYXRlIHRvIHRoZSBjdXJyZW50IHRocmVhZCxcbiAgICogdGhleSByZWNvcmQgdGhlIFwicmVhc29uXCIsIHNvIHlvdSBjYW4gdHJhY2Ugd2hpY2ggZWZmZWN0c1xuICAgKiBjYXVzZS9jb250cmlidXRlZCB0byB0aGlzIHRocmVhZC5cbiAgICovXG4gIHJlYXNvbnM6IFdvcmtSZWFzb25bXSA9IFtdO1xuICAvKipcbiAgICogQSBNYXAgb2YgZXZlcnkgY29tbWl0IHRoYXQgTkVFRFMgdG8gYmUgcmVuZGVyZWQgaWYgeW91IHZpc2l0IHRoZW0uXG4gICAqIFRoaXMgaXMgb2Z0ZW4gZm9yIGNvbW1pdHMgdGhhdCBleHBsaWNpdGx5IG5lZWQgYSByZS1yZW5kZXIgYmVjYXVzZVxuICAgKiB0aGV5IHVwZGF0ZWQgYW5kIGFyZSB0aGUgcmVhc29uIGZvciB0aGUgcmUtcmVuZGVyLlxuICAgKi9cbiAgbXVzdFJlbmRlcjogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcbiAgLyoqXG4gICAqIEEgU2V0IG9mIGV2ZXJ5IGNvbW1pdCB0aGF0IE5FRURTIHRvIGJlIHZpc2l0ZWQuIE5vcm1hbGx5LFxuICAgKiB3aGVuIGFuIHVwZGF0ZSBpcyByZXF1ZXN0ZWQgYWxsIHRoZSB0YXJnZXQncyBwYXJlbnRzIGFyZVxuICAgKiBsYWJlbGxlZCBcIm11c3RWaXNpdFwiIHNvIGFueSB1cGRhdGUgdGhyZWFkIHNob3VsZCBnZXQgdG9cbiAgICogdGhlIHRhcmdldCBldmVudHVhbGx5LlxuICAgKi9cbiAgbXVzdFZpc2l0OiBTZXQ8Q29tbWl0SUQ+ID0gbmV3IFNldCgpO1xuICBcbiAgLyoqXG4gICAqIEEgc3RhY2sgb2YgXCJVcGRhdGVcIiBvYmplY3RzIHJlcHJlc2VudGluZyBDb21taXRzIChvZnRlblxuICAgKiBjaGlsZHJlbiBvZiBjb21taXRzIGp1c3QgcHJvY2Vzc2VkKVxuICAgKi9cbiAgcGVuZGluZ1Rhc2tzOiBXb3JrVGFza1tdID0gW107XG5cbiAgLyoqIFxuICAgKiBXaGVuIGEgY2hhbmdlIGlzIHJlcXVlc3RlZCBvbiBhIHRocmVhZCwgYnV0IHRoZSB0YXJnZXRcbiAgICogY29tbWl0IGhhcyBhbHJlYWR5IGJlZW4gXCJ2aXNpdGVkXCIsIHdlIGluc3RlYWQgcHV0IGl0XG4gICAqIGluIG91dCBcIm1pc3NlZFwiIGJhY2tsb2cuXG4gICAqIFxuICAgKiBPbmNlIGEgdGhyZWFkIGhhcyBjb21wbGV0ZWQgYWxsIGl0J3MgdXBkYXRlcywgaXQgbWF5XG4gICAqIHN0YXJ0IGFuIGFkZGl0aW9uYWwgXCJwYXNzXCIsIHJlc2V0dGluZyBpdHNlbGYgKGJ1dCBub3QgaXQncyBcIkRlbHRhU2V0XCIpXG4gICAqIGFuZCBsb2FkaW5nIGluIGFsbCB0aGUgbWlzc2VkIHRhcmdldHMgYXMgbmV3IHVwZGF0ZXMuXG4gICovXG4gIG1pc3NlZDogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcblxuICB1bm1vdW50TWlzc2VkOiBTZXQ8Q29tbWl0SUQ+ID0gbmV3IFNldCgpO1xuXG5cbiAgZXJyb3JOb3RpZmljYXRpb25zOiBNYXA8Q29tbWl0SUQsIENvbW1pdFJlZjI+ID0gbmV3IE1hcCgpO1xuXG4gIC8qKlxuICAgKiBBIGxpc3Qgb2YgZWFjaCBjb21taXQgdGhlIHRocmVhZCBwcm9jZXNzZWRcbiAgICovXG4gIHZpc2l0ZWQ6IFNldDxDb21taXRJRD4gPSBuZXcgU2V0KCk7XG5cbiAgZGVsdGE6IERlbHRhID0gbmV3IERlbHRhKCk7XG5cbiAgaWQgPSBjcmVhdGVJZChcIlRocmVhZElEXCIpXG4gIHBhc3NlcyA9IDE7XG5cbiAgY29uc3RydWN0b3IodHJlZTogQ29tbWl0VHJlZTIpIHtcbiAgICB0aGlzLnRyZWUgPSB0cmVlO1xuICB9XG5cbiAgZ2V0IGRvbmUoKSB7XG4gICAgcmV0dXJuIHRoaXMucGVuZGluZ1Rhc2tzLmxlbmd0aCA9PT0gMCAmJiB0aGlzLm1pc3NlZC5zaXplID09PSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBzb21lIHdvcmsgdG8gYmUgZG9uZSBieSB0aGUgdGhyZWFkLlxuICAgKiBcbiAgICogQHBhcmFtIHJlYXNvbiBcbiAgICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgVGhyZWFkIGNhbiBhY2NlcHQgdGhlIHdvcmssIG9yIGZhbHNlIFxuICAgKiBpZiB0aGUgVGhyZWFkIGhhcyBhbHJlYWR5IHJlbmRlcmVkIHRoaXMgZWxlbWVudCAoeW91XG4gICAqIGhhdmUgdG8gcXVldWUgaXQgaW4gdGhlIG5leHQgdGhyZWFkKVxuICAgKi9cbiAgcXVldWUocmVhc29uOiBXb3JrUmVhc29uKTogUXVldWVSZXN1bHQge1xuICAgIC8vIFdlIGFyZSB2ZXJ5IGxhenkgaW4gdGhpcyBmdW5jdGlvbiAtICB3ZSBvbmx5XG4gICAgLy8gd2FudCB0byBjcmVhdGUgYSBuZXcgdXBkYXRlIGF0IHRoZSB3b3JzdCBwb3NzaWJsZVxuICAgIC8vIGNhc2VcbiAgICB0aGlzLnJlYXNvbnMucHVzaChyZWFzb24pO1xuXG4gICAgLy8gTW91bnRzIGFyZSByZWFsbHkgZWFzeSAtIHRoZXkgbmV2ZXIgaGF2ZSBhbnkgaGlzdG9yeSwgc29cbiAgICAvLyB3ZSBkb24ndCBuZWVkIHRvIGNoZWNrIGZvciBjb25mbGljdHMuXG4gICAgaWYgKHJlYXNvbi50eXBlID09PSAnbW91bnQnKSB7XG4gICAgICB0aGlzLnBlbmRpbmdUYXNrcy5wdXNoKFdvcmtUYXNrLmZyZXNoKHJlYXNvbi5yZWYsIHJlYXNvbi5lbGVtZW50KSk7XG4gICAgICByZXR1cm4gJ25ldy10YXNrJztcbiAgICB9XG4gICAgaWYgKHRoaXMudmlzaXRlZC5oYXMocmVhc29uLnJlZi5pZCkpIHtcbiAgICAgIGlmIChyZWFzb24udHlwZSA9PT0gJ3VubW91bnQnKSB7XG4gICAgICAgIHRoaXMudW5tb3VudE1pc3NlZC5hZGQocmVhc29uLnJlZi5pZCk7XG4gICAgICAgIHJldHVybiAnbWlzc2VkJ1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRoaXMubWlzc2VkLmFkZChyZWFzb24ucmVmLmlkKTtcbiAgICAgICAgcmV0dXJuICdtaXNzZWQnO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHRoZSByZWFzb24gaXMgYWxyZWFkeSBpbiB0aGUgXCJtdXN0UmVuZGVyXCIsXG4gICAgLy8gd2UgYWxyZWFkeSBpbnRlbmQgdG8gcmVuZGVyIGl0LCBzbyBkbyBub3RoaW5nXG4gICAgaWYgKHRoaXMubXVzdFJlbmRlci5oYXMocmVhc29uLnJlZi5pZCkpXG4gICAgICByZXR1cm4gJ2V4aXN0aW5nLXRhcmdldCc7XG4gICAgdGhpcy5tdXN0UmVuZGVyLmFkZChyZWFzb24ucmVmLmlkKTtcblxuICAgIC8vIFNlYXJjaCB0aHJvdWdoIGFsbCB0aGUgcGFyZW50cywgbG9va2luZyB0byBzZWUgaWZcbiAgICAvLyB0aGVyZSBhcmUgYW55IHBlbmRpbmdUYXNrcyB0aGF0IG1pZ2h0XG4gICAgLy8gbGVhZCB0byB0aGlzIGNvbW1pdC4gSWYgc28sIG1ha2Ugc3VyZSBhbmNlc3RvciBjb21taXRcbiAgICAvLyBpcyBvbiB0aGUgTXVzdFZpc2l0IHNvIHRoZXkgc2hvdWxkIG1ha2UgdGhlaXIgd2F5IGRvd25cbiAgICAvLyBldmVudHVhbGx5XG4gICAgbGV0IGFuY2VzdG9yOiBDb21taXRSZWYyIHwgbnVsbCA9IHJlYXNvbi5yZWY7XG4gICAgd2hpbGUgKGFuY2VzdG9yKSB7XG4gICAgICB0aGlzLm11c3RWaXNpdC5hZGQoYW5jZXN0b3IuaWQpO1xuXG4gICAgICAvLyBJZiB3ZSBmaW5kIHRoZXJlIGlzIGFuIFVwZGF0ZSBhbHJlYWR5XG4gICAgICAvLyBleGlzdGluZyB0byBoYW5kbGUgb3VyIGNvbW1pdCwgZXhpdCBlYXJseVxuICAgICAgZm9yIChjb25zdCB1cGRhdGUgb2YgdGhpcy5wZW5kaW5nVGFza3MpIHtcbiAgICAgICAgaWYgKHVwZGF0ZS5yZWYuaWQgPT09IGFuY2VzdG9yLmlkKSB7XG4gICAgICAgICAgcmV0dXJuICdleGlzdGluZy10YXNrJztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYW5jZXN0b3IgPSBhbmNlc3Rvci5wYXJlbnQ7XG4gICAgfVxuXG4gICAgLy8gVGhlcmUgYXJlIG5vIHVwZGF0ZXMgKHF1ZXVlZCBwaWVjZXMgb2Ygd29yaylcbiAgICAvLyBXZSBuZWVkIGF0IGxlYXN0IG9uZSB0byBraWNrIG9mZiB0aGUgcmVuZGVyaW5nIHByb2Nlc3NcblxuICAgIC8vIFdlJ3JlIGdvaW5nIHRvIGp1c3Qgc2tpcCBhbGwgdGhlIHBhcmVudHMgdXAgdW50aWwgdGhlXG4gICAgLy8gc3BlY2lmaWMgY29tbWl0IHdlIHdhbnQgdG8gcmVuZGVyXG4gICAgYW5jZXN0b3IgPSByZWFzb24ucmVmO1xuICAgIHdoaWxlIChhbmNlc3Rvcikge1xuICAgICAgaWYgKGFuY2VzdG9yLmlkICE9PSByZWFzb24ucmVmLmlkKVxuICAgICAgICB0aGlzLnZpc2l0ZWQuYWRkKGFuY2VzdG9yLmlkKTtcbiAgICAgIFxuICAgICAgYW5jZXN0b3IgPSBhbmNlc3Rvci5wYXJlbnQ7XG4gICAgfVxuXG4gICAgY29uc3QgcHJldiA9IHRoaXMudHJlZS5jb21taXRzLmdldChyZWFzb24ucmVmLmlkKSBhcyBDb21taXQyO1xuICAgIHN3aXRjaCAocmVhc29uLnR5cGUpIHtcbiAgICAgIGNhc2UgJ3RhcmdldCc6XG4gICAgICAgIHRoaXMucGVuZGluZ1Rhc2tzLnB1c2goV29ya1Rhc2sudmlzaXQocHJldikpXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndW5tb3VudCc6XG4gICAgICAgIHRoaXMucGVuZGluZ1Rhc2tzLnB1c2goV29ya1Rhc2sucmVtb3ZlKHByZXYpKVxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuICduZXctdGFzayc7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybSB0aGUgd29yayB0byBhZGQgYSBmcmVzaCBjb21taXQgaW50byB0aGUgdHJlZSxcbiAgICogZW5xdWV1aW5nIGFkZGl0aW9uYWwgd29yayBvbnRvIHRoZSB0aHJlYWQgaWYgdGhlIGNvbW1pdCBoYXMgY2hpbGRyZW4uXG4gICAqIFxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0aGF0IHRoZSBjb21taXQgd2lsbCBoYXZlLlxuICAgKiBAcGFyYW0gcmVmIFRoZSBsb2NhdGlvbiB3aGVyZSB0aGUgY29tbWl0IHdpbGwgYmUgaW5zdGFsbGVkLlxuICAgKi9cbiAgY3JlYXRlQ29tbWl0KGVsZW1lbnQ6IEVsZW1lbnQsIHJlZjogQ29tbWl0UmVmMikge1xuICAgIGNvbnN0IG91dHB1dCA9IHRoaXMudHJlZS5wcm9jZXNzRWxlbWVudChlbGVtZW50LCByZWYsIG51bGwpO1xuICAgICAgICBcbiAgICBjb25zdCBjb21taXQgPSB0aGlzLnRyZWUucmVjb25jaWxlci5wb29scy5jb21taXQuYWNxdWlyZShyZWYsIGVsZW1lbnQsIG91dHB1dC5jaGlsZFJlZnMpO1xuXG4gICAgdGhpcy50cmVlLmNvbW1pdHMuc2V0KGNvbW1pdC5yZWYuaWQsIGNvbW1pdCk7XG4gICAgdGhpcy5kZWx0YS5hZGQoY29tbWl0KTtcbiAgICBpZiAoY29tbWl0LnJlZi5sZW5ndGggPT09IDEpXG4gICAgICB0aGlzLnRyZWUucm9vdHMuYWRkKGNvbW1pdC5yZWYuaWQpO1xuXG4gICAgaWYgKG91dHB1dC5lZmZlY3RzKVxuICAgICAgdGhpcy5kZWx0YS5hZGRFZmZlY3RzKG91dHB1dC5lZmZlY3RzKTtcblxuICAgIHRoaXMucGVuZGluZ1Rhc2tzLnB1c2goLi4ub3V0cHV0LnVwZGF0ZXMpO1xuICB9XG4gIHVwZGF0ZUNvbW1pdChjb21taXQ6IENvbW1pdDIsIGVsZW1lbnQ6IEVsZW1lbnQsIG1vdmVkOiBib29sZWFuKSB7XG4gICAgY29uc3Qgb3V0cHV0ID0gdGhpcy50cmVlLnByb2Nlc3NFbGVtZW50KGVsZW1lbnQsIGNvbW1pdC5yZWYsIGNvbW1pdCk7XG5cbiAgICBjb25zdCBvbGRFbGVtZW50ID0gY29tbWl0LmVsZW1lbnQ7XG4gICAgY29tbWl0LnVwZGF0ZShlbGVtZW50LCBvdXRwdXQuY2hpbGRSZWZzKTtcbiAgICB0aGlzLmRlbHRhLnVwZGF0ZShvbGRFbGVtZW50LCBjb21taXQsIG1vdmVkKTtcblxuICAgIHRoaXMucGVuZGluZ1Rhc2tzLnB1c2goLi4ub3V0cHV0LnVwZGF0ZXMpO1xuICAgIGlmIChvdXRwdXQuZWZmZWN0cylcbiAgICAgIHRoaXMuZGVsdGEuYWRkRWZmZWN0cyhvdXRwdXQuZWZmZWN0cyk7XG4gIH1cbiAgcmVtb3ZlQ29tbWl0KGNvbW1pdDogQ29tbWl0Mikge1xuICAgIGNvbnN0IG91dHB1dCA9IHRoaXMudHJlZS51bm1vdW50Q29tbWl0KGNvbW1pdCk7XG5cbiAgICB0aGlzLnRyZWUuY29tbWl0cy5kZWxldGUoY29tbWl0LnJlZi5pZCk7XG4gICAgdGhpcy5kZWx0YS5kZWxldGUoY29tbWl0KTtcbiAgICBpZiAoY29tbWl0LnJlZi5sZW5ndGggPT09IDEpXG4gICAgICB0aGlzLnRyZWUucm9vdHMuZGVsZXRlKGNvbW1pdC5yZWYuaWQpO1xuXG4gICAgdGhpcy5wZW5kaW5nVGFza3MucHVzaCguLi5vdXRwdXQudXBkYXRlcyk7XG4gICAgaWYgKG91dHB1dC5jbGVhbnVwcylcbiAgICAgIHRoaXMuZGVsdGEuYWRkRWZmZWN0cyhvdXRwdXQuY2xlYW51cHMpO1xuICB9XG4gIHNraXBDb21taXQoY29tbWl0OiBDb21taXQyKSB7XG4gICAgY29uc3QgcHJldkNoaWxkcmVuID0gY29tbWl0LmNoaWxkcmVuXG4gICAgICAubWFwKGMgPT4gdGhpcy50cmVlLmNvbW1pdHMuZ2V0KGMuaWQpIGFzIENvbW1pdDIpO1xuXG4gICAgY29uc3QgdXBkYXRlcyA9IHByZXZDaGlsZHJlbi5tYXAocHJldiA9PiBXb3JrVGFzay52aXNpdChwcmV2KSk7ICBcbiAgICB0aGlzLnBlbmRpbmdUYXNrcy5wdXNoKC4uLnVwZGF0ZXMpO1xuXG4gICAgY29tbWl0LnVwZGF0ZSgpO1xuICB9XG5cbiAgdmlzaXQodXBkYXRlOiBXb3JrVGFzaykge1xuICAgIHRoaXMudmlzaXRlZC5hZGQodXBkYXRlLnJlZi5pZCk7XG4gICAgXG4gICAgaWYgKHVwZGF0ZS5uZXh0ICYmICF1cGRhdGUucHJldikge1xuICAgICAgdGhpcy5jcmVhdGVDb21taXQodXBkYXRlLm5leHQsIHVwZGF0ZS5yZWYpO1xuICAgIH1cbiAgICBlbHNlIGlmICh1cGRhdGUubmV4dCAmJiB1cGRhdGUucHJldikge1xuICAgICAgdGhpcy51cGRhdGVDb21taXQodXBkYXRlLnByZXYsIHVwZGF0ZS5uZXh0LCB1cGRhdGUubW92ZWQpO1xuICAgIH1cbiAgICBlbHNlIGlmICghdXBkYXRlLm5leHQgJiYgdXBkYXRlLnByZXYpIHtcbiAgICAgIHRoaXMucmVtb3ZlQ29tbWl0KHVwZGF0ZS5wcmV2KTtcbiAgICB9XG4gIH1cblxuICBwcm9jZXNzVGFzayh0YXNrOiBXb3JrVGFzaykge1xuICAgIGNvbnN0IHsgbmV4dCwgcHJldiwgcmVmIH0gPSB0YXNrO1xuXG4gICAgY29uc3QgaWRlbnRpY2FsQ2hhbmdlID0gbmV4dCAmJiBwcmV2ICYmIChuZXh0LmlkID09PSBwcmV2LmVsZW1lbnQuaWQpO1xuXG4gICAgaWYgKGlkZW50aWNhbENoYW5nZSkge1xuICAgICAgY29uc3QgbXVzdFZpc2l0ID0gdGhpcy5tdXN0VmlzaXQuaGFzKHJlZi5pZCk7XG4gICAgICBpZiAoIW11c3RWaXNpdClcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICBjb25zdCBtdXN0UmVuZGVyID0gdGhpcy5tdXN0UmVuZGVyLmhhcyhyZWYuaWQpO1xuXG4gICAgICBpZiAoIW11c3RSZW5kZXIpIHtcbiAgICAgICAgdGhpcy5za2lwQ29tbWl0KHByZXYpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICB0aGlzLnZpc2l0KHRhc2spO1xuICB9XG5cbiAgd29yaygpIHtcbiAgICBjb25zdCB0YXNrID0gdGhpcy5wZW5kaW5nVGFza3MucG9wKCk7XG4gICAgaWYgKHRhc2spIHtcbiAgICAgIHRoaXMucHJvY2Vzc1Rhc2sodGFzayk7XG4gICAgICB0YXNrLmZyZWUoKTtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLmRvbmUpIHtcbiAgICAgIHRoaXMuc3RhcnROZXh0UGFzcygpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXJ0TmV4dFBhc3MoKSB7XG4gICAgdGhpcy5wZW5kaW5nVGFza3MgPSBbXTtcbiAgICB0aGlzLm11c3RSZW5kZXIuY2xlYXIoKTtcbiAgICB0aGlzLm11c3RWaXNpdC5jbGVhcigpO1xuICAgIHRoaXMudmlzaXRlZC5jbGVhcigpO1xuXG4gICAgdGhpcy5wYXNzZXMrKztcblxuICAgIGNvbnN0IG1pc3NlZENvbW1pdCA9IFsuLi50aGlzLm1pc3NlZF1cbiAgICAgIC5tYXAoaWQgPT4gdGhpcy50cmVlLmNvbW1pdHMuZ2V0KGlkKSlcbiAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXG4gICAgICAuc29ydCgoYSwgYikgPT4gYS5yZWYubGVuZ3RoIC0gYi5yZWYubGVuZ3RoKTtcblxuICAgIGNvbnN0IHVubW91bnRpbmdSZWZzID0gbmV3IE1hcChbLi4udGhpcy51bm1vdW50TWlzc2VkXVxuICAgICAgLm1hcChpZCA9PiB0aGlzLnRyZWUuY29tbWl0cy5nZXQoaWQpKVxuICAgICAgLmZpbHRlcih4ID0+ICEheClcbiAgICAgIC5tYXAoYyA9PiBbYy5yZWYuaWQsIGMucmVmXSlcbiAgICApIFxuXG4gICAgZm9yIChjb25zdCBjb21taXRSZWYgb2YgdW5tb3VudGluZ1JlZnMudmFsdWVzKCkpIHtcbiAgICAgIHRoaXMucXVldWUoeyB0eXBlOiAndW5tb3VudCcsIHJlZjogY29tbWl0UmVmIH0pO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgY29tbWl0IG9mIG1pc3NlZENvbW1pdCkge1xuICAgICAgaWYgKGNvbW1pdC5yZWYuZmluZChyZWYgPT4gdW5tb3VudGluZ1JlZnMuaGFzKHJlZi5pZCkpKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgdGhpcy5xdWV1ZSh7IHR5cGU6ICd0YXJnZXQnLCByZWY6IGNvbW1pdC5yZWYgfSk7XG4gICAgfVxuICAgIHRoaXMubWlzc2VkLmNsZWFyKCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBDb21taXRJRCwgQ29tbWl0UmVmMiB9IGZyb20gXCIuL2NvbW1pdC50c1wiO1xuaW1wb3J0IHsgT3BhcXVlSUQsIERlcHMsIEVmZmVjdENsZWFudXAsIENvbnRleHRJRCwgSG9va0ltcGxlbWVudGF0aW9uLCBjcmVhdGVJZCwgQm91bmRhcnlQcm9wcyB9IGZyb20gJ0BsdWtla2FhbGltL2FjdCc7XG5pbXBvcnQgeyBDb21taXRUcmVlMiB9IGZyb20gXCIuL3RyZWUudHNcIjtcblxuXG5leHBvcnQgdHlwZSBFZmZlY3RJRCA9IE9wYXF1ZUlEPFwiRWZmZWN0SURcIj47XG5leHBvcnQgdHlwZSBFZmZlY3RUYXNrID0ge1xuICByZWY6IENvbW1pdFJlZjIsXG4gIGlkOiBFZmZlY3RJRCxcbiAgZnVuYzogKCkgPT4gdm9pZCxcbn1cblxuZXhwb3J0IHR5cGUgQ29tcG9uZW50U3RhdGUgPSB7XG4gIHJlZjogQ29tbWl0UmVmMjtcblxuICB1bm1vdW50ZWQ6IGJvb2xlYW4sXG5cbiAgaG9va0luZGV4OiBudW1iZXIsXG4gIGhvb2tzOiBudWxsIHwgSG9va0ltcGxlbWVudGF0aW9uLFxuICBlZmZlY3RUYXNrczogbnVsbCB8IEVmZmVjdFRhc2tbXSxcblxuICB2YWx1ZXM6ICAgTWFwPG51bWJlciwgdW5rbm93bj47XG4gIGRlcHM6ICAgICBNYXA8bnVtYmVyLCBEZXBzPjtcbiAgZWZmZWN0czogIE1hcDxudW1iZXIsIEVmZmVjdElEPjtcbiAgY2xlYW51cHM6ICBNYXA8bnVtYmVyLCBFZmZlY3RDbGVhbnVwPjtcblxuICByZWplY3Rpb246IG51bGwgfCB7IHZhbHVlOiB1bmtub3duIH07XG4gIGJvdW5kYXJ5OiBudWxsIHwgQm91bmRhcnlTdGF0ZTtcblxuICBwcm92aWRlcnM6ICBNYXA8bnVtYmVyLCBudWxsIHwgQ29udGV4dFN0YXRlPHVua25vd24+Pjtcbn07XG5cbmV4cG9ydCB0eXBlIENvbnRleHRTdGF0ZTxUPiA9IHtcbiAgaWQ6IENvbW1pdElELFxuICBjb250ZXh0SWQ6IENvbnRleHRJRCxcbiAgY29uc3VtZXJzOiBNYXA8Q29tbWl0SUQsIENvbW1pdFJlZjI+LFxuICB2YWx1ZTogVCxcbn1cblxuZXhwb3J0IHR5cGUgQm91bmRhcnlJRCA9IE9wYXF1ZUlEPFwiQm91bmRhcnlJRFwiPjtcblxuZXhwb3J0IGNsYXNzIEJvdW5kYXJ5U3RhdGUge1xuICB0cmVlOiBDb21taXRUcmVlMjtcblxuICBpZDogQm91bmRhcnlJRDtcbiAgcmVmOiBDb21taXRSZWYyO1xuXG4gIC8qKlxuICAgKiBXaGVuIHRoZSBib3VuZGFyeSBpcyBpbiBcImZhbGxiYWNrXCJcbiAgICogbW9kZSwgdGhpcyBzaG91bGQgcmVmZXJlbmNlIHRoZSBpbW1lZGlhdGVcbiAgICogZmFsbGJhY2sgbm9kZSB0aGF0IHdhcyBnZW5lcmF0ZWQuXG4gICAqL1xuICBmYWxsYmFja1JlZjogbnVsbCB8IENvbW1pdFJlZjIgPSBudWxsO1xuXG4gIHZhbHVlczogTWFwPENvbW1pdElELCB1bmtub3duPiA9IG5ldyBNYXAoKTtcblxuICBnZXQgbW9kZSgpOiAnbm9ybWFsJyB8ICdmYWxsYmFjaycge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcy5zaXplID09PSAwXG4gICAgICA/ICdub3JtYWwnXG4gICAgICA6ICdmYWxsYmFjaydcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHRyZWU6IENvbW1pdFRyZWUyLCByZWY6IENvbW1pdFJlZjIpIHtcbiAgICB0aGlzLnRyZWUgPSB0cmVlO1xuICAgIHRoaXMucmVmID0gcmVmO1xuICAgIHRoaXMuaWQgPSBjcmVhdGVJZChcIkJvdW5kYXJ5SURcIik7XG4gIH1cblxuICBhZGRUaHJvdyhyZWY6IENvbW1pdFJlZjIsIHRocm93blZhbHVlOiB1bmtub3duKSB7XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gJ25vcm1hbCcpXG4gICAgICB0aGlzLnRyZWUucmVjb25jaWxlci5yZW5kZXIodGhpcy5yZWYpO1xuICAgIFxuICAgIHRoaXMudmFsdWVzLnNldChyZWYuaWQsIHRocm93blZhbHVlKTtcblxuICAgIGNvbnN0IGNvbW1pdCA9IHRoaXMudHJlZS5jb21taXRzLmdldCh0aGlzLnJlZi5pZCk7XG4gICAgaWYgKGNvbW1pdCkge1xuICAgICAgY29uc3Qgb25UaHJvdyA9IChjb21taXQuZWxlbWVudC5wcm9wcyBhcyBCb3VuZGFyeVByb3BzKS5vblRocm93O1xuICAgICAgaWYgKG9uVGhyb3cpXG4gICAgICAgIG9uVGhyb3codGhyb3duVmFsdWUsIFsuLi50aGlzLnZhbHVlcy52YWx1ZXMoKV0pO1xuICAgIH1cbiAgfVxuICBcbiAgY2xlYXJUaHJvdyhyZWY6IENvbW1pdFJlZjIpIHtcbiAgICB0aGlzLnZhbHVlcy5kZWxldGUocmVmLmlkKTtcblxuICAgIGlmICh0aGlzLm1vZGUgPT09ICdub3JtYWwnKVxuICAgICAgdGhpcy50cmVlLnJlY29uY2lsZXIucmVuZGVyKHRoaXMucmVmKTtcblxuICAgIGNvbnN0IGNvbW1pdCA9IHRoaXMudHJlZS5jb21taXRzLmdldCh0aGlzLnJlZi5pZCk7XG4gICAgaWYgKGNvbW1pdCkge1xuICAgICAgY29uc3Qgb25DbGVhciA9IChjb21taXQuZWxlbWVudC5wcm9wcyBhcyBCb3VuZGFyeVByb3BzKS5vbkNsZWFyO1xuICAgICAgaWYgKG9uQ2xlYXIpXG4gICAgICAgIG9uQ2xlYXIoKTtcbiAgICB9XG4gIH1cbn0iLCAiaW1wb3J0IHsgQ29udGV4dElELCBFbGVtZW50LCBzcGVjaWFsTm9kZVR5cGVzIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuaW1wb3J0IHsgQ29tbWl0MiwgQ29tbWl0SUQsIENvbW1pdFJlZjIgfSBmcm9tIFwiLi9jb21taXQudHNcIjtcbmltcG9ydCB7IEVsZW1lbnRPdXRwdXQyIH0gZnJvbSBcIi4vZWxlbWVudC50c1wiO1xuaW1wb3J0IHsgQm91bmRhcnlTdGF0ZSwgQ29tcG9uZW50U3RhdGUsIENvbnRleHRTdGF0ZSwgRWZmZWN0SUQgfSBmcm9tIFwiLi9zdGF0ZS50c1wiO1xuaW1wb3J0IHsgUmVjb25jaWxlcjIgfSBmcm9tIFwiLi9yZWNvbmNpbGVyLnRzXCI7XG5pbXBvcnQgeyBsYXN0IH0gZnJvbSBcIi4vYWxnb3JpdGhtcy50c1wiO1xuXG4vKipcbiAqIFRoZSBDb21taXRUcmVlIGlzIHJlc3BvbnNpYmxlIGZvciBrZWVwaW5nIHRyYWNrXG4gKiBvZiBhY3QncyBcImNhbm9uXCIgdW5kZXJzdGFuZGluZyBvZiB0aGUgYXBwbGljYXRpb24gdHJlZSxcbiAqIGluY2x1ZGluZyByZWZlcmVuY2VzIHRvIGFsbCBsaXZlIGNvbW1pdHMsIGFsbCBjb21wb25lbnRcbiAqIHN0YXRlLCBhbGwgY29udGV4dCBzdGF0ZSBhbmQgc3VjaC5cbiAqIFxuICogVGhlIGtleSBtZXRob2RzIGhlcmUgYXJlIFwicHJvY2Vzc0VsZW1lbnRcIiwgd2hpY2hcbiAqIGlzIHRoZSBnYXRld2F5IGludG8gZ2V0dGluZyBhbiBlbGVtZW50IGludG8gdGhlIHRyZWUsXG4gKiBhbmQgXCJ1bm1vdW50Q29tbWl0XCIsIHdoaWNoIGNsZWFycyBhbGwgdGhlIHJlZmVyZW5jZXNcbiAqIGZyb20gYSBwYXJ0aWN1bGFyIGNvbW1pdC5cbiAqIFxuICogV2hpbGUgY2hhbmdlcyBkb25lIGhlcmUgYXJlIGltbWVkaWF0ZSAoeW91IGFsd2F5cyBnZXRcbiAqIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSB0cmVlKSwgdGhlIHJlbmRlcmVyIHdvbid0IHNlZSBhbnlcbiAqIGludGVybWVkaWF0ZSBzdGF0ZXMgLSB0aGUgcmV0dXJuIHZhbHVlcyBvZiBcInByb2Nlc3NcIiBhbmQgXCJ1bm1vdW50XCJcbiAqIGlzIGxhdGVyIGFkZGVkIHRvIHRoZSBXb3JrVGhyZWFkJ3MgXCJEZWx0YVwiLCB3aGljaCBpcyB0aGVcbiAqIGFjdHVhbCB2YWx1ZSBwYXNzZXMgdG8gcmVuZGVyZXJzLlxuICogXG4gKiBEb24ndCBmb3JnZXQgLSBjb21taXRzIGFyZSBtdXRhYmxlISBPbmNlIHlvdSBnZXQgYSByZWZlcmVuY2VcbiAqIHRvIGEgY29tbWl0LCB5b3UgYWx3YXlzIGhhdmUgdGhlIGxhdGVzdCBjb3B5IG9mIGl0LlxuICovXG5leHBvcnQgY2xhc3MgQ29tbWl0VHJlZTIge1xuICByZWNvbmNpbGVyOiBSZWNvbmNpbGVyMjtcblxuICBjb21wb25lbnRzOiBNYXA8Q29tbWl0SUQsIENvbXBvbmVudFN0YXRlPiA9IG5ldyBNYXAoKTtcbiAgY29udGV4dHM6IE1hcDxDb21taXRJRCwgQ29udGV4dFN0YXRlPHVua25vd24+PiA9IG5ldyBNYXAoKTtcbiAgYm91bmRhcmllczogTWFwPENvbW1pdElELCBCb3VuZGFyeVN0YXRlPiA9IG5ldyBNYXAoKTtcblxuICBjb21taXRzOiBNYXA8Q29tbWl0SUQsIENvbW1pdDI+ID0gbmV3IE1hcCgpO1xuICByb290czogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcblxuICBjb25zdHJ1Y3RvcihyZWNvbmNpbGVyOiBSZWNvbmNpbGVyMikge1xuICAgIHRoaXMucmVjb25jaWxlciA9IHJlY29uY2lsZXI7XG4gIH1cblxuICBnZXRPckNyZWF0ZUNvbXBvbmVudFN0YXRlKHJlZjogQ29tbWl0UmVmMikge1xuICAgIGxldCBzdGF0ZSA9IHRoaXMuY29tcG9uZW50cy5nZXQocmVmLmlkKTtcbiAgICBpZiAoIXN0YXRlKSB7XG4gICAgICBzdGF0ZSA9IHtcbiAgICAgICAgdW5tb3VudGVkOiBmYWxzZSxcbiAgICAgICAgcmVmLFxuICAgICAgICBob29rSW5kZXg6IDAsXG4gICAgICAgIHJlamVjdGlvbjogbnVsbCxcbiAgICAgICAgYm91bmRhcnk6IG51bGwsXG4gICAgICAgIGhvb2tzOiBudWxsLFxuICAgICAgICBlZmZlY3RUYXNrczogW10sXG4gICAgICAgIGNsZWFudXBzOiBuZXcgTWFwKCksXG4gICAgICAgIHByb3ZpZGVyczogbmV3IE1hcCgpLFxuICAgICAgICB2YWx1ZXM6IG5ldyBNYXAoKSxcbiAgICAgICAgZGVwczogbmV3IE1hcCgpLFxuICAgICAgICBlZmZlY3RzOiBuZXcgTWFwKCksXG4gICAgICB9XG4gICAgICB0aGlzLmNvbXBvbmVudHMuc2V0KHJlZi5pZCwgc3RhdGUpO1xuICAgIH1cbiAgICByZXR1cm4gc3RhdGU7XG4gIH1cblxuICBnZXRPckNyZWF0ZVByb3ZpZGVyU3RhdGUocmVmOiBDb21taXRSZWYyLCBlbGVtZW50OiBFbGVtZW50KSB7XG4gICAgbGV0IHN0YXRlID0gdGhpcy5jb250ZXh0cy5nZXQocmVmLmlkKTtcbiAgICBpZiAoIXN0YXRlKSB7XG4gICAgICBzdGF0ZSA9IHtcbiAgICAgICAgaWQ6IHJlZi5pZCxcbiAgICAgICAgY29udGV4dElkOiBlbGVtZW50LnByb3BzLmlkIGFzIENvbnRleHRJRCxcbiAgICAgICAgdmFsdWU6IGVsZW1lbnQucHJvcHMudmFsdWUsXG4gICAgICAgIGNvbnN1bWVyczogbmV3IE1hcCgpLFxuICAgICAgfVxuICAgICAgdGhpcy5jb250ZXh0cy5zZXQocmVmLmlkLCBzdGF0ZSk7XG4gICAgfVxuICAgIHJldHVybiBzdGF0ZTtcbiAgfVxuICBnZXRPckNyZWF0ZUJvdW5kYXJ5U3RhdGUocmVmOiBDb21taXRSZWYyKSB7XG4gICAgbGV0IHN0YXRlID0gdGhpcy5ib3VuZGFyaWVzLmdldChyZWYuaWQpO1xuICAgIGlmICghc3RhdGUpIHtcbiAgICAgIHN0YXRlID0gbmV3IEJvdW5kYXJ5U3RhdGUodGhpcywgcmVmKTtcbiAgICAgIHRoaXMuYm91bmRhcmllcy5zZXQocmVmLmlkLCBzdGF0ZSk7XG4gICAgfVxuICAgIHJldHVybiBzdGF0ZTtcbiAgfVxuXG4gIGZpbmRDbG9zZXN0Qm91bmRhcnkocmVmOiBDb21taXRSZWYyKSB7XG4gICAgbGV0IGFuY2VzdG9yOiBDb21taXRSZWYyIHwgbnVsbCA9IHJlZjtcbiAgICBsZXQgbGFzdEFuY2VzdG9yOiBDb21taXRSZWYyIHwgbnVsbCA9IG51bGw7XG5cbiAgICB3aGlsZSAoYW5jZXN0b3IpIHtcbiAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5ib3VuZGFyaWVzLmdldChhbmNlc3Rvci5pZCk7XG4gICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgaWYgKHN0YXRlLm1vZGUgPT09ICdmYWxsYmFjaycgJiYgc3RhdGUuZmFsbGJhY2tSZWYpIHtcbiAgICAgICAgICAvLyBuZWVkIHRvIGNoZWNrIHRoYXQgd2UgYXJlIG5vdCBcImluXCIgdGhlIGZhbGxiYWNrXG4gICAgICAgICAgaWYgKGxhc3RBbmNlc3RvciAmJiBsYXN0QW5jZXN0b3IuaWQgPT09IHN0YXRlLmZhbGxiYWNrUmVmLmlkKSB7XG4gICAgICAgICAgICAvLyB3ZSBhcmUgaW4gdGhlIGZhbGxiYWNrIC0gY29udGludWUgdG8gbmV4dCBhbmNlc3RvclxuICAgICAgICAgICAgbGFzdEFuY2VzdG9yID0gYW5jZXN0b3I7XG4gICAgICAgICAgICBhbmNlc3RvciA9IGFuY2VzdG9yLnBhcmVudDtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG90aGVyd2lzZSwgd2UndmUgZm91bmQgb3VyIGNsb3Nlc3QgYm91bmRhcnlcbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgfVxuXG4gICAgICBsYXN0QW5jZXN0b3IgPSBhbmNlc3RvcjtcbiAgICAgIGFuY2VzdG9yID0gYW5jZXN0b3IucGFyZW50O1xuICAgIH1cbiAgfVxuXG5cbiAgdW5tb3VudENvbW1pdChwcmV2OiBDb21taXQyKSB7XG4gICAgY29uc3Qgb3V0cHV0ID0gbmV3IEVsZW1lbnRPdXRwdXQyKHByZXYucmVmKTtcbiAgICBvdXRwdXQucHJldkNoaWxkcmVuID0gcHJldi5jaGlsZHJlbi5tYXAoYyA9PiB0aGlzLmNvbW1pdHMuZ2V0KGMuaWQpIGFzIENvbW1pdDIpO1xuICBcbiAgICBzd2l0Y2ggKHR5cGVvZiBwcmV2LmVsZW1lbnQudHlwZSkge1xuICAgICAgY2FzZSAnc3ltYm9sJzoge1xuICAgICAgICBzd2l0Y2ggKHByZXYuZWxlbWVudC50eXBlKSB7XG4gICAgICAgICAgY2FzZSBzcGVjaWFsTm9kZVR5cGVzLnByb3ZpZGVyOlxuICAgICAgICAgICAgdGhpcy5jb250ZXh0cy5kZWxldGUocHJldi5yZWYuaWQpO1xuICAgICAgICAgICAgLy8geW91IG1pZ2h0IHRoaW5rIHdlIGhhdmUgdG8gZG8gc29tZVxuICAgICAgICAgICAgLy8gc3BlY2lhbCBsb2dpYyBhYm91dCBub3RpZnlpbmcgc3Vic2NyaWJlcnNcbiAgICAgICAgICAgIC8vIHRoYXQgdGhlIGNvbnRleHQgZGllZCwgYnV0IHRoZSBzdWJzY3JpYmVycyBhcmVcbiAgICAgICAgICAgIC8vIGFsc28gYWJvdXQgdG8gZGllIHNvIGl0cyBvayFcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2Ugc3BlY2lhbE5vZGVUeXBlcy5ib3VuZGFyeTpcbiAgICAgICAgICAgIHRoaXMuYm91bmRhcmllcy5kZWxldGUocHJldi5yZWYuaWQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdmdW5jdGlvbic6IHtcbiAgICAgICAgY29uc3QgY29tcG9uZW50U3RhdGUgPSB0aGlzLmNvbXBvbmVudHMuZ2V0KHByZXYucmVmLmlkKSBhcyBDb21wb25lbnRTdGF0ZTtcbiAgICAgICAgY29tcG9uZW50U3RhdGUudW5tb3VudGVkID0gdHJ1ZTtcbiAgICAgICAgZm9yIChjb25zdCBwcm92aWRlciBvZiBjb21wb25lbnRTdGF0ZS5wcm92aWRlcnMudmFsdWVzKCkpIHtcbiAgICAgICAgICBpZiAocHJvdmlkZXIpXG4gICAgICAgICAgICBwcm92aWRlci5jb25zdW1lcnMuZGVsZXRlKHByZXYucmVmLmlkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29tcG9uZW50U3RhdGUuYm91bmRhcnkgJiYgY29tcG9uZW50U3RhdGUucmVqZWN0aW9uKSB7XG4gICAgICAgICAgY29tcG9uZW50U3RhdGUuYm91bmRhcnkuY2xlYXJUaHJvdyhwcmV2LnJlZik7XG4gICAgICAgIH1cbiAgICAgICAgb3V0cHV0LmNsZWFudXBzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgW2luZGV4LCBjbGVhbnVwXSBvZiBjb21wb25lbnRTdGF0ZS5jbGVhbnVwcykge1xuICAgICAgICAgIGlmICghY2xlYW51cClcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIGNvbnN0IGlkID0gY29tcG9uZW50U3RhdGUuZWZmZWN0cy5nZXQoaW5kZXgpIGFzIEVmZmVjdElEO1xuICAgICAgICAgIG91dHB1dC5jbGVhbnVwcy5wdXNoKHtcbiAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgcmVmOiBwcmV2LnJlZixcbiAgICAgICAgICAgIGZ1bmM6IGNsZWFudXBcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbXBvbmVudHMuZGVsZXRlKHByZXYucmVmLmlkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgb3V0cHV0LmNhbGN1bGF0ZURpZmYoKTtcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG5cbiAgcHJvY2Vzc0VsZW1lbnQoZWxlbWVudDogRWxlbWVudCwgcmVmOiBDb21taXRSZWYyLCBjb21taXQ6IChDb21taXQyIHwgbnVsbCkpIHtcbiAgICBjb25zdCBvdXRwdXQgPSBuZXcgRWxlbWVudE91dHB1dDIocmVmKTtcblxuICAgIGlmIChjb21taXQpXG4gICAgICBvdXRwdXQucHJldkNoaWxkcmVuID0gY29tbWl0LmNoaWxkcmVuLm1hcChjID0+IHRoaXMuY29tbWl0cy5nZXQoYy5pZCkgYXMgQ29tbWl0Mik7XG5cbiAgICBzd2l0Y2ggKHR5cGVvZiBlbGVtZW50LnR5cGUpIHtcbiAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgIG91dHB1dC5wcm9jZXNzUHJpbWl0aXZlKGVsZW1lbnQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3N5bWJvbCc6IHtcbiAgICAgICAgc3dpdGNoIChlbGVtZW50LnR5cGUpIHtcbiAgICAgICAgICBjYXNlIHNwZWNpYWxOb2RlVHlwZXMucHJvdmlkZXI6IHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5nZXRPckNyZWF0ZVByb3ZpZGVyU3RhdGUocmVmLCBlbGVtZW50KTtcbiAgICAgICAgICAgIG91dHB1dC5wcm9jZXNzUHJvdmlkZXIoZWxlbWVudCwgc3RhdGUpXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSBzcGVjaWFsTm9kZVR5cGVzLmJvdW5kYXJ5OiB7XG4gICAgICAgICAgICBjb25zdCBzdGF0ZSA9IHRoaXMuZ2V0T3JDcmVhdGVCb3VuZGFyeVN0YXRlKHJlZik7XG4gICAgICAgICAgICBvdXRwdXQucHJvY2Vzc0JvdW5kYXJ5KGVsZW1lbnQsIHN0YXRlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYXNlIHNwZWNpYWxOb2RlVHlwZXMucmVuZGVyOlxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBvdXRwdXQucHJvY2Vzc1ByaW1pdGl2ZShlbGVtZW50KVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdmdW5jdGlvbic6IHtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzLmdldE9yQ3JlYXRlQ29tcG9uZW50U3RhdGUocmVmKTtcbiAgICAgICAgb3V0cHV0LnByb2Nlc3NDb21wb25lbnQoZWxlbWVudC50eXBlLCBlbGVtZW50LCB0aGlzLCBzdGF0ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cbn1cblxuIiwgImltcG9ydCB7IGNvbnZlcnROb2RlVG9FbGVtZW50LCBoLCBOb2RlLCBwcmltaXRpdmVOb2RlVHlwZXMgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5pbXBvcnQgeyBDb21taXQyLCBDb21taXRSZWYyIH0gZnJvbSBcIi4vY29tbWl0XCI7XG5pbXBvcnQgeyBXb3JrVGhyZWFkMiB9IGZyb20gXCIuL3RocmVhZFwiXG5pbXBvcnQgeyBDb21taXRUcmVlMiB9IGZyb20gXCIuL3RyZWVcIjtcbmltcG9ydCB7IFNjaGVkdWxlciB9IGZyb20gXCIuL3NjaGVkdWxlclwiO1xuaW1wb3J0IHsgRGVsdGEgfSBmcm9tIFwiLi9kZWx0YVwiO1xuaW1wb3J0IHsgV29ya1Rhc2sgfSBmcm9tIFwiLi91cGRhdGVcIjtcblxuLyoqXG4gKiBUaGUgUmVjb25jaWxlciBFdmVudCBCdXMgaXMgYSBzdHJ1Y3R1cmUgdGhhdCBjb250YWlucyBjYWxsYmFja3NcbiAqIGZvciBzcGVjaWZpYyByZWNvbmNpbGVyIGV2ZW50cy5cbiAqIFxuICogU3lzdGVtcyBsaWtlIHJlbmRlcmVycyBvciBzcGVjaWZpYyBkZWJ1ZyBpbnRlcmNlcHRvcnMgc2hvdWxkXG4gKiBpbXBsZW1lbnQgdGhlIGJ1cyBmdW5jdGlvbnMsIGFuZCB0aGVuIHBhc3MgdGhlaXIgaW5zdGFuY2VcbiAqIG9mIHRoZSBCdXMgdG8gdGhlIHJlY29uY2lsZXIuXG4gKi9cbmV4cG9ydCB0eXBlIFJlY29uY2lsZXJFdmVudEJ1cyA9IHtcbiAgcmVuZGVyKGRlbHRhOiBEZWx0YSk6IHZvaWQsXG59O1xuXG4vKipcbiAqIFRoZSBSZWNvbmNpbGVyIGlzIHRoZSBtYWluIG9iamVjdCB0aGF0XG4gKiBvd25zIHRoZSBDb21taXRUcmVlLCBhbmQgY29vcmRpbmF0ZXMgd2l0aCBpdCdzXG4gKiB0aHJlYWQgdG8gcGVyZm9ybSBjaGFuZ2VzIHJlcXVlc3RlZCB2aWEgYG1vdW50YCBhbmQgYHJlbmRlcmAuXG4gKiBcbiAqIFRoZSByZWNvbmNpbGVyLCB1cG9uIHJlY2VpdmluZyBzdWNoIGEgcmVxdWVzdFxuICovXG5leHBvcnQgY2xhc3MgUmVjb25jaWxlcjIge1xuICB0cmVlOiBDb21taXRUcmVlMjtcbiAgc2NoZWR1bGVyOiBTY2hlZHVsZXI7XG5cbiAgYnVzOiBSZWNvbmNpbGVyRXZlbnRCdXMgPSB7XG4gICAgcmVuZGVyOiAoKSA9PiB7fVxuICB9O1xuICAvLyBpbiB0aGUgZnV0dXJlIC0gbWF5YmUgbW9yZSB0aGFuIG9uZSB0aHJlYWQ/XG4gIHRocmVhZDogV29ya1RocmVhZDI7XG5cbiAgcG9vbHMgPSB7XG4gICAgY29tbWl0OiBDb21taXQyLnBvb2woKSxcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHNjaGVkdWxlcjogU2NoZWR1bGVyKSB7XG4gICAgdGhpcy5zY2hlZHVsZXIgPSBzY2hlZHVsZXI7XG4gICAgdGhpcy50cmVlID0gbmV3IENvbW1pdFRyZWUyKHRoaXMpO1xuICAgIHRoaXMudGhyZWFkID0gbmV3IFdvcmtUaHJlYWQyKHRoaXMudHJlZSk7XG5cbiAgICB0aGlzLnNjaGVkdWxlci5zZXRDYWxsYmFja0Z1bmMoKCkgPT4gdGhpcy53b3JrKCkpO1xuICAgIHRoaXMucG9vbHMuY29tbWl0Lm1heFNpemUgPSAyMDQ4XG4gIH1cblxuICBzdWJtaXRUaHJlYWQoKSB7XG4gICAgY29uc3QgY3VycmVudFRocmVhZCA9IHRoaXMudGhyZWFkO1xuICAgIC8vIFN0YXJ0IGEgbmV3IHRocmVhZFxuICAgIHRoaXMudGhyZWFkID0gbmV3IFdvcmtUaHJlYWQyKHRoaXMudHJlZSk7XG5cbiAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcblxuICAgIC8vIHNlbmQgZGVsdGEgcmVhZHlcbiAgICB0aGlzLmJ1cy5yZW5kZXIoY3VycmVudFRocmVhZC5kZWx0YSk7XG5cbiAgICAvLyBydW4gZWZmZWN0c1xuICAgIGZvciAoY29uc3QgY2xlYW51cCBvZiBjdXJyZW50VGhyZWFkLmRlbHRhLmNsZWFudXBzLnZhbHVlcygpKVxuICAgICAgY2xlYW51cC5mdW5jKCk7XG4gICAgZm9yIChjb25zdCBlZmZlY3Qgb2YgY3VycmVudFRocmVhZC5kZWx0YS5lZmZlY3RzLnZhbHVlcygpKVxuICAgICAgZWZmZWN0LmZ1bmMoKTtcblxuICAgIGZvciAoY29uc3QgcmVtb3ZlIG9mIGN1cnJlbnRUaHJlYWQuZGVsdGEucmVtb3ZlZC52YWx1ZXMoKSlcbiAgICAgIHRoaXMucG9vbHMuY29tbWl0LnJlbGVhc2UocmVtb3ZlKTtcbiAgfVxuXG4gIHdvcmsoKSB7XG4gICAgaWYgKCF0aGlzLnRocmVhZC5kb25lKSB7XG4gICAgICAvLyBkbyBzb21lIHdvcmtcbiAgICAgIHRoaXMudGhyZWFkLndvcmsoKTtcbiAgICAgIHRoaXMuc2NoZWR1bGVyLnJlcXVlc3RDYWxsYmFjaygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN1Ym1pdFRocmVhZCgpXG4gICAgfVxuICB9XG4gIHJ1bm5pbmcgPSBmYWxzZTtcblxuICBtb3VudChub2RlOiBOb2RlKTogQ29tbWl0UmVmMiB7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvbnZlcnROb2RlVG9FbGVtZW50KG5vZGUpO1xuICAgIGNvbnN0IHJlZiA9IENvbW1pdFJlZjIuZnJlc2gobnVsbCk7XG4gICAgdGhpcy50aHJlYWQucXVldWUoeyB0eXBlOiAnbW91bnQnLCByZWYsIGVsZW1lbnQgfSk7XG5cbiAgICB0aGlzLnNjaGVkdWxlci5yZXF1ZXN0Q2FsbGJhY2soKTtcbiAgICByZXR1cm4gcmVmO1xuICB9XG4gIHVubW91bnQocmVmOiBDb21taXRSZWYyKSB7XG4gICAgdGhpcy50aHJlYWQucXVldWUoeyB0eXBlOiAndW5tb3VudCcsIHJlZiB9KTtcblxuICAgIHRoaXMuc2NoZWR1bGVyLnJlcXVlc3RDYWxsYmFjaygpO1xuICB9XG4gIHJlbmRlcihyZWY6IENvbW1pdFJlZjIpOiB2b2lkIHtcbiAgICB0aGlzLnRocmVhZC5xdWV1ZSh7IHR5cGU6ICd0YXJnZXQnLCByZWYgfSk7XG5cbiAgICB0aGlzLnNjaGVkdWxlci5yZXF1ZXN0Q2FsbGJhY2soKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGgsIE5vZGUgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5pbXBvcnQgeyBjcmVhdGVXZWJOb2RlQnVpbGRlciwgSFRNTCB9IGZyb20gXCIuL3NwYWNlXCI7XG5pbXBvcnQgeyBSZW5kZXJTcGFjZTIgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0LWJhY2tzdGFnZVwiO1xuaW1wb3J0IHsgY3JlYXRlRE9NU2NoZWR1bGVyIH0gZnJvbSBcIi4vc2NoZWR1bGVyXCI7XG5pbXBvcnQgeyBSZWNvbmNpbGVyMiB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3QtcmVjb25cIjtcblxuLyoqXG4gKiBDdXN0b20gb3B0aW9ucyBmb3Igd2ViLnJlbmRlclxuICovXG50eXBlIE9wdGlvbnMgPSB7XG4gIHdpbmRvdz86IFdpbmRvdztcbn1cblxuLyoqXG4gKiBSZW5kZXIgYSBub2RlIGludG8gdGhlIHBhZ2UuXG4gKiBcbiAqIFxuICogQHBhcmFtIG5vZGUgXG4gKiBAcGFyYW0gcm9vdCBcbiAqIEBwYXJhbSBvcHRpb25zIFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBjb25zdCByZW5kZXIgPSAobm9kZTogTm9kZSwgcm9vdDogSFRNTEVsZW1lbnQsIG9wdGlvbnM6IE9wdGlvbnMgPSB7fSkgPT4ge1xuICBjb25zdCBzY2hlZHVsZXIgPSBjcmVhdGVET01TY2hlZHVsZXIoKTtcbiAgY29uc3QgcmVjb25jaWxlciA9IG5ldyBSZWNvbmNpbGVyMihzY2hlZHVsZXIpO1xuICBjb25zdCBzcGFjZSA9IG5ldyBSZW5kZXJTcGFjZTIocmVjb25jaWxlci50cmVlLCBjcmVhdGVXZWJOb2RlQnVpbGRlcihyb290LCBvcHRpb25zLndpbmRvdykpO1xuXG4gIHJlY29uY2lsZXIuYnVzID0gc3BhY2UuYnVzO1xuICBjb25zdCByZWYgPSByZWNvbmNpbGVyLm1vdW50KGgoSFRNTCwge30sIG5vZGUpKTtcblxuICByZXR1cm4ge3JlY29uY2lsZXIsIHNwYWNlLHJlZn07XG59XG4iLCAiaW1wb3J0IHsgRWxlbWVudFR5cGUsIHByaW1pdGl2ZU5vZGVUeXBlcywgc3BlY2lhbE5vZGVUeXBlcyB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcbmltcG9ydCB7IFJlY29uY2lsZXIyIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdC1yZWNvblwiO1xuXG5cbmV4cG9ydCBjb25zdCByZWh5ZHJhdGUgPSAobm9kZTogTm9kZSwgdHJlZTogUmVjb25jaWxlcjIpID0+IHtcblxufVxuXG5cbmV4cG9ydCBjb25zdCBwcmltaXRpdmVUb1N5bWJvbE1hcDogUmVjb3JkPHN0cmluZywgRWxlbWVudFR5cGU+ID0ge1xuICAvLydwcmltaXRpdmU6c3RyaW5nJzogcHJpbWl0aXZlTm9kZVR5cGVzLnN0cmluZyxcbiAgLy8ncHJpbWl0aXZlOm51bWJlcic6IHByaW1pdGl2ZU5vZGVUeXBlcy5udW1iZXIsXG4gIC8vJ3ByaW1pdGl2ZTpib29sZWFuJzogcHJpbWl0aXZlTm9kZVR5cGVzLmJvb2xlYW4sXG4gICdwcmltaXRpdmU6bnVsbCc6IHByaW1pdGl2ZU5vZGVUeXBlcy5udWxsLFxuICAncHJpbWl0aXZlOmFycmF5JzogcHJpbWl0aXZlTm9kZVR5cGVzLmFycmF5LFxuICAnc3BlY2lhbDpwbGFjZWhvbGRlcic6IHNwZWNpYWxOb2RlVHlwZXMucGxhY2Vob2xkZXIsXG4gICdzcGVjaWFsOnJlbmRlcic6IHNwZWNpYWxOb2RlVHlwZXMucmVuZGVyLFxuXG4gIFtwcmltaXRpdmVOb2RlVHlwZXMubnVsbF06ICdwcmltaXRpdmU6bnVsbCcsXG4gIFtwcmltaXRpdmVOb2RlVHlwZXMuYXJyYXldOiAncHJpbWl0aXZlOmFycmF5JyxcbiAgW3NwZWNpYWxOb2RlVHlwZXMucGxhY2Vob2xkZXJdOiAnc3BlY2lhbDpwbGFjZWhvbGRlcicsXG4gIFtzcGVjaWFsTm9kZVR5cGVzLnJlbmRlcl06ICdzcGVjaWFsOnJlbmRlcicsXG59IiwgImltcG9ydCB7IGgsIHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5cbmNvbnN0IENoaWxkQ29tcG9uZW50ID0gKCkgPT4ge1xuICBjb25zdCBbY2xpY2tlZCwgc2V0Q2xpY2tlZF0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgYmFja2dyb3VuZCA9IGBoc2woJHtNYXRoLnJhbmRvbSgpICogMzYwfWRlZyAgNTAlIDUwJSlgO1xuXG4gIGZ1bmN0aW9uIG9uQ2xpY2soKSB7XG4gICAgc2V0Q2xpY2tlZChjID0+IGMgKyAxKVxuICB9XG5cbiAgcmV0dXJuIGgoJ2J1dHRvbicsIHsgc3R5bGU6IHsgYmFja2dyb3VuZCB9LCBvbkNsaWNrIH0sIGBDbGlja2VkICR7Y2xpY2tlZH0gdGltZXMhYClcbn1cblxuZXhwb3J0IHR5cGUgSlNPTlZhbHVlID1cbiAgfCBzdHJpbmdcbiAgfCBudW1iZXJcbiAgfCBib29sZWFuXG4gIHwgbnVsbFxuICB8IFJlYWRvbmx5QXJyYXk8SlNPTlZhbHVlPlxuICB8IHsgW2tleTogc3RyaW5nXTogSlNPTlZhbHVlIH1cblxuZXhwb3J0IGNvbnN0IEFwcCA9ICh7IGRvbmUsIHVzZVNTUkVmZmVjdCwgdXNlU1NSU3RhdGUgfTogeyBkb25lOiAoKSA9PiB2b2lkLCB1c2VTU1JTdGF0ZTogPFQgZXh0ZW5kcyBKU09OVmFsdWU+KGtleTogc3RyaW5nLCBpbml0aWFsOiBUKSA9PiBbVCwgKHY6IFQpID0+IHZvaWRdIH0pID0+IHtcbiAgY29uc3QgW25hbWUsIHNldE5hbWVdID0gdXNlU3RhdGUoXCJXb3JsZFwiKTtcbiAgY29uc3QgW2JlZXJzLCBzZXRCZWVyc10gPSB1c2VTU1JTdGF0ZTxzdHJpbmdbXT4oJ2JlZXJzJywgW10pO1xuXG4gIGZ1bmN0aW9uIG9uSW5wdXQgKGV2ZW50OiBFdmVudCkge1xuICAgIHNldE5hbWUoKGV2ZW50LnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSlcbiAgfVxuXG4gIHVzZVNTUkVmZmVjdCgoKSA9PiB7XG4gICAgZmV0Y2goJ2h0dHBzOi8vYXBpLnNhbXBsZWFwaXMuY29tL2JlZXJzL2FsZScpXG4gICAgICAudGhlbihyID0+IHIuanNvbigpKVxuICAgICAgLnRoZW4ocGF5bG9hZCA9PiBzZXRCZWVycyhwYXlsb2FkLm1hcChkID0+IGQubmFtZSkpKVxuICB9LCBbXSlcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuXG4gICAgaWYgKGJlZXJzLmxlbmd0aCA+IDApXG4gICAgICBkb25lKCk7XG5cbiAgfSwgW2JlZXJzXSlcblxuICByZXR1cm4gaCgnYXJ0aWNsZScsIHt9LCBbXG4gICAgaCgnaDEnLCB7fSwgYEhlbGxvLCAke25hbWV9YCksXG4gICAgaChDaGlsZENvbXBvbmVudCksXG4gICAgaCgnaW5wdXQnLCB7IHR5cGU6ICd0ZXh0JywgdmFsdWU6IG5hbWUsIG9uSW5wdXQgfSksXG4gICAgaCgnb2wnLCB7fSwgYmVlcnMubWFwKGJlZXIgPT4gaCgnbGknLCB7fSwgYmVlcikpKVxuICBdKVxufTsiLCAiLy8gRk5WX1BSSU1FUyBhbmQgRk5WX09GRlNFVFMgZnJvbVxuLy8gaHR0cDovL3d3dy5pc3RoZS5jb20vY2hvbmdvL3RlY2gvY29tcC9mbnYvaW5kZXguaHRtbCNGTlYtcGFyYW1cblxuY29uc3QgRk5WX1BSSU1FUyA9IHtcblx0MzI6IDE2Xzc3N182MTluLFxuXHQ2NDogMV8wOTlfNTExXzYyOF8yMTFuLFxuXHQxMjg6IDMwOV80ODVfMDA5XzgyMV8zNDVfMDY4XzcyNF83ODFfMzcxbixcblx0MjU2OiAzNzRfMTQ0XzQxOV8xNTZfNzExXzE0N18wNjBfMTQzXzMxN18xNzVfMzY4XzQ1M18wMzFfOTE4XzczMV8wMDJfMjExbixcblx0NTEyOiAzNV84MzVfOTE1Xzg3NF84NDRfODY3XzM2OF85MTlfMDc2XzQ4OV8wOTVfMTA4XzQ0OV85NDZfMzI3Xzk1NV83NTRfMzkyXzU1OF8zOTlfODI1XzYxNV80MjBfNjY5XzkzOF84ODJfNTc1XzEyNl8wOTRfMDM5Xzg5Ml8zNDVfNzEzXzg1Ml83NTluLFxuXHQxMDI0OiA1XzAxNl80NTZfNTEwXzExM18xMThfNjU1XzQzNF81OThfODExXzAzNV8yNzhfOTU1XzAzMF83NjVfMzQ1XzQwNF83OTBfNzQ0XzMwM18wMTdfNTIzXzgzMV8xMTJfMDU1XzEwOF8xNDdfNDUxXzUwOV8xNTdfNjkyXzIyMF8yOTVfMzgyXzcxNl8xNjJfNjUxXzg3OF81MjZfODk1XzI0OV8zODVfMjkyXzI5MV84MTZfNTI0XzM3NV8wODNfNzQ2XzY5MV8zNzFfODA0XzA5NF8yNzFfODczXzE2MF80ODRfNzM3Xzk2Nl83MjBfMjYwXzM4OV8yMTdfNjg0XzQ3Nl8xNTdfNDY4XzA4Ml81NzNuLFxufTtcblxuY29uc3QgRk5WX09GRlNFVFMgPSB7XG5cdDMyOiAyXzE2Nl8xMzZfMjYxbixcblx0NjQ6IDE0XzY5NV85ODFfMDM5XzM0Nl82NTZfMDM3bixcblx0MTI4OiAxNDRfMDY2XzI2M18yOTdfNzY5XzgxNV81OTZfNDk1XzYyOV82NjdfMDYyXzM2N182MjluLFxuXHQyNTY6IDEwMF8wMjlfMjU3Xzk1OF8wNTJfNTgwXzkwN18wNzBfOTY4XzYyMF82MjVfNzA0XzgzN18wOTJfNzk2XzAxNF8yNDFfMTkzXzk0NV8yMjVfMjg0XzUwMV83NDFfNDcxXzkyNV81NTduLFxuXHQ1MTI6IDlfNjU5XzMwM18xMjlfNDk2XzY2OV80OThfMDA5XzQzNV80MDBfNzE2XzMxMF80NjZfMDkwXzQxOF83NDVfNjcyXzYzN184OTZfMTA4XzM3NF8zMjlfNDM0XzQ2Ml82NTdfOTk0XzU4Ml85MzJfMTk3XzcxNl80MzhfNDQ5XzgxM18wNTFfODkyXzIwNl81MzlfODA1Xzc4NF80OTVfMzI4XzIzOV8zNDBfMDgzXzg3Nl8xOTFfOTI4XzcwMV81ODNfODY5XzUxN183ODVuLFxuXHQxMDI0OiAxNF8xOTdfNzk1XzA2NF85NDdfNjIxXzA2OF83MjJfMDcwXzY0MV80MDNfMjE4XzMyMF84ODBfNjIyXzc5NV80NDFfOTMzXzk2MF84NzhfNDc0XzkxNF82MTdfNTgyXzcyM18yNTJfMjk2XzczMl8zMDNfNzE3XzcyMl8xNTBfODY0XzA5Nl81MjFfMjAyXzM1NV81NDlfMzY1XzYyOF8xNzRfNjY5XzEwOF81NzFfODE0Xzc2MF80NzFfMDE1XzA3Nl8xNDhfMDI5Xzc1NV85NjlfODA0XzA3N18zMjBfMTU3XzY5Ml80NThfNTYzXzAwM18yMTVfMzA0Xzk1N18xNTBfMTU3XzQwM182NDRfNDYwXzM2M181NTBfNTA1XzQxMl83MTFfMjg1Xzk2Nl8zNjFfNjEwXzI2N184NjhfMDgyXzg5M184MjNfOTYzXzc5MF80MzlfMzM2XzQxMV8wODZfODg0XzU4NF8xMDdfNzM1XzAxMF82NzZfOTE1bixcbn07XG5cbmNvbnN0IGNhY2hlZEVuY29kZXIgPSBuZXcgZ2xvYmFsVGhpcy5UZXh0RW5jb2RlcigpO1xuXG5mdW5jdGlvbiBmbnYxYVVpbnQ4QXJyYXkodWludDhBcnJheSwgc2l6ZSkge1xuXHRjb25zdCBmbnZQcmltZSA9IEZOVl9QUklNRVNbc2l6ZV07XG5cdGxldCBoYXNoID0gRk5WX09GRlNFVFNbc2l6ZV07XG5cblx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vbm8tZm9yLWxvb3AgLS0gVGhpcyBpcyBhIHBlcmZvcm1hbmNlLXNlbnNpdGl2ZSBsb29wXG5cdGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCB1aW50OEFycmF5Lmxlbmd0aDsgaW5kZXgrKykge1xuXHRcdGhhc2ggXj0gQmlnSW50KHVpbnQ4QXJyYXlbaW5kZXhdKTtcblx0XHRoYXNoID0gQmlnSW50LmFzVWludE4oc2l6ZSwgaGFzaCAqIGZudlByaW1lKTtcblx0fVxuXG5cdHJldHVybiBoYXNoO1xufVxuXG5mdW5jdGlvbiBmbnYxYUVuY29kZUludG8oc3RyaW5nLCBzaXplLCB1dGY4QnVmZmVyKSB7XG5cdGlmICh1dGY4QnVmZmVyLmxlbmd0aCA9PT0gMCkge1xuXHRcdHRocm93IG5ldyBFcnJvcignVGhlIGB1dGY4QnVmZmVyYCBvcHRpb24gbXVzdCBoYXZlIGEgbGVuZ3RoIGdyZWF0ZXIgdGhhbiB6ZXJvJyk7XG5cdH1cblxuXHRjb25zdCBmbnZQcmltZSA9IEZOVl9QUklNRVNbc2l6ZV07XG5cdGxldCBoYXNoID0gRk5WX09GRlNFVFNbc2l6ZV07XG5cdGxldCByZW1haW5pbmcgPSBzdHJpbmc7XG5cblx0d2hpbGUgKHJlbWFpbmluZy5sZW5ndGggPiAwKSB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gY2FjaGVkRW5jb2Rlci5lbmNvZGVJbnRvKHJlbWFpbmluZywgdXRmOEJ1ZmZlcik7XG5cdFx0cmVtYWluaW5nID0gcmVtYWluaW5nLnNsaWNlKHJlc3VsdC5yZWFkKTtcblx0XHRmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcmVzdWx0LndyaXR0ZW47IGluZGV4KyspIHtcblx0XHRcdGhhc2ggXj0gQmlnSW50KHV0ZjhCdWZmZXJbaW5kZXhdKTtcblx0XHRcdGhhc2ggPSBCaWdJbnQuYXNVaW50TihzaXplLCBoYXNoICogZm52UHJpbWUpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBoYXNoO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBmbnYxYSh2YWx1ZSwge3NpemUgPSAzMiwgdXRmOEJ1ZmZlcn0gPSB7fSkge1xuXHRpZiAoIUZOVl9QUklNRVNbc2l6ZV0pIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ1RoZSBgc2l6ZWAgb3B0aW9uIG11c3QgYmUgb25lIG9mIDMyLCA2NCwgMTI4LCAyNTYsIDUxMiwgb3IgMTAyNCcpO1xuXHR9XG5cblx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcblx0XHRpZiAodXRmOEJ1ZmZlcikge1xuXHRcdFx0cmV0dXJuIGZudjFhRW5jb2RlSW50byh2YWx1ZSwgc2l6ZSwgdXRmOEJ1ZmZlcik7XG5cdFx0fVxuXG5cdFx0dmFsdWUgPSBjYWNoZWRFbmNvZGVyLmVuY29kZSh2YWx1ZSk7XG5cdH1cblxuXHRyZXR1cm4gZm52MWFVaW50OEFycmF5KHZhbHVlLCBzaXplKTtcbn1cbiIsICJpbXBvcnQgZm52MWEgZnJvbSAnQHNpbmRyZXNvcmh1cy9mbnYxYSc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHN0cmluZ0hhc2goc3RyaW5nKSB7XG5cdHJldHVybiBOdW1iZXIoZm52MWEoc3RyaW5nKSk7XG59XG4iLCAiLmVsZW1lbnRCYXIge1xuICBvdmVyZmxvdzogdmlzaWJsZTtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAgZmxleC1zaHJpbms6IDA7XG4gIHdpZHRoOiBtYXgtY29udGVudDtcbn1cblxuLmVsZW1lbnROYW1lIHtcbiAgZm9udC1mYW1pbHk6IG1vbm9zcGFjZTtcbiAgZGlzcGxheTogaW5saW5lO1xuXG4gIHBhZGRpbmc6IDRweDtcbiAgYm9yZGVyLXJhZGl1czogOHB4O1xuXG4gIG1hcmdpbjogMnB4O1xuXG4gIGJvcmRlcjogMnB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMCk7XG4gIHdoaXRlLXNwYWNlOiBub3dyYXA7XG59XG4uZWxlbWVudE5hbWU6aG92ZXIge1xuICBmb250LXdlaWdodDogYm9sZDtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBib3JkZXI6IDJweCBzb2xpZCB3aGl0ZTtcbn1cblxuLmNvbW1pdCB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIG92ZXJmbG93OiB2aXNpYmxlO1xuICB3aGl0ZS1zcGFjZTogcHJlO1xuICB3aWR0aDogbWF4LWNvbnRlbnQ7XG4gIGZsZXg6IDE7XG59XG5cbi5lbGVtZW50QmFyLnNlbGVjdGVkIC5lbGVtZW50TmFtZSB7XG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xuICB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTtcbn1cblxuLmNvbW1pdExpc3Qge1xuICBmbGV4OiAxO1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBsaXN0LXN0eWxlOiBub25lO1xuICBvdmVyZmxvdzogdmlzaWJsZTtcbiAgd2lkdGg6IG1heC1jb250ZW50O1xuICBnYXA6IDlweDtcbn1cbi5jb21taXRMaXN0LnRvcCB7XG4gIG1hcmdpbjogMDtcbiAgcGFkZGluZzogMDtcblxuICBvdmVyZmxvdzogYXV0bztcbn1cbiIsICIuY29tbWl0QXR0cmlidXRlVGFnIHtcbiAgZGlzcGxheTogaW5saW5lLWZsZXg7XG5cbiAgZ2FwOiA0cHg7XG4gIG1hcmdpbjogYXV0byA0cHg7XG5cbiAgY29sb3I6IHdoaXRlO1xuXG4gIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgcGFkZGluZzogNHB4O1xuXG4gIGZvbnQtZmFtaWx5OiBtb25vc3BhY2U7XG4gIGZvbnQtc2l6ZTogMTJweDtcblxuICBoZWlnaHQ6IDE4cHg7XG59IFxuXG4uY29tbWl0QXR0cmlidXRlVGFnTmFtZSB7XG4gIG1hcmdpbjogYXV0bztcbn1cblxuLmNvbW1pdEF0dHJpYnV0ZVRhZ1ZhbHVlIHtcbiAgbWFyZ2luOiBhdXRvO1xuICBib3JkZXItcmFkaXVzOiA0cHg7XG4gIHBhZGRpbmc6IDJweDtcbiAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XG4gIGNvbG9yOiBibGFjaztcbn0iLCAiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdFwiO1xuaW1wb3J0IGNsYXNzZXMgZnJvbSAnLi9BdHRyaWJ1dGVUYWcubW9kdWxlLmNzcyc7XG5pbXBvcnQgc3RyaW5nSGFzaCBmcm9tIFwiQHNpbmRyZXNvcmh1cy9zdHJpbmctaGFzaFwiO1xuaW1wb3J0IHsgaHMgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0LXdlYlwiO1xuXG5leHBvcnQgdHlwZSBDb21taXRBdHRyaWJ1dGVUYWdQcm9wcyA9IHtcbiAgbmFtZTogc3RyaW5nLFxuICB2YWx1ZTogc3RyaW5nLFxufVxuXG5leHBvcnQgY29uc3QgQ29tbWl0QXR0cmlidXRlVGFnOiBDb21wb25lbnQ8Q29tbWl0QXR0cmlidXRlVGFnUHJvcHM+ID0gKHsgbmFtZSwgdmFsdWUgfSkgPT4ge1xuICBjb25zdCBiYWNrZ3JvdW5kID0gYGhzbCgke3N0cmluZ0hhc2gobmFtZSkgJSAzNjB9ZGVnLCA1MCUsIDUwJSlgO1xuICByZXR1cm4gaHMoJ3NwYW4nLCB7IGNsYXNzTmFtZTogY2xhc3Nlcy5jb21taXRBdHRyaWJ1dGVUYWcsIHN0eWxlOiB7IGJhY2tncm91bmQgfSB9LCBbXG4gICAgaHMoJ3NwYW4nLCB7IGNsYXNzTmFtZTogY2xhc3Nlcy5jb21taXRBdHRyaWJ1dGVUYWdOYW1lIH0sIG5hbWUpLFxuICAgIGhzKCdzcGFuJywgeyBjbGFzc05hbWU6IGNsYXNzZXMuY29tbWl0QXR0cmlidXRlVGFnVmFsdWUgfSwgdmFsdWUpLFxuICBdKVxufSIsICJpbXBvcnQgeyBDb21wb25lbnQsIGgsIE5vZGUgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5pbXBvcnQgeyBocyB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3Qtd2ViXCI7XG5pbXBvcnQgc3RyaW5nSGFzaCBmcm9tICdAc2luZHJlc29yaHVzL3N0cmluZy1oYXNoJztcblxuaW1wb3J0IGNsYXNzZXMgZnJvbSAnLi9UcmVlVmlld2VyLm1vZHVsZS5jc3MnO1xuLy9pbXBvcnQgeyBDb21taXRBdHRyaWJ1dGVUYWcgfSBmcm9tIFwiLi9BdHRyaWJ1dGVUYWdcIjtcbmltcG9ydCB7IENvbW1pdFJlcG9ydCwgVHJlZVJlcG9ydCB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3QtZGVidWdcIjtcbmltcG9ydCB7IENvbW1pdElEIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdC1yZWNvblwiO1xuaW1wb3J0IHsgQ29tbWl0QXR0cmlidXRlVGFnIH0gZnJvbSAnLi9BdHRyaWJ1dGVUYWcnO1xuXG5leHBvcnQgdHlwZSBUcmVlVmlld2VyUHJvcHMgPSB7XG4gIC8vY29tbWl0czogTWFwPENvbW1pdElELCBDb21taXRSZXBvcnQ+LFxuICByb290czogQ29tbWl0SURbXSxcblxuICByZW5kZXJDb21taXQ6IChjb21taXRJZDogQ29tbWl0SUQpID0+IE5vZGUsXG59XG5cbmV4cG9ydCBjb25zdCBUcmVlVmlld2VyOiBDb21wb25lbnQ8VHJlZVZpZXdlclByb3BzPiA9ICh7XG4gIC8vY29tbWl0cyxcbiAgcm9vdHMsXG4gIHJlbmRlckNvbW1pdFxufSkgPT4ge1xuICAvL2NvbnN0IHJvb3RDb21taXRzID0gcm9vdHMubWFwKHJvb3QgPT4gY29tbWl0cy5nZXQocm9vdCkpLmZpbHRlcih4ID0+ICEheClcblxuICBjb25zdCBjbGFzc05hbWUgPSBbY2xhc3Nlcy5jb21taXRMaXN0LCBjbGFzc2VzLnRvcF0uam9pbignICcpXG5cbiAgcmV0dXJuIGgoJ29sJywgeyBjbGFzc05hbWUgfSwgcm9vdHMubWFwKHJvb3QgPT5cbiAgICBoKCdsaScsIHsga2V5OiByb290IH0sIHJlbmRlckNvbW1pdChyb290KSkpKTtcbn07XG5cbmV4cG9ydCB0eXBlIENvbW1pdFByZXZpZXdQcm9wcyA9IHtcbiAgY29tbWl0OiBDb21taXRSZXBvcnQsXG5cbiAgYXR0cmlidXRlcz86IFtzdHJpbmcsIHN0cmluZ11bXSxcblxuICBjb2xvcj86IHN0cmluZyxcblxuICBkZXB0aD86IG51bWJlcixcblxuICByZW5kZXJDb21taXQ/OiAoY29tbWl0OiBDb21taXRJRCkgPT4gTm9kZSxcbiAgb25DbGljaz86ICgpID0+IHZvaWQsXG59XG5cbmV4cG9ydCBjb25zdCBDb21taXRQcmV2aWV3OiBDb21wb25lbnQ8Q29tbWl0UHJldmlld1Byb3BzPiA9ICh7XG4gIGNvbW1pdCwgZGVwdGggPSAwLFxuICBhdHRyaWJ1dGVzID0gW10sXG4gIHJlbmRlckNvbW1pdCxcbiAgY29sb3IsXG4gIG9uQ2xpY2ssXG59KSA9PiB7XG4gIGNvbnN0IGJhY2tncm91bmQgPSBgaHNsKCR7KGRlcHRoICogMjIuMykgJSAzNjB9ZGVnLCA1MCUsIDgwJSlgO1xuICBjb25zdCBlbGVtZW50QmFja2dyb3VuZCA9IGNvbG9yIHx8IGBoc2woJHtzdHJpbmdIYXNoKGNvbW1pdC5lbGVtZW50LnR5cGUpICUgMzYwfWRlZywgNjAlLCA4MCUpYDtcbiAgY29uc3QgbGluZUNvbG9yID0gYGhzbCgke3N0cmluZ0hhc2goY29tbWl0LmlkLnRvU3RyaW5nKCkpICUgMzYwfSwgMTAwJSwgMjAlKWBcblxuXG4gIHJldHVybiBocygnZGl2JywgeyBjbGFzc05hbWU6IGNsYXNzZXMuY29tbWl0LCBzdHlsZTogeyBwb3NpdGlvbjogJ3JlbGF0aXZlJyB9LCBpZDogYGNvbW1pdDoke2NvbW1pdC5pZH1gIH0sIFtcbiAgICBjb21taXQuY2hpbGRyZW4ubGVuZ3RoID4gMCAmJlxuICAgICAgaCgnZGl2JywgeyBzdHlsZToge1xuICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgdG9wOiAnNXB4JyxcbiAgICAgICAgaGVpZ2h0OiAnY2FsYygxMDAlIC0gMThweCknLCB3aWR0aDogJzFweCcsIGJhY2tncm91bmQ6IGxpbmVDb2xvciwgdHJhbnNmb3JtOiBgdHJhbnNsYXRlKDIwcHgsIDBweClgXG4gICAgICB9IH0pLFxuXG4gICAgaHMoJ2RpdicsIHsgY2xhc3NOYW1lOiBbY2xhc3Nlcy5lbGVtZW50QmFyXS5qb2luKCcgJyksIHN0eWxlOiB7ICdwb3NpdGlvbic6ICdyZWxhdGl2ZScgfSB9LCBbXG4gICAgICBocygnYnV0dG9uJywgeyBvbkNsaWNrLCBjbGFzc05hbWU6IGNsYXNzZXMuZWxlbWVudE5hbWUsIHN0eWxlOiB7IGJhY2tncm91bmQ6IGVsZW1lbnRCYWNrZ3JvdW5kIH0gfSxcbiAgICAgICAgY29tbWl0LmVsZW1lbnQudHlwZSksXG4gICAgICBoKENvbW1pdEF0dHJpYnV0ZVRhZywgeyBuYW1lOiAnSWQnLCB2YWx1ZTogY29tbWl0LmlkLnRvU3RyaW5nKCkgfSksXG4gICAgICBhdHRyaWJ1dGVzLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4gaChDb21taXRBdHRyaWJ1dGVUYWcsIHsgbmFtZSwgdmFsdWUgfSkpXG4gICAgICAvL2goQ29tbWl0QXR0cmlidXRlVGFnLCB7IG5hbWU6ICdWZXJzaW9uJywgdmFsdWU6IGNvbW1pdC52ZXJzaW9uLnRvU3RyaW5nKCkgfSksXG4gICAgXSksXG5cbiAgICAhIXJlbmRlckNvbW1pdCAmJiBocygnb2wnLCB7IGNsYXNzTmFtZTogY2xhc3Nlcy5jb21taXRMaXN0IH0sIGNvbW1pdC5jaGlsZHJlbi5tYXAoY2hpbGRJZCA9PiBoKCdsaScsIHsga2V5OiBjaGlsZElkLCBzdHlsZTogeyBwb3NpdGlvbjogJ3JlbGF0aXZlJyB9IH0sIFtcbiAgICAgIHJlbmRlckNvbW1pdChjaGlsZElkKSxcbiAgICAgIGgoJ2RpdicsIHsgc3R5bGU6IHtcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICB3aWR0aDogJzI1cHgnLCBoZWlnaHQ6ICcxcHgnLCAnYm9yZGVyLXRvcCc6ICcycHggZG90dGVkIGJsYWNrJywgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgIHRyYW5zZm9ybTogYHRyYW5zbGF0ZSgtMjJweCwgMTVweClgXG4gICAgICB9fSlcbiAgICBdKSkpLFxuICBdKVxufTtcblxuLy8gaChDb21taXRQcmV2aWV3LCB7IGNvbW1pdDogY2hpbGQsIHRyZWUsIGRlcHRoOiBkZXB0aCArIDEsIHNlbGVjdGVkQ29tbWl0cywgb25TZWxlY3RDb21taXQgfSkpKSIsICJpbXBvcnQge1xuICBFbGVtZW50LFxuICBzcGVjaWFsTm9kZVR5cGVzLFxuICBwcmltaXRpdmVOb2RlVHlwZXMsXG59IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcblxuZXhwb3J0IGNvbnN0IGdldEVsZW1lbnROYW1lID0gKGVsZW1lbnQ6IEVsZW1lbnQpID0+IHtcbiAgaWYgKHR5cGVvZiBlbGVtZW50LnR5cGUgPT09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIGA8Y29tcG9uZW50KCR7ZWxlbWVudC50eXBlLm5hbWV9KT5gO1xuICBpZiAodHlwZW9mIGVsZW1lbnQudHlwZSA9PT0gJ3N5bWJvbCcpXG4gICAgc3dpdGNoIChlbGVtZW50LnR5cGUpIHtcbiAgICAgIGNhc2UgcHJpbWl0aXZlTm9kZVR5cGVzLm51bWJlcjpcbiAgICAgICAgcmV0dXJuIGA8bnVtYmVyIHZhbHVlPXske2VsZW1lbnQucHJvcHMudmFsdWV9fT5gXG4gICAgICBjYXNlIHByaW1pdGl2ZU5vZGVUeXBlcy5zdHJpbmc6XG4gICAgICAgIHJldHVybiBgPHN0cmluZyB2YWx1ZT1cIiR7ZWxlbWVudC5wcm9wcy52YWx1ZX1cIj5gXG4gICAgICBjYXNlIHByaW1pdGl2ZU5vZGVUeXBlcy5ib29sZWFuOlxuICAgICAgICByZXR1cm4gYDxib29sZWFuIHZhbHVlPVwiJHtlbGVtZW50LnByb3BzLnZhbHVlfVwiPmBcbiAgICAgIGNhc2UgcHJpbWl0aXZlTm9kZVR5cGVzLmFycmF5OlxuICAgICAgICByZXR1cm4gYDxhcnJheT5gXG4gICAgICBjYXNlIHByaW1pdGl2ZU5vZGVUeXBlcy5udWxsOlxuICAgICAgICByZXR1cm4gYDxudWxsPmBcbiAgICAgIGNhc2Ugc3BlY2lhbE5vZGVUeXBlcy5mYWxsYmFjazpcbiAgICAgICAgcmV0dXJuIGA8ZmFsbGJhY2s+YDtcbiAgICAgIGNhc2Ugc3BlY2lhbE5vZGVUeXBlcy5zdXNwZW5kOlxuICAgICAgICByZXR1cm4gYDxzdXNwZW5kPmA7XG4gICAgICBjYXNlIHNwZWNpYWxOb2RlVHlwZXMucmVuZGVyOlxuICAgICAgICByZXR1cm4gYDxyZW5kZXIgdHlwZT1cIiR7ZWxlbWVudC5wcm9wcy50eXBlfVwiPmA7XG4gICAgICBjYXNlIHNwZWNpYWxOb2RlVHlwZXMucHJvdmlkZXI6XG4gICAgICAgIHJldHVybiBgPGNvbnRleHQgaWQ9XCIke2VsZW1lbnQucHJvcHMuaWR9XCI+YDtcbiAgICAgIGNhc2Ugc3BlY2lhbE5vZGVUeXBlcy5ib3VuZGFyeTpcbiAgICAgICAgcmV0dXJuIGA8Ym91bmRhcnk+YDtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBgPHN5bWJvbD5gXG4gICAgfVxuICBpZiAoZWxlbWVudC50eXBlKVxuICAgIHJldHVybiBgPCR7ZWxlbWVudC50eXBlfT5gO1xuICByZXR1cm4gJzxub25lPic7XG59XG4iLCAiaW1wb3J0IHsgRWxlbWVudCwgRWxlbWVudElELCBPcGFxdWVJRCB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3RcIjtcbmltcG9ydCB7IENvbW1pdDIsIENvbW1pdElELCBDb21taXRUcmVlMiwgQ29tbWl0VmVyc2lvbiwgQ29tcG9uZW50U3RhdGUsIERlbHRhLCBXb3JrUmVhc29uLCBXb3JrVGFzaywgV29ya1RocmVhZDIgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0LXJlY29uXCI7XG5pbXBvcnQgeyBnZXRFbGVtZW50TmFtZSB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbi8qKlxuICogXCJSZXBvcnRzXCIgYXJlIHNlcmlhbGl6ZWQgdmVyc2lvbnMgb2YgdGhlaXIgXCJuYXRpdmVcIlxuICogY291bnRlcnBhcnRzIC0gcmVhZHkgZm9yIHRyYW5zcG9ydCBhY3Jvc3MgcHJvY2Vzcy9jb250ZXh0XG4gKiBib3VuZGFyaWVzLlxuICovXG5cbmV4cG9ydCB0eXBlIFZhbHVlUmVwb3J0ID1cbiAgfCB7IHR5cGU6ICd1bmRlZmluZWQnIH1cbiAgfCB7IHR5cGU6ICdwcmltaXRpdmUnLCB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwgfVxuICB8IHsgdHlwZTogJ2NvbXBsZXgnLCBuYW1lOiBzdHJpbmcgfVxuXG5leHBvcnQgY29uc3QgY3JlYXRlVmFsdWVSZXBvcnQgPSAodmFsdWU6IHVua25vd24pOiBWYWx1ZVJlcG9ydCA9PiB7XG4gIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XG4gICAgY2FzZSAnc3RyaW5nJzpcbiAgICBjYXNlICdudW1iZXInOlxuICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgcmV0dXJuIHsgdHlwZTogJ3ByaW1pdGl2ZScsIHZhbHVlIH07XG4gICAgY2FzZSAnYmlnaW50JzpcbiAgICAgIHJldHVybiB7IHR5cGU6ICdjb21wbGV4JywgbmFtZTogYGJpZ2ludCgke3ZhbHVlLnRvU3RyaW5nKCl9KWAgfVxuICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICBpZiAoIXZhbHVlKVxuICAgICAgICByZXR1cm4geyB0eXBlOiAncHJpbWl0aXZlJywgdmFsdWUgfTtcbiAgICAgIGlmICh2YWx1ZS5jb25zdHJ1Y3RvcilcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogJ2NvbXBsZXgnLCBuYW1lOiB2YWx1ZS5jb25zdHJ1Y3Rvci5uYW1lIH1cbiAgICAgIHJldHVybiB7IHR5cGU6ICdjb21wbGV4JywgbmFtZTogJz8/PycgfVxuICAgIGNhc2UgJ2Z1bmN0aW9uJzpcbiAgICAgIHJldHVybiB7IHR5cGU6ICdjb21wbGV4JywgbmFtZTogYGZ1bmN0aW9uKCR7dmFsdWUubmFtZX0pYCB9O1xuICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICByZXR1cm4geyB0eXBlOiAnY29tcGxleCcsIG5hbWU6IHZhbHVlLmRlc2NyaXB0aW9uIHx8ICdzeW1ib2wnIH1cbiAgICBjYXNlICd1bmRlZmluZWQnOlxuICAgICAgcmV0dXJuIHsgdHlwZTogJ3VuZGVmaW5lZCcgfVxuICB9XG59O1xuXG5leHBvcnQgdHlwZSBDb21wb25lbnRTdGF0ZVJlcG9ydCA9IHtcbiAgc3RhdGVWYWx1ZXM6IHsgaG9va0luZGV4OiBudW1iZXIsIHZhbHVlOiBWYWx1ZVJlcG9ydCB9W11cbn1cblxuZXhwb3J0IHR5cGUgQ29tbWl0RGV0YWlsc1JlcG9ydCA9IHtcbiAgY29tbWl0OiBDb21taXRSZXBvcnQsXG4gIHByb3BzOiBSZWNvcmQ8c3RyaW5nLCBWYWx1ZVJlcG9ydD4sXG5cbiAgY29tcG9uZW50OiBudWxsIHwgQ29tcG9uZW50U3RhdGVSZXBvcnQsXG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVDb21taXREZXRhaWxzUmVwb3J0ID0gKGNvbW1pdDogQ29tbWl0MiwgdHJlZTogQ29tbWl0VHJlZTIpOiBDb21taXREZXRhaWxzUmVwb3J0ID0+IHtcbiAgY29uc3QgcHJvcHM6IFJlY29yZDxzdHJpbmcsIFZhbHVlUmVwb3J0PiA9IHt9O1xuXG4gIGZvciAoY29uc3Qga2V5IGluIGNvbW1pdC5lbGVtZW50LnByb3BzKSB7XG4gICAgcHJvcHNba2V5XSA9IGNyZWF0ZVZhbHVlUmVwb3J0KGNvbW1pdC5lbGVtZW50LnByb3BzW2tleV0pO1xuICB9XG4gIGNvbnN0IGNvbXBvbmVudFN0YXRlID0gdHJlZS5jb21wb25lbnRzLmdldChjb21taXQucmVmLmlkKTtcblxuICBjb25zdCBjb21wb25lbnQgPSBjb21wb25lbnRTdGF0ZSAmJiB7XG4gICAgc3RhdGVWYWx1ZXM6IFsuLi5jb21wb25lbnRTdGF0ZS52YWx1ZXMuZW50cmllcygpXS5tYXAoKFtob29rSW5kZXgsIHZhbHVlXSkgPT4gKHtcbiAgICAgIGhvb2tJbmRleCxcbiAgICAgIHZhbHVlOiBjcmVhdGVWYWx1ZVJlcG9ydCh2YWx1ZSksXG4gICAgfSkpXG4gIH0gfHwgbnVsbDtcblxuICByZXR1cm4ge1xuICAgIGNvbW1pdDogY3JlYXRlQ29tbWl0UmVwb3J0KGNvbW1pdCksXG4gICAgcHJvcHMsXG4gICAgY29tcG9uZW50LFxuICB9XG59XG5cblxuXG5leHBvcnQgdHlwZSBFbGVtZW50UmVwb3J0ID0ge1xuICB0eXBlOiBzdHJpbmcsXG4gIC8vcHJvcHM6IFJlY29yZDxzdHJpbmcsIFZhbHVlUmVwb3J0PixcbiAgaWQ6IEVsZW1lbnRJRDtcbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZUVsZW1lbnRSZXBvcnQgPSAoZWxlbWVudDogRWxlbWVudCk6IEVsZW1lbnRSZXBvcnQgPT4ge1xuICByZXR1cm4ge1xuICAgIGlkOiBlbGVtZW50LmlkLFxuICAgIC8vcHJvcHM6IE9iamVjdC5lbnRyaWVzKGVsZW1lbnQucHJvcHMpLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4gW25hbWUsIGNyZWF0ZVZhbHVlUmVwb3J0KHZhbHVlKV0pXG4gICAgdHlwZTogZ2V0RWxlbWVudE5hbWUoZWxlbWVudCksXG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgQ29tbWl0UmVwb3J0ID0ge1xuICBpZDogQ29tbWl0SUQsXG4gIHBhcmVudDogQ29tbWl0SUQgfCBudWxsLFxuICBkaXN0YW5jZTogbnVtYmVyLFxuXG4gIHZlcnNpb246IENvbW1pdFZlcnNpb247XG4gIGVsZW1lbnQ6IEVsZW1lbnRSZXBvcnQ7XG4gIGNoaWxkcmVuOiBDb21taXRJRFtdO1xufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlQ29tbWl0UmVwb3J0ID0gKGNvbW1pdDogQ29tbWl0Mik6IENvbW1pdFJlcG9ydCA9PiB7XG4gIHJldHVybiB7XG4gICAgaWQ6IGNvbW1pdC5yZWYuaWQsXG4gICAgcGFyZW50OiBjb21taXQucmVmLnBhcmVudCA/IGNvbW1pdC5yZWYucGFyZW50LmlkIDogbnVsbCxcbiAgICBkaXN0YW5jZTogY29tbWl0LnJlZi5sZW5ndGgsXG5cbiAgICBlbGVtZW50OiBjcmVhdGVFbGVtZW50UmVwb3J0KGNvbW1pdC5lbGVtZW50KSxcbiAgICB2ZXJzaW9uOiBjb21taXQudmVyc2lvbixcbiAgICBjaGlsZHJlbjogY29tbWl0LmNoaWxkcmVuLm1hcChjaGlsZCA9PiBjaGlsZC5pZClcbiAgfVxufVxuXG5cbmV4cG9ydCB0eXBlIERlbHRhUmVwb3J0ID0ge1xuICBjcmVhdGVkOiBDb21taXRSZXBvcnRbXSxcbiAgcmVtb3ZlZDogQ29tbWl0UmVwb3J0W10sXG4gIHVwZGF0ZWQ6IENvbW1pdFJlcG9ydFtdXG59XG5leHBvcnQgY29uc3QgY3JlYXRlRGVsdGFSZXBvcnQgPSAoZGVsdGE6IERlbHRhKTogRGVsdGFSZXBvcnQgPT4ge1xuICBjb25zdCByZXBvcnQ6IERlbHRhUmVwb3J0ID0ge1xuICAgIGNyZWF0ZWQ6IFtdLFxuICAgIHJlbW92ZWQ6IFtdLFxuICAgIHVwZGF0ZWQ6IFtdLFxuICB9XG4gIGZvciAoY29uc3QgY29tbWl0IG9mIGRlbHRhLmZyZXNoLnZhbHVlcygpKVxuICAgIHJlcG9ydC5jcmVhdGVkLnB1c2goY3JlYXRlQ29tbWl0UmVwb3J0KGNvbW1pdCkpO1xuICBmb3IgKGNvbnN0IHsgbmV4dCB9IG9mIGRlbHRhLmNoYW5nZWQudmFsdWVzKCkpXG4gICAgcmVwb3J0LnVwZGF0ZWQucHVzaChjcmVhdGVDb21taXRSZXBvcnQobmV4dCkpO1xuICBmb3IgKGNvbnN0IGNvbW1pdCBvZiBkZWx0YS5yZW1vdmVkLnZhbHVlcygpKVxuICAgIHJlcG9ydC5yZW1vdmVkLnB1c2goY3JlYXRlQ29tbWl0UmVwb3J0KGNvbW1pdCkpO1xuXG4gIHJldHVybiByZXBvcnQ7XG59XG5cbmV4cG9ydCB0eXBlIFdvcmtUYXNrUmVwb3J0ID0ge1xuICBlbGVtZW50OiBudWxsIHwgRWxlbWVudFJlcG9ydCxcbiAgcHJldjogbnVsbCB8IENvbW1pdFJlcG9ydCxcbiAgbW92ZWQ6IGJvb2xlYW4sXG5cbiAgcGFyZW50OiBudWxsIHwgQ29tbWl0SUQsXG4gIGlkOiBDb21taXRJRCxcbn1cbmV4cG9ydCBjb25zdCBjcmVhdGVXb3JrVGFza1JlcG9ydCA9ICh0YXNrOiBXb3JrVGFzayk6IFdvcmtUYXNrUmVwb3J0ID0+IHtcbiAgcmV0dXJuIHtcbiAgICBlbGVtZW50OiB0YXNrLm5leHQgJiYgY3JlYXRlRWxlbWVudFJlcG9ydCh0YXNrLm5leHQpLFxuICAgIHByZXY6IHRhc2sucHJldiAmJiBjcmVhdGVDb21taXRSZXBvcnQodGFzay5wcmV2KSxcbiAgICBtb3ZlZDogdGFzay5tb3ZlZCxcblxuICAgIHBhcmVudDogdGFzay5yZWYucGFyZW50ICYmIHRhc2sucmVmLnBhcmVudC5pZCxcbiAgICBpZDogdGFzay5yZWYuaWQsXG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgVGhyZWFkUmVwb3J0ID0ge1xuICBtaXNzZWQ6IENvbW1pdElEW10sXG4gIHZpc2l0ZWQ6IENvbW1pdElEW10sXG4gIG11c3RWaXNpdDogQ29tbWl0SURbXSxcbiAgbXVzdFJlbmRlcjogQ29tbWl0SURbXSxcblxuICBwZW5kaW5nVGFza3M6IFdvcmtUYXNrUmVwb3J0W10sXG4gIHJlYXNvbnM6IFdvcmtSZWFzb25SZXBvcnRbXSxcblxuICBpZDogT3BhcXVlSUQ8XCJUaHJlYWRJRFwiPixcbiAgcGFzc2VzOiBudW1iZXIsXG4gIGRvbmU6IGJvb2xlYW4sXG59O1xuXG5leHBvcnQgdHlwZSBXb3JrUmVhc29uUmVwb3J0ID0geyB0YXJnZXQ6IENvbW1pdElELCBlbGVtZW50OiBFbGVtZW50UmVwb3J0IHwgbnVsbCB9O1xuZXhwb3J0IGNvbnN0IGNyZWF0ZVdvcmtSZWFzb25SZXBvcnQgPSAocmVhc29uOiBXb3JrUmVhc29uKTogV29ya1JlYXNvblJlcG9ydCA9PiB7XG4gIGlmIChyZWFzb24udHlwZSA9PT0gJ21vdW50JylcbiAgICByZXR1cm4geyB0YXJnZXQ6IHJlYXNvbi5yZWYuaWQsIGVsZW1lbnQ6IGNyZWF0ZUVsZW1lbnRSZXBvcnQocmVhc29uLmVsZW1lbnQpIH1cbiAgcmV0dXJuIHsgdGFyZ2V0OiByZWFzb24ucmVmLmlkLCBlbGVtZW50OiBudWxsIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZVRocmVhZFJlcG9ydCA9ICh0aHJlYWQ6IFdvcmtUaHJlYWQyKTogVGhyZWFkUmVwb3J0ID0+IHtcbiAgcmV0dXJuIHtcbiAgICB2aXNpdGVkOiBbLi4udGhyZWFkLnZpc2l0ZWRdLFxuICAgIG11c3RWaXNpdDogWy4uLnRocmVhZC5tdXN0VmlzaXRdLFxuICAgIG11c3RSZW5kZXI6IFsuLi50aHJlYWQubXVzdFJlbmRlcl0sXG4gICAgbWlzc2VkOiBbLi4udGhyZWFkLm1pc3NlZF0sXG5cbiAgICBwZW5kaW5nVGFza3M6IHRocmVhZC5wZW5kaW5nVGFza3MubWFwKGNyZWF0ZVdvcmtUYXNrUmVwb3J0KSxcbiAgICByZWFzb25zOiB0aHJlYWQucmVhc29ucy5tYXAoY3JlYXRlV29ya1JlYXNvblJlcG9ydCksXG4gICAgaWQ6IHRocmVhZC5pZCxcbiAgICBwYXNzZXM6IHRocmVhZC5wYXNzZXMsXG4gICAgZG9uZTogdGhyZWFkLmRvbmUsXG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgVHJlZVJlcG9ydCA9IHtcbiAgY29tbWl0czogQ29tbWl0UmVwb3J0W10sXG4gIHJvb3RzOiBDb21taXRJRFtdXG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVUcmVlUmVwb3J0ID0gKHRyZWU6IENvbW1pdFRyZWUyKSA9PiB7XG4gIGNvbnN0IHJlcG9ydDogVHJlZVJlcG9ydCA9IHsgY29tbWl0czogW10sIHJvb3RzOiBbXSB9O1xuXG4gIGZvciAoY29uc3QgY29tbWl0IG9mIHRyZWUuY29tbWl0cy52YWx1ZXMoKSkge1xuICAgIHJlcG9ydC5jb21taXRzLnB1c2goY3JlYXRlQ29tbWl0UmVwb3J0KGNvbW1pdCkpO1xuICB9XG4gIGZvciAoY29uc3Qgcm9vdCBvZiB0cmVlLnJvb3RzKSB7XG4gICAgcmVwb3J0LnJvb3RzLnB1c2gocm9vdCk7XG4gIH1cblxuICByZXR1cm4gcmVwb3J0O1xufVxuXG5leHBvcnQgY29uc3QgdXBkYXRlVHJlZVJlcG9ydCA9ICh0cmVlOiBUcmVlUmVwb3J0LCBkZWx0YTogRGVsdGFSZXBvcnQpID0+IHtcbiAgY29uc3QgY29tbWl0cyA9IG5ldyBNYXAodHJlZS5jb21taXRzLm1hcChjID0+IFtjLmlkLCBjXSkpO1xuICBjb25zdCByb290cyA9IG5ldyBTZXQodHJlZS5yb290cyk7XG5cbiAgZm9yIChjb25zdCBjb21taXQgb2YgZGVsdGEuY3JlYXRlZC52YWx1ZXMoKSkge1xuICAgIGNvbW1pdHMuc2V0KGNvbW1pdC5pZCwgY29tbWl0KTtcbiAgICBpZiAoY29tbWl0LnBhcmVudCA9PT0gbnVsbClcbiAgICAgIHJvb3RzLmFkZChjb21taXQuaWQpO1xuICB9XG4gIGZvciAoY29uc3QgY29tbWl0IG9mIGRlbHRhLnVwZGF0ZWQudmFsdWVzKCkpIHtcbiAgICBjb21taXRzLnNldChjb21taXQuaWQsIGNvbW1pdCk7XG4gIH1cbiAgZm9yIChjb25zdCBjb21taXQgb2YgZGVsdGEucmVtb3ZlZC52YWx1ZXMoKSkge1xuICAgIGNvbW1pdHMuZGVsZXRlKGNvbW1pdC5pZCk7XG4gICAgaWYgKGNvbW1pdC5wYXJlbnQgPT09IG51bGwpXG4gICAgICByb290cy5kZWxldGUoY29tbWl0LmlkKTtcbiAgfVxuXG4gIHRyZWUucm9vdHMgPSBbLi4ucm9vdHNdO1xuICB0cmVlLmNvbW1pdHMgPSBbLi4uY29tbWl0cy52YWx1ZXMoKV1cbn1cblxuIiwgImltcG9ydCB7IFNjaGVkdWxlciB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3QtcmVjb25cIjtcblxuZXhwb3J0IHR5cGUgU2NoZWR1bGVFdmVudEJ1cyA9IHtcbiAgb25JbnRlcmNlcHRFbmQoKTogdm9pZCxcbiAgb25JbnRlcmNlcHRTdGFydCgpOiB2b2lkLFxuXG4gIG9uQWZ0ZXJDYWxsYmFja0V4ZWN1dGUoKTogdm9pZCxcbn1cblxuZXhwb3J0IHR5cGUgU2NoZWR1bGVDb250cm9sbGVyID0ge1xuICBzdGVwKHN0cmlkZT86IG51bWJlcik6IHZvaWQsXG4gIGNhbmNlbEludGVyY2VwdCgpOiB2b2lkLFxuXG4gIGludGVyY2VwdDogYm9vbGVhbixcbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZURlYnVnU2NoZWR1bGVyID0gKGV2ZW50czogU2NoZWR1bGVFdmVudEJ1cywgc2NoZWR1bGVyTmFtZTogc3RyaW5nID0gXCJTY2hlZHVsZXJcIik6IFNjaGVkdWxlciAmIHsgY29udHJvbGxlcjogU2NoZWR1bGVDb250cm9sbGVyIH0gPT4gIHtcbiAgbGV0IGNhbGxiYWNrRnVuYyA9ICgpID0+IHt9O1xuICBsZXQgcGVuZGluZ19jYWxsYmFjayA9IGZhbHNlO1xuXG4gIGNvbnN0IHJ1biA9IChtYXhXb3JrID0gMTAwMDApID0+IHtcbiAgICBsZXQgd29ya0NvdW50ID0gMDtcbiAgICBjb25zdCBzdGFydE1hcmsgPSBwZXJmb3JtYW5jZS5tYXJrKGAke3NjaGVkdWxlck5hbWV9Ondvcms6c3RhcnRgKTtcblxuICAgIHdoaWxlIChwZW5kaW5nX2NhbGxiYWNrICYmIHdvcmtDb3VudCA8IG1heFdvcmspIHtcbiAgICAgIHBlbmRpbmdfY2FsbGJhY2sgPSBmYWxzZTtcbiAgICAgIGNhbGxiYWNrRnVuYygpO1xuICAgICAgZXZlbnRzLm9uQWZ0ZXJDYWxsYmFja0V4ZWN1dGUoKTtcbiAgICAgIHdvcmtDb3VudCsrO1xuXG4gICAgICBpZiAoY29udHJvbGxlci5pbnRlcmNlcHQgPT09IHRydWUpXG4gICAgICAgIHJldHVybiBldmVudHMub25JbnRlcmNlcHRTdGFydCgpO1xuICAgIH1cbiAgICBjb25zdCBlbmRNYXJrID0gcGVyZm9ybWFuY2UubWFyayhgJHtzY2hlZHVsZXJOYW1lfTp3b3JrOmVuZGApO1xuICAgIGNvbnN0IG1lYXN1cmVtZW50ID0gcGVyZm9ybWFuY2UubWVhc3VyZShgJHtzY2hlZHVsZXJOYW1lfTp3b3JrKCR7d29ya0NvdW50fSlgLCBzdGFydE1hcmsubmFtZSwgZW5kTWFyay5uYW1lKTtcbiAgICBcbiAgICBpZiAocGVuZGluZ19jYWxsYmFjaykge1xuICAgICAgdGltZW91dElkID0gd2luZG93LnNldFRpbWVvdXQob25UaW1lb3V0LCAwKTtcbiAgICB9IGVsc2VcbiAgICAgIHRpbWVvdXRJZCA9IG51bGw7XG4gIH1cblxuICBjb25zdCBjb250cm9sbGVyOiBTY2hlZHVsZUNvbnRyb2xsZXIgPSB7XG4gICAgaW50ZXJjZXB0OiBmYWxzZSxcbiAgICBjYW5jZWxJbnRlcmNlcHQoKSB7XG4gICAgICBjb250cm9sbGVyLmludGVyY2VwdCA9IGZhbHNlO1xuICAgICAgZXZlbnRzLm9uSW50ZXJjZXB0RW5kKCk7XG4gICAgICBydW4oKTtcbiAgICB9LFxuICAgIHN0ZXAoc3RyaWRlID0gMSkge1xuICAgICAgcnVuKHN0cmlkZSk7XG4gICAgICBpZiAoIXBlbmRpbmdfY2FsbGJhY2spIHtcbiAgICAgICAgZXZlbnRzLm9uSW50ZXJjZXB0RW5kKCk7XG4gICAgICAgIHRpbWVvdXRJZCA9IG51bGw7XG4gICAgICB9XG4gICAgfSxcbiAgfVxuICBjb25zdCBvblRpbWVvdXQgPSAoKSA9PiB7XG4gICAgaWYgKGNvbnRyb2xsZXIuaW50ZXJjZXB0KSB7XG4gICAgICBldmVudHMub25JbnRlcmNlcHRTdGFydCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBydW4oKTtcbiAgICB9XG4gIH1cblxuICBsZXQgdGltZW91dElkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICByZXR1cm4ge1xuICAgIGNvbnRyb2xsZXIsXG4gICAgc2V0Q2FsbGJhY2tGdW5jKGNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFja0Z1bmMgPSBjYWxsYmFjaztcbiAgICB9LFxuICAgIHJlcXVlc3RDYWxsYmFjaygpIHtcbiAgICAgIHBlbmRpbmdfY2FsbGJhY2sgPSB0cnVlO1xuXG4gICAgICBpZiAoIXRpbWVvdXRJZClcbiAgICAgICAgdGltZW91dElkID0gd2luZG93LnNldFRpbWVvdXQob25UaW1lb3V0LCAwKTtcbiAgICB9LFxuICAgIGNhbmNlbENhbGxiYWNrKCkge1xuICAgICAgcGVuZGluZ19jYWxsYmFjayA9IGZhbHNlO1xuICAgICAgaWYgKHRpbWVvdXRJZCkge1xuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRpbWVvdXRJZClcbiAgICAgICAgdGltZW91dElkID0gbnVsbDtcbiAgICAgIH1cbiAgICB9LFxuICAgIGlzQ2FsbGJhY2tQZW5kaW5nKCkge1xuICAgICAgcmV0dXJuIHBlbmRpbmdfY2FsbGJhY2s7XG4gICAgfSxcbiAgfVxufTsiLCAiaW1wb3J0IHsgQ29tbWl0SUQsIENvbW1pdFJlZjIsIENvbW1pdFRyZWUyLCBRdWV1ZVJlc3VsdCwgUmVjb25jaWxlcjIsIFNjaGVkdWxlciwgV29ya1JlYXNvbiwgV29ya1RocmVhZDIgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0LXJlY29uXCI7XG5pbXBvcnQgeyBjcmVhdGVEZWJ1Z1NjaGVkdWxlciwgU2NoZWR1bGVDb250cm9sbGVyLCBTY2hlZHVsZUV2ZW50QnVzIH0gZnJvbSBcIi4vc2NoZWR1bGVyXCI7XG5pbXBvcnQgeyBDb21taXREZXRhaWxzUmVwb3J0LCBjcmVhdGVDb21taXREZXRhaWxzUmVwb3J0LCBjcmVhdGVEZWx0YVJlcG9ydCwgY3JlYXRlVGhyZWFkUmVwb3J0LCBjcmVhdGVUcmVlUmVwb3J0LCBjcmVhdGVXb3JrUmVhc29uUmVwb3J0LCBjcmVhdGVXb3JrVGFza1JlcG9ydCwgRGVsdGFSZXBvcnQsIFRocmVhZFJlcG9ydCwgVHJlZVJlcG9ydCwgV29ya1JlYXNvblJlcG9ydCwgV29ya1Rhc2tSZXBvcnQgfSBmcm9tIFwiLi9yZXBvcnRcIjtcbmltcG9ydCB7IE5vZGUgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5cbmV4cG9ydCB0eXBlIFJlY29uY2lsZXJEZWJ1Z0V2ZW50QnVzID0ge1xuICBzY2hlZHVsZXI6IFNjaGVkdWxlRXZlbnRCdXMsXG4gIHRocmVhZDogRGVidWdXb3JrVGhyZWFkRXZlbnRCdXMsXG5cbiAgb25UaHJlYWREb25lKHRocmVhZDogVGhyZWFkUmVwb3J0LCBkZWx0YTogRGVsdGFSZXBvcnQpOiB2b2lkLFxufTtcbmV4cG9ydCB0eXBlIFJlY29uY2lsZXJEZWJ1Z0NvbnRyb2xsZXIgPSB7XG4gIHNjaGVkdWxlcjogU2NoZWR1bGVDb250cm9sbGVyLFxuXG4gIGdldFRyZWUoKTogVHJlZVJlcG9ydCxcbiAgZ2V0VGhyZWFkKCk6IFRocmVhZFJlcG9ydCxcbiAgZ2V0RGVsdGEoKTogRGVsdGFSZXBvcnQsXG5cbiAgZ2V0RGV0YWlscyhjb21taXRJZDogQ29tbWl0SUQpOiBDb21taXREZXRhaWxzUmVwb3J0IHwgbnVsbFxufVxuXG5leHBvcnQgY2xhc3MgRGVidWdSZWNvbmNpbGVyIGV4dGVuZHMgUmVjb25jaWxlcjIge1xuICBjb250cm9sbGVyOiBSZWNvbmNpbGVyRGVidWdDb250cm9sbGVyO1xuICBkZWJ1Z0J1czogUmVjb25jaWxlckRlYnVnRXZlbnRCdXM7XG5cbiAgc3RhcnRlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIGNvbnN0IGRlYnVnQnVzOiBSZWNvbmNpbGVyRGVidWdFdmVudEJ1cyA9IHtcbiAgICAgIHNjaGVkdWxlcjoge1xuICAgICAgICBvbkFmdGVyQ2FsbGJhY2tFeGVjdXRlKCkge30sXG4gICAgICAgIG9uSW50ZXJjZXB0U3RhcnQoKSB7fSxcbiAgICAgICAgb25JbnRlcmNlcHRFbmQoKSB7fSxcbiAgICAgIH0sXG4gICAgICB0aHJlYWQ6IHtcbiAgICAgICAgb25RdWV1ZSgpIHt9LFxuICAgICAgICBvblN0YXJ0UGFzcygpIHt9LFxuICAgICAgICBvbldvcmsoKSB7fSxcbiAgICAgICAgb25SZW5kZXIoKSB7fSxcbiAgICAgIH0sXG4gICAgICBvblRocmVhZERvbmUoKSB7fSxcbiAgICB9O1xuXG4gICAgY29uc3Qgc2NoZWR1bGVyID0gY3JlYXRlRGVidWdTY2hlZHVsZXIoZGVidWdCdXMuc2NoZWR1bGVyKTtcbiAgICBzdXBlcihzY2hlZHVsZXIpO1xuICAgIHRoaXMuZGVidWdCdXMgPSBkZWJ1Z0J1cztcbiAgICBcbiAgICBjb25zdCBtZSA9IHRoaXM7XG5cbiAgICB0aGlzLmNvbnRyb2xsZXIgPSB7XG4gICAgICBzY2hlZHVsZXI6IHNjaGVkdWxlci5jb250cm9sbGVyLFxuICAgICAgZ2V0VHJlZSgpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVRyZWVSZXBvcnQobWUudHJlZSlcbiAgICAgIH0sXG4gICAgICBnZXRUaHJlYWQoKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVUaHJlYWRSZXBvcnQobWUudGhyZWFkKVxuICAgICAgfSxcbiAgICAgIGdldERlbHRhKCkge1xuICAgICAgICByZXR1cm4gY3JlYXRlRGVsdGFSZXBvcnQobWUudGhyZWFkLmRlbHRhKTtcbiAgICAgIH0sXG4gICAgICBnZXREZXRhaWxzKGNvbW1pdElkKSB7XG4gICAgICAgIGNvbnN0IGNvbW1pdCA9IG1lLnRyZWUuY29tbWl0cy5nZXQoY29tbWl0SWQpO1xuICAgICAgICBpZiAoIWNvbW1pdClcbiAgICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgICAgICByZXR1cm4gY3JlYXRlQ29tbWl0RGV0YWlsc1JlcG9ydChjb21taXQsIG1lLnRyZWUpIHx8IG51bGw7XG4gICAgICB9XG4gICAgfTtcbiAgICB0aGlzLnRocmVhZCA9IG5ldyBEZWJ1Z1dvcmtUaHJlYWQodGhpcy50cmVlLCBkZWJ1Z0J1cy50aHJlYWQpOyBcbiAgfVxuICBzdWJtaXRUaHJlYWQoKTogdm9pZCB7XG4gICAgY29uc3Qgc3VibWl0dGVkVGhyZWFkID0gdGhpcy50aHJlYWQ7XG4gICAgY29uc3QgeyBpZCwgdmlzaXRlZCwgcGFzc2VzIH0gPSBzdWJtaXR0ZWRUaHJlYWQ7XG5cbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcbiAgICBjb25zdCBkZWx0YSA9IGNyZWF0ZURlbHRhUmVwb3J0KHN1Ym1pdHRlZFRocmVhZC5kZWx0YSk7XG4gICAgdGhpcy5kZWJ1Z0J1cy5vblRocmVhZERvbmUoY3JlYXRlVGhyZWFkUmVwb3J0KHN1Ym1pdHRlZFRocmVhZCksIGRlbHRhKVxuXG4gICAgLy8gU3RhcnQgYSBuZXcgdGhyZWFkXG4gICAgdGhpcy50aHJlYWQgPSBuZXcgRGVidWdXb3JrVGhyZWFkKHRoaXMudHJlZSwgdGhpcy5kZWJ1Z0J1cy50aHJlYWQpO1xuXG4gICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG5cbiAgICAvLyBzZW5kIGRlbHRhIHJlYWR5XG4gICAgdGhpcy5idXMucmVuZGVyKHN1Ym1pdHRlZFRocmVhZC5kZWx0YSk7XG5cbiAgICAvLyBydW4gZWZmZWN0c1xuICAgIGZvciAoY29uc3QgY2xlYW51cCBvZiBzdWJtaXR0ZWRUaHJlYWQuZGVsdGEuY2xlYW51cHMudmFsdWVzKCkpXG4gICAgICBjbGVhbnVwLmZ1bmMoKTtcbiAgICBmb3IgKGNvbnN0IGVmZmVjdCBvZiBzdWJtaXR0ZWRUaHJlYWQuZGVsdGEuZWZmZWN0cy52YWx1ZXMoKSlcbiAgICAgIGVmZmVjdC5mdW5jKCk7XG5cbiAgICBmb3IgKGNvbnN0IHJlbW92ZSBvZiBzdWJtaXR0ZWRUaHJlYWQuZGVsdGEucmVtb3ZlZC52YWx1ZXMoKSlcbiAgICAgIHRoaXMucG9vbHMuY29tbWl0LnJlbGVhc2UocmVtb3ZlKTtcbiAgICBcbiAgICBcbiAgICBwZXJmb3JtYW5jZS5tYXJrKGByZWNvbmNpbGVyOnRocmVhZCgke2lkfSk6ZW5kYCk7XG4gICAgcGVyZm9ybWFuY2UubWVhc3VyZShgcmVjb25jaWxlcjp0aHJlYWQoJHtpZH0sIHZpc2l0ZWQ9JHt2aXNpdGVkLnNpemV9KWAsXG4gICAgICBgcmVjb25jaWxlcjp0aHJlYWQoJHtpZH0pOnN0YXJ0YCxcbiAgICAgIGByZWNvbmNpbGVyOnRocmVhZCgke2lkfSk6ZW5kYCxcbiAgICApXG4gICAgY29uc29sZS5pbmZvKGBbUmVjb25jaWxlcl0gVGhyZWFkICR7aWR9IHZpc2l0ZWQgJHt2aXNpdGVkLnNpemV9IG5vZGVzLCBpbiAke3Bhc3Nlc30gcGFzc2VzYCk7XG4gIH1cblxuICBtb3VudChub2RlOiBOb2RlKSB7XG4gICAgaWYgKCF0aGlzLnN0YXJ0ZWQpIHtcbiAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XG4gICAgICBwZXJmb3JtYW5jZS5tYXJrKGByZWNvbmNpbGVyOnRocmVhZCgke3RoaXMudGhyZWFkLmlkfSk6c3RhcnRgKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cGVyLm1vdW50KG5vZGUpO1xuICB9XG4gIHVubW91bnQocmVmOiBDb21taXRSZWYyKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnN0YXJ0ZWQpIHtcbiAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XG4gICAgICBwZXJmb3JtYW5jZS5tYXJrKGByZWNvbmNpbGVyOnRocmVhZCgke3RoaXMudGhyZWFkLmlkfSk6c3RhcnRgKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cGVyLnVubW91bnQocmVmKTtcbiAgfVxuICByZW5kZXIocmVmOiBDb21taXRSZWYyKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnN0YXJ0ZWQpIHtcbiAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XG4gICAgICBwZXJmb3JtYW5jZS5tYXJrKGByZWNvbmNpbGVyOnRocmVhZCgke3RoaXMudGhyZWFkLmlkfSk6c3RhcnRgKTtcbiAgICB9XG4gICAgc3VwZXIucmVuZGVyKHJlZik7XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgRGVidWdXb3JrVGhyZWFkRXZlbnRCdXMgPSB7XG4gIG9uV29yayhwcmV2VGFzazogbnVsbCB8IFdvcmtUYXNrUmVwb3J0LCBuZXh0VGFzazogbnVsbCB8IFdvcmtUYXNrUmVwb3J0LCBkb25lOiBib29sZWFuKTogdm9pZCxcbiAgb25SZW5kZXIoKTogdm9pZCxcblxuICBvblN0YXJ0UGFzcygpOiB2b2lkLFxuICBvblF1ZXVlKHJlYXNvbjogV29ya1JlYXNvblJlcG9ydCwgcmVzdWx0OiBRdWV1ZVJlc3VsdCk6IHZvaWQsXG59XG5cbmV4cG9ydCBjbGFzcyBEZWJ1Z1dvcmtUaHJlYWQgZXh0ZW5kcyBXb3JrVGhyZWFkMiB7XG4gIGRlYnVnQnVzOiBEZWJ1Z1dvcmtUaHJlYWRFdmVudEJ1cztcblxuICBjb25zdHJ1Y3Rvcih0cmVlOiBDb21taXRUcmVlMiwgZGVidWdCdXM6IERlYnVnV29ya1RocmVhZEV2ZW50QnVzKSB7XG4gICAgc3VwZXIodHJlZSk7XG4gICAgdGhpcy5kZWJ1Z0J1cyA9IGRlYnVnQnVzO1xuICB9XG5cbiAgd29yaygpOiB2b2lkIHtcbiAgICBjb25zdCBwcmV2VGFzayA9IHRoaXMucGVuZGluZ1Rhc2tzW3RoaXMucGVuZGluZ1Rhc2tzLmxlbmd0aCAtIDFdO1xuICAgIHN1cGVyLndvcmsoKTtcbiAgICBjb25zdCBuZXh0VGFzayA9IHRoaXMucGVuZGluZ1Rhc2tzW3RoaXMucGVuZGluZ1Rhc2tzLmxlbmd0aCAtIDFdO1xuICAgIHRoaXMuZGVidWdCdXMub25Xb3JrKFxuICAgICAgcHJldlRhc2sgJiYgY3JlYXRlV29ya1Rhc2tSZXBvcnQocHJldlRhc2spIHx8IG51bGwsXG4gICAgICBuZXh0VGFzayAmJiBjcmVhdGVXb3JrVGFza1JlcG9ydChuZXh0VGFzaykgfHwgbnVsbCxcbiAgICAgIHRoaXMuZG9uZVxuICAgIClcbiAgfVxuXG4gIHF1ZXVlKHJlYXNvbjogV29ya1JlYXNvbik6IFF1ZXVlUmVzdWx0IHtcbiAgICBjb25zdCByZXN1bHQgPSBzdXBlci5xdWV1ZShyZWFzb24pO1xuXG4gICAgdGhpcy5kZWJ1Z0J1cy5vblF1ZXVlKGNyZWF0ZVdvcmtSZWFzb25SZXBvcnQocmVhc29uKSwgcmVzdWx0KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBzdGFydE5leHRQYXNzKCk6IHZvaWQge1xuXG4gICAgc3VwZXIuc3RhcnROZXh0UGFzcygpXG4gICAgdGhpcy5kZWJ1Z0J1cy5vblN0YXJ0UGFzcygpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQ29tcG9uZW50LCBoLCB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAnQGx1a2VrYWFsaW0vYWN0JztcbmltcG9ydCB7IFJlY29uY2lsZXJEZWJ1Z0NvbnRyb2xsZXIsIFJlY29uY2lsZXJEZWJ1Z0V2ZW50QnVzLCBTY2hlZHVsZUNvbnRyb2xsZXIsIFNjaGVkdWxlRXZlbnRCdXMgfSBmcm9tICdAbHVrZWthYWxpbS9hY3QtZGVidWcnO1xuaW1wb3J0IHsgSW5zaWdodEFwcFN0YXRlIH0gZnJvbSAnLi9JbnNpZ2h0QXBwJztcblxuZXhwb3J0IHR5cGUgU2NoZWR1bGVDb250cm9sc1Byb3BzID0ge1xuICBjb250cm9sbGVyOiBTY2hlZHVsZUNvbnRyb2xsZXIsXG4gIGJ1czogU2NoZWR1bGVFdmVudEJ1cyxcblxuICByZWNvbmNpbGVyOiBSZWNvbmNpbGVyRGVidWdDb250cm9sbGVyLFxuXG4gIHN0YXRlOiBJbnNpZ2h0QXBwU3RhdGUsXG4gIG9uU3RhdGVDaGFuZ2U/OiAobmV3U3RhdGU6IEluc2lnaHRBcHBTdGF0ZSkgPT4gdm9pZCxcbn07XG5cbmV4cG9ydCBjb25zdCBTY2hlZHVsZUNvbnRyb2xzOiBDb21wb25lbnQ8U2NoZWR1bGVDb250cm9sc1Byb3BzPiA9ICh7IGNvbnRyb2xsZXIsIGJ1cywgcmVjb25jaWxlciwgc3RhdGUsIG9uU3RhdGVDaGFuZ2UgPSAoKSA9PiB7fSB9KSA9PiB7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYnVzLm9uSW50ZXJjZXB0U3RhcnQgPSAoKSA9PiB7XG4gICAgICBvblN0YXRlQ2hhbmdlKHsgLi4uc3RhdGUsIHBhdXNlZDogdHJ1ZSB9KTtcbiAgICAgIC8vb25QYXVzZUNoYW5nZShmYWxzZSlcbiAgICB9XG4gICAgYnVzLm9uSW50ZXJjZXB0RW5kID0gKCkgPT4ge1xuICAgICAgb25TdGF0ZUNoYW5nZSh7IC4uLnN0YXRlLCBwYXVzZWQ6IGZhbHNlIH0pO1xuICAgICAgLy9vblBhdXNlQ2hhbmdlKGZhbHNlKVxuICAgIH1cbiAgICBidXMub25BZnRlckNhbGxiYWNrRXhlY3V0ZSA9ICgpID0+IHtcbiAgICAgIC8vcmVjb25jaWxlci5nZXRUaHJlYWQoKTtcbiAgICB9XG4gIH0sIFtidXMsIHJlY29uY2lsZXIsIHN0YXRlXSlcblxuXG4gIGNvbnN0IG9uU3RlcENsaWNrID0gKCkgPT4ge1xuICAgIGNvbnRyb2xsZXIuc3RlcCgpO1xuICB9XG4gIGNvbnN0IG9uUmVzdW1lQ2xpY2sgPSAoKSA9PiB7XG4gICAgY29udHJvbGxlci5jYW5jZWxJbnRlcmNlcHQoKTtcbiAgfVxuICBjb25zdCBvbkNoYW5nZUJyZWFrQmVmb3JlVXBkYXRlID0gKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgIG9uU3RhdGVDaGFuZ2UoeyAuLi5zdGF0ZSwgYnJlYWtPbkJlZm9yZVVwZGF0ZTogKGV2ZW50LnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50KS5jaGVja2VkIH0pO1xuICB9XG4gIGNvbnN0IG9uQ2hhbmdlQnJlYWtBZnRlclVwZGF0ZSA9IChldmVudDogRXZlbnQpID0+IHtcbiAgICBvblN0YXRlQ2hhbmdlKHsgLi4uc3RhdGUsIGJyZWFrT25BZnRlclVwZGF0ZTogKGV2ZW50LnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50KS5jaGVja2VkIH0pO1xuICB9XG5cbiAgcmV0dXJuIGgoJ2RpdicsIHsgc3R5bGU6IHsgYmFja2dyb3VuZDogc3RhdGUucGF1c2VkID8gJ3JlZCcgOiAnd2hpdGUnLCBwYWRkaW5nOiAnOHB4JywgZGlzcGxheTogJ2ZsZXgnLCBnYXA6ICcxMnB4JyB9fSwgW1xuICAgIGgoJ2RpdicsIHsgc3R5bGU6IHsgZGlzcGxheTogJ2ZsZXgnLCAnZmxleC1kaXJlY3Rpb24nOiAnY29sdW1uJyB9IH0sIFtcbiAgICAgIGgoJ2xhYmVsJywgeyBzdHlsZTogeyAnbWFyZ2luJzogJ2F1dG8gMCcgfSB9LCBbXG4gICAgICAgIGgoJ3NwYW4nLCB7fSwgYEJyZWFrIEJlZm9yZSBVcGRhdGVgKSxcbiAgICAgICAgaCgnaW5wdXQnLCB7IHR5cGU6ICdjaGVja2JveCcsIGNoZWNrZWQ6IHN0YXRlLmJyZWFrT25CZWZvcmVVcGRhdGUsIG9uQ2hhbmdlOiBvbkNoYW5nZUJyZWFrQmVmb3JlVXBkYXRlIH0pLFxuICAgICAgXSksXG4gICAgICBoKCdsYWJlbCcsIHsgc3R5bGU6IHsgJ21hcmdpbic6ICdhdXRvIDAnIH0gfSwgW1xuICAgICAgICBoKCdzcGFuJywge30sIGBCcmVhayBBZnRlciBVcGRhdGVgKSxcbiAgICAgICAgaCgnaW5wdXQnLCB7IHR5cGU6ICdjaGVja2JveCcsIGNoZWNrZWQ6IHN0YXRlLmJyZWFrT25BZnRlclVwZGF0ZSwgb25DaGFuZ2U6IG9uQ2hhbmdlQnJlYWtBZnRlclVwZGF0ZSB9KSxcbiAgICAgIF0pLFxuICAgIF0pLFxuICAgIGgoJ2J1dHRvbicsIHsgb25DbGljazogb25TdGVwQ2xpY2ssIGRpc2FibGVkOiAhc3RhdGUucGF1c2VkLCBzdHlsZTogeyBwYWRkaW5nOiAnOHB4JyB9IH0sICdTdGVwJyksXG4gICAgaCgnYnV0dG9uJywgeyBvbkNsaWNrOiBvblJlc3VtZUNsaWNrLCBkaXNhYmxlZDogIXN0YXRlLnBhdXNlZCwgc3R5bGU6IHsgcGFkZGluZzogJzhweCcgfSB9LCAnUmVzdW1lJyksXG4gICAgaCgnc3BhbicsIHtcbiAgICAgIHN0eWxlOiB7IGJvcmRlcjogYDJweCBzb2xpZCAke3N0YXRlLnBhdXNlZCA/ICdvcmFuZ2UnIDogJ2JsYWNrJ31gLCAnYm9yZGVyLXJhZGl1cyc6ICc4cHgnLCBwYWRkaW5nOiAnOHB4JyB9XG4gICAgfSwgc3RhdGUucGF1c2VkID8gYFBhdXNlZGAgOiBgUmVhZHlgKSxcbiAgXSlcbn07IiwgImltcG9ydCB7IENvbW1pdFJlcG9ydCwgRGVsdGFSZXBvcnQsIEVsZW1lbnRSZXBvcnQsIFRocmVhZFJlcG9ydCwgVHJlZVJlcG9ydCwgV29ya1Rhc2tSZXBvcnQgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0LWRlYnVnXCI7XG5pbXBvcnQgeyBDb21taXRJRCwgQ29tbWl0VmVyc2lvbiwgV29ya1RocmVhZDIgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0LXJlY29uXCI7XG5cbmV4cG9ydCBjbGFzcyBNdXRhYmxlQ29tbWl0UmVmIHtcbiAgZWxlbWVudDogRWxlbWVudFJlcG9ydDtcbiAgaWQ6IENvbW1pdElEO1xuICB2ZXJzaW9uOiBDb21taXRWZXJzaW9uO1xuICBkaXN0YW5jZTogbnVtYmVyO1xuXG4gIHJlcG9ydDogQ29tbWl0UmVwb3J0O1xuXG4gIGNoaWxkcmVuOiBNdXRhYmxlQ29tbWl0UmVmW10gPSBbXTtcbiAgcGFyZW50OiBudWxsIHwgTXV0YWJsZUNvbW1pdFJlZiA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoY29tbWl0OiBDb21taXRSZXBvcnQpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBjb21taXQuZWxlbWVudDtcbiAgICB0aGlzLmlkID0gY29tbWl0LmlkO1xuICAgIHRoaXMudmVyc2lvbiA9IGNvbW1pdC52ZXJzaW9uO1xuICAgIHRoaXMuZGlzdGFuY2UgPSBjb21taXQuZGlzdGFuY2U7XG5cbiAgICB0aGlzLnJlcG9ydCA9IGNvbW1pdDtcbiAgfVxuXG4gIHVwZGF0ZShjb21taXQ6IENvbW1pdFJlcG9ydCkge1xuICAgIHRoaXMucmVwb3J0ID0gY29tbWl0O1xuICAgIHRoaXMudmVyc2lvbiA9IGNvbW1pdC52ZXJzaW9uO1xuICAgIHRoaXMuZWxlbWVudCA9IGNvbW1pdC5lbGVtZW50O1xuICB9XG5cbiAgcmVzb2x2ZShsb29rdXBNYXA6IE1hcDxDb21taXRJRCwgTXV0YWJsZUNvbW1pdFJlZj4pIHtcbiAgICBpZiAodGhpcy5yZXBvcnQucGFyZW50KVxuICAgICAgdGhpcy5saW5rUGFyZW50KHRoaXMucmVwb3J0LnBhcmVudCwgbG9va3VwTWFwKTtcbiAgICB0aGlzLmxpbmtDaGlsZHJlbih0aGlzLnJlcG9ydC5jaGlsZHJlbiwgbG9va3VwTWFwKTtcbiAgfVxuXG4gIGxpbmtQYXJlbnQocGFyZW50OiBDb21taXRJRCwgbG9va3VwTWFwOiBNYXA8Q29tbWl0SUQsIE11dGFibGVDb21taXRSZWY+KSB7XG4gICAgdGhpcy5wYXJlbnQgPSBsb29rdXBNYXAuZ2V0KHBhcmVudCkgfHwgbnVsbDtcbiAgfVxuICBsaW5rQ2hpbGRyZW4oY2hpbGRyZW46IENvbW1pdElEW10sIGxvb2t1cE1hcDogTWFwPENvbW1pdElELCBNdXRhYmxlQ29tbWl0UmVmPikge1xuICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbi5tYXAoYyA9PiBsb29rdXBNYXAuZ2V0KGMpKS5maWx0ZXIoeCA9PiAhIXgpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb21taXRMb29rdXBDYWNoZSB7XG4gIG1hcDogTWFwPENvbW1pdElELCBDb21taXRSZXBvcnQ+ID0gbmV3IE1hcCgpO1xuICByb290czogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcblxuICBzZXRUcmVlKHRyZWU6IFRyZWVSZXBvcnQpIHtcbiAgICB0aGlzLm1hcC5jbGVhcigpO1xuICAgIHRoaXMucm9vdHMuY2xlYXIoKTtcblxuICAgIGZvciAoY29uc3QgY29tbWl0IG9mIHRyZWUuY29tbWl0cykge1xuICAgICAgdGhpcy5tYXAuc2V0KGNvbW1pdC5pZCwgY29tbWl0KVxuICAgICAgaWYgKCFjb21taXQucGFyZW50KVxuICAgICAgICB0aGlzLnJvb3RzLmFkZChjb21taXQuaWQpO1xuICAgIH1cbiAgfVxuXG4gIGluZ2VzdChkZWx0YTogRGVsdGFSZXBvcnQpIHtcbiAgICBmb3IgKGNvbnN0IGNyZWF0ZSBvZiBkZWx0YS5jcmVhdGVkKSB7XG4gICAgICB0aGlzLm1hcC5zZXQoY3JlYXRlLmlkLCBjcmVhdGUpO1xuICAgICAgaWYgKCFjcmVhdGUucGFyZW50KVxuICAgICAgICB0aGlzLnJvb3RzLmFkZChjcmVhdGUuaWQpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHVwZGF0ZSBvZiBkZWx0YS51cGRhdGVkKVxuICAgICAgdGhpcy5tYXAuc2V0KHVwZGF0ZS5pZCwgdXBkYXRlKTtcbiAgICBmb3IgKGNvbnN0IHJlbW92ZSBvZiBkZWx0YS5yZW1vdmVkKSB7XG4gICAgICB0aGlzLm1hcC5kZWxldGUocmVtb3ZlLmlkKTtcbiAgICAgIHRoaXMucm9vdHMuZGVsZXRlKHJlbW92ZS5pZCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQSBidW5jaCBvZiByZWxldmFudCBkYXRhIGZvciBhIFRyZWUgaW4gdGhlIHByb2dyZXNzIG9mIGNoYW5naW5nXG4gKi9cbmV4cG9ydCBjbGFzcyBUaHJlYWRMb29rdXBDYWNoZSB7XG4gIGNhbm9uOiBDb21taXRMb29rdXBDYWNoZTtcblxuICByZXBvcnQ6IERlbHRhUmVwb3J0IHwgbnVsbCA9IG51bGw7XG4gIHRocmVhZDogVGhyZWFkUmVwb3J0IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoY2Fub246IENvbW1pdExvb2t1cENhY2hlKSB7XG4gICAgdGhpcy5jYW5vbiA9IGNhbm9uO1xuICB9XG5cbiAgcm9vdHM6IFNldDxDb21taXRJRD4gPSBuZXcgU2V0KCk7XG5cbiAgY3JlYXRlZDogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcbiAgdXBkYXRlZDogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcbiAgcmVtb3ZlZDogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcblxuICAvKipcbiAgICogQW4gdXAgdG8gZGF0ZSBtYXAgb2YgdGhlIHRyZWUsIHBsdXMgZGVsZXRlZCBub3RlcyBpbiB0aGlzIGRlbHRhXG4gICAqL1xuICBhbGw6IE1hcDxDb21taXRJRCwgQ29tbWl0UmVwb3J0PiA9IG5ldyBNYXAoKTtcblxuICBuZXh0VGFzazogV29ya1Rhc2tSZXBvcnQgfCBudWxsID0gbnVsbDtcbiAgcHJldlRhc2s6IFdvcmtUYXNrUmVwb3J0IHwgbnVsbCA9IG51bGw7XG4gIFxuICBhbGxUYXNrczogTWFwPENvbW1pdElELCBXb3JrVGFza1JlcG9ydD4gPSBuZXcgTWFwKCk7XG5cbiAgdGFyZ2V0czogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcbiAgdmlzaXRlZDogU2V0PENvbW1pdElEPiA9IG5ldyBTZXQoKTtcblxuICAvKipcbiAgICogQ2xlYXIgdGhlIGRlbHRhIGNhY2hlXG4gICAqL1xuICByZXNldCgpIHtcbiAgICB0aGlzLnJvb3RzID0gbmV3IFNldCh0aGlzLmNhbm9uLnJvb3RzKVxuICAgIHRoaXMuYWxsID0gbmV3IE1hcCh0aGlzLmNhbm9uLm1hcCk7XG4gICAgdGhpcy5hbGxUYXNrcyA9IG5ldyBNYXAoKTtcblxuICAgIHRoaXMubmV4dFRhc2sgPSBudWxsO1xuICAgIHRoaXMucHJldlRhc2sgPSBudWxsO1xuICAgIHRoaXMucmVwb3J0ID0gbnVsbDtcblxuICAgIHRoaXMuY3JlYXRlZC5jbGVhcigpO1xuICAgIHRoaXMudXBkYXRlZC5jbGVhcigpO1xuICAgIHRoaXMucmVtb3ZlZC5jbGVhcigpO1xuXG4gICAgdGhpcy50YXJnZXRzLmNsZWFyKCk7XG4gICAgdGhpcy52aXNpdGVkLmNsZWFyKCk7XG4gIH1cblxuICBpbmdlc3RUaHJlYWQodGhyZWFkOiBUaHJlYWRSZXBvcnQpIHtcbiAgICB0aGlzLnRocmVhZCA9IHRocmVhZDtcblxuICAgIHRoaXMubmV4dFRhc2sgPSB0aHJlYWQucGVuZGluZ1Rhc2tzW3RocmVhZC5wZW5kaW5nVGFza3MubGVuZ3RoIC0gMV07XG4gICAgdGhpcy50YXJnZXRzID0gbmV3IFNldCh0aHJlYWQucmVhc29ucy5tYXAocmVhc29uID0+IHJlYXNvbi50YXJnZXQpKTtcbiAgICB0aGlzLnZpc2l0ZWQgPSBuZXcgU2V0KHRocmVhZC52aXNpdGVkKVxuICAgIHRoaXMuYWxsVGFza3MgPSBuZXcgTWFwKHRocmVhZC5wZW5kaW5nVGFza3MubWFwKHRhc2sgPT4gW3Rhc2suaWQsIHRhc2tdKSlcbiAgfVxuXG4gIGluZ2VzdERlbHRhKGRlbHRhOiBEZWx0YVJlcG9ydCkge1xuICAgIHRoaXMucmVwb3J0ID0gZGVsdGE7XG4gICAgY29uc3QgY3JlYXRlZElkcyA9IG5ldyBTZXQoZGVsdGEuY3JlYXRlZC5tYXAoYyA9PiBjLmlkKSk7XG5cbiAgICBmb3IgKGNvbnN0IGNvbW1pdCBvZiBkZWx0YS5jcmVhdGVkKSB7XG4gICAgICB0aGlzLmNyZWF0ZWQuYWRkKGNvbW1pdC5pZClcblxuICAgICAgY29uc3QgY2hpbGRyZW4gPSBbLi4ubmV3IFNldChjb21taXQuY2hpbGRyZW4uZmlsdGVyKGMgPT4gdGhpcy5hbGwuaGFzKGMpIHx8IGNyZWF0ZWRJZHMuaGFzKGMpKSldXG4gICAgICB0aGlzLmFsbC5zZXQoY29tbWl0LmlkLCB7IC4uLmNvbW1pdCwgY2hpbGRyZW4gfSk7XG5cbiAgICAgIGlmICghY29tbWl0LnBhcmVudClcbiAgICAgICAgdGhpcy5yb290cy5hZGQoY29tbWl0LmlkKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBjb21taXQgb2YgZGVsdGEudXBkYXRlZCkge1xuICAgICAgY29uc3QgZXhpc3RpbmdDb21taXQgPSB0aGlzLmNhbm9uLm1hcC5nZXQoY29tbWl0LmlkKSBhcyBDb21taXRSZXBvcnQ7XG5cbiAgICAgIGNvbnN0IGNoaWxkcmVuID0gWy4uLm5ldyBTZXQoW1xuICAgICAgICAuLi5jb21taXQuY2hpbGRyZW4uZmlsdGVyKGMgPT4gdGhpcy5hbGwuaGFzKGMpKSxcbiAgICAgICAgLi4uZXhpc3RpbmdDb21taXQuY2hpbGRyZW4sXG4gICAgICBdKV1cbiAgICAgIGNvbnN0IG1lcmdlZENvbW1pdFJlcG9ydCA9IHsgLi4uY29tbWl0LCBjaGlsZHJlbiB9O1xuXG4gICAgICB0aGlzLnVwZGF0ZWQuYWRkKGNvbW1pdC5pZClcbiAgICAgIHRoaXMuYWxsLnNldChjb21taXQuaWQsIG1lcmdlZENvbW1pdFJlcG9ydClcbiAgICB9XG4gICAgZm9yIChjb25zdCBjb21taXQgb2YgZGVsdGEucmVtb3ZlZCkge1xuICAgICAgdGhpcy5yZW1vdmVkLmFkZChjb21taXQuaWQpO1xuICAgICAgdGhpcy5hbGwuc2V0KGNvbW1pdC5pZCwgY29tbWl0KTtcbiAgICB9XG4gIH1cblxuICBnZXRGbGF0KCkge1xuICAgIGNvbnN0IHBlbmRpbmc6IENvbW1pdFJlcG9ydFtdID0gWy4uLnRoaXMucm9vdHMudmFsdWVzKCldXG4gICAgICAubWFwKHJvb3QgPT4gdGhpcy5hbGwuZ2V0KHJvb3QpKVxuICAgICAgLmZpbHRlcih4ID0+ICEheCk7XG5cbiAgICBjb25zdCBmbGF0OiBDb21taXRSZXBvcnRbXSA9IFtdO1xuICAgIFxuICAgIHdoaWxlIChwZW5kaW5nLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGNvbW1pdCA9IHBlbmRpbmcucG9wKCkgYXMgQ29tbWl0UmVwb3J0O1xuICAgICAgZmxhdC5wdXNoKGNvbW1pdCk7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkSWQgb2YgWy4uLmNvbW1pdC5jaGlsZHJlbl0ucmV2ZXJzZSgpKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkID0gdGhpcy5hbGwuZ2V0KGNoaWxkSWQpO1xuICAgICAgICBpZiAoY2hpbGQpXG4gICAgICAgICAgcGVuZGluZy5wdXNoKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmxhdDtcbiAgfVxufSIsICJpbXBvcnQgeyBDb21wb25lbnQsIGgsIE5vZGUsIFJlYWRvbmx5UmVmLCB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5pbXBvcnQgeyBkZWJvdW5jZSB9IGZyb20gJ2xvZGFzaC1lcyc7XG5cbmV4cG9ydCB0eXBlIFZpcnR1YWxUcmVlSXRlbSA9IHtcbiAgZGVwdGg6IG51bWJlcixcblxufVxuXG5leHBvcnQgdHlwZSBWaXJ0dWFsVHJlZVByb3BzID0ge1xuICBjaHVua1NpemU6IG51bWJlcixcbiAgY2h1bmtDb3VudDogbnVtYmVyLFxuXG4gIHdpbmRvd1JhbmdlOiBudW1iZXIsXG5cbiAgcmVuZGVyQ2h1bmsoaW5kZXg6IG51bWJlcik6IE5vZGUsXG5cbiAgdmlld3BvcnRSZWY/OiBSZWFkb25seVJlZjxIVE1MRWxlbWVudCB8IG51bGw+LFxufVxuXG5leHBvcnQgY29uc3QgVmlydHVhbDFEOiBDb21wb25lbnQ8VmlydHVhbFRyZWVQcm9wcz4gPSAoeyBjaHVua1NpemUsIGNodW5rQ291bnQsIHJlbmRlckNodW5rLCB2aWV3cG9ydFJlZjogcHJvcFZpZXdwb3J0UmVmLCB3aW5kb3dSYW5nZSB9KSA9PiB7XG4gIGNvbnN0IFtzdGFydCwgc2V0U3RhcnRdID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtlbmQsIHNldEVuZF0gPSB1c2VTdGF0ZSgwKTtcblxuICBjb25zdCBsb2NhbFZpZXdwb3J0UmVmID0gdXNlUmVmPEhUTUxFbGVtZW50IHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IHZpZXdwb3J0UmVmID0gcHJvcFZpZXdwb3J0UmVmIHx8IGxvY2FsVmlld3BvcnRSZWY7XG5cbiAgY29uc3QgbGlzdFJlZiA9IHVzZVJlZjxIVE1MRWxlbWVudCB8IG51bGw+KG51bGwpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCF2aWV3cG9ydFJlZi5jdXJyZW50KVxuICAgICAgcmV0dXJuO1xuXG4gICAgY29uc3Qgdmlld3BvcnQgPSB2aWV3cG9ydFJlZi5jdXJyZW50O1xuXG4gICAgY29uc3Qgc2V0Vmlld3BvcnQgPSAoKSA9PiB7XG4gICAgICBjb25zdCByZWN0ID0gdmlld3BvcnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgIHNldFN0YXJ0KE1hdGguZmxvb3IoKHZpZXdwb3J0LnNjcm9sbFRvcCkgLyBjaHVua1NpemUpKVxuICAgICAgc2V0RW5kKE1hdGguY2VpbCgodmlld3BvcnQuc2Nyb2xsVG9wICsgcmVjdC5oZWlnaHQpIC8gY2h1bmtTaXplKSlcbiAgICB9O1xuICAgIHNldFZpZXdwb3J0KCk7XG5cbiAgICB2aWV3cG9ydC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBzZXRWaWV3cG9ydClcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgdmlld3BvcnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgc2V0Vmlld3BvcnQpXG4gICAgfVxuICB9LCBbcHJvcFZpZXdwb3J0UmVmXSlcblxuICBjb25zdCByZW5kZXJlZEluZGljZXMgPSBBcnJheVxuICAgIC5mcm9tKHsgbGVuZ3RoOiBlbmQgLSBzdGFydCB9KVxuICAgIC5tYXAoKF8sIGkpID0+IHN0YXJ0ICsgaSlcbiAgICAuZmlsdGVyKHggPT4geCA+PSAwICYmIHggPCBjaHVua0NvdW50KTtcbiAgICBcblxuICByZXR1cm4gW1xuICAgIC8vaCgncHJlJywge30sIHJlbmRlcmVkSW5kaWNlcy5qb2luKCcsICcpKSxcbiAgICBoKCdkaXYnLCB7IHJlZjogdmlld3BvcnRSZWYsIHN0eWxlOiB7IG92ZXJmbG93OiAnYXV0bycsIGhlaWdodDogJzEwMCUnIH0gfSxcbiAgICAgIGgoJ2RpdicsIHsgcmVmOiBsaXN0UmVmLCBzdHlsZTogeyBoZWlnaHQ6IChjaHVua1NpemUgKiBjaHVua0NvdW50KSArICdweCcsIHBvc2l0aW9uOiAncmVsYXRpdmUnIH0gfSxcbiAgICAgICAgcmVuZGVyZWRJbmRpY2VzLm1hcChpbmRleCA9PlxuICAgICAgICAgIGgoJ2RpdicsIHsgc3R5bGU6IHsgcG9zaXRpb246ICdhYnNvbHV0ZScsIHRvcDogKGluZGV4ICogY2h1bmtTaXplKSArICdweCcsIGhlaWdodDogY2h1bmtTaXplLCBwYWRkaW5nOiAnLTEnLCBib3JkZXI6ICcxcHggZG90dGVkIGJsYWNrJywgd2lkdGg6ICcxMDAlJyB9fSxcbiAgICAgICAgICAgIHJlbmRlckNodW5rKGluZGV4KSkpXG4gICAgKSlcbiAgXTtcbn07IiwgImltcG9ydCB7IENvbXBvbmVudCwgaCwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAnQGx1a2VrYWFsaW0vYWN0JztcbmltcG9ydCB7IENvbW1pdERldGFpbHNSZXBvcnQsIENvbW1pdFJlcG9ydCwgRGVsdGFSZXBvcnQsIFJlY29uY2lsZXJEZWJ1Z0NvbnRyb2xsZXIsIFJlY29uY2lsZXJEZWJ1Z0V2ZW50QnVzLCBUaHJlYWRSZXBvcnQsIHVwZGF0ZVRyZWVSZXBvcnQsIFZhbHVlUmVwb3J0LCBXb3JrVGFza1JlcG9ydCB9IGZyb20gJ0BsdWtla2FhbGltL2FjdC1kZWJ1Zyc7XG5pbXBvcnQgeyBDb21taXRJRCB9IGZyb20gJ0BsdWtla2FhbGltL2FjdC1yZWNvbic7XG5pbXBvcnQgeyBDb21taXRQcmV2aWV3LCBUcmVlVmlld2VyIH0gZnJvbSAnLi9UcmVlVmlld2VyJztcbmltcG9ydCB7IFNjaGVkdWxlQ29udHJvbHMgfSBmcm9tICcuL1NjaGVkdWxlQ29udHJvbHMnO1xuaW1wb3J0IHsgQ29tbWl0TG9va3VwQ2FjaGUsIFRocmVhZExvb2t1cENhY2hlIH0gZnJvbSAnLi9sb29rdXAnO1xuaW1wb3J0IHsgVmlydHVhbDFEIH0gZnJvbSAnLi9WaXJ0dWFsJztcbmltcG9ydCB7IENvbW1pdEF0dHJpYnV0ZVRhZyB9IGZyb20gJy4vQXR0cmlidXRlVGFnJztcblxuZXhwb3J0IHR5cGUgSW5zaWdodEFwcFByb3BzID0ge1xuICBjb250cm9sbGVyOiBSZWNvbmNpbGVyRGVidWdDb250cm9sbGVyLFxuICBidXM6IFJlY29uY2lsZXJEZWJ1Z0V2ZW50QnVzLFxuXG4gIGRvY3VtZW50OiBEb2N1bWVudCxcbn07XG5cbmV4cG9ydCB0eXBlIEluc2lnaHRBcHBTdGF0ZSA9IHtcbiAgYnJlYWtPbkFmdGVyVXBkYXRlOiBib29sZWFuLFxuICBicmVha09uQmVmb3JlVXBkYXRlOiBib29sZWFuLFxuXG4gIGNvbW1pdEJyZWFrcG9pbnRzOiBTZXQ8Q29tbWl0SUQ+LFxuXG4gIHBhdXNlZDogYm9vbGVhbixcbn1cblxuZXhwb3J0IGNvbnN0IEluc2lnaHRBcHA6IENvbXBvbmVudDxJbnNpZ2h0QXBwUHJvcHM+ID0gKHsgY29udHJvbGxlciwgYnVzLCBkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudCB9KSA9PiB7XG4gIGNvbnN0IFtjLCBzZXRSZW5kZXJDb3VudGVyXSA9IHVzZVN0YXRlKDApO1xuXG4gIGNvbnN0IFtpbnNpZ2h0U3RhdGUsIHNldEluc2lnaHRTdGF0ZV0gPSB1c2VTdGF0ZTxJbnNpZ2h0QXBwU3RhdGU+KHtcbiAgICBjb21taXRCcmVha3BvaW50czogbmV3IFNldCgpLFxuICAgIGJyZWFrT25BZnRlclVwZGF0ZTogZmFsc2UsXG4gICAgYnJlYWtPbkJlZm9yZVVwZGF0ZTogdHJ1ZSxcbiAgICBwYXVzZWQ6IGZhbHNlLFxuICB9KTtcblxuICBjb25zdCBjb21taXRDYWNoZSA9IHVzZVJlZigoKSA9PiBuZXcgQ29tbWl0TG9va3VwQ2FjaGUoKSkuY3VycmVudDtcbiAgY29uc3QgZGVsdGFDYWNoZSA9IHVzZVJlZigoKSA9PiBuZXcgVGhyZWFkTG9va3VwQ2FjaGUoY29tbWl0Q2FjaGUpKS5jdXJyZW50O1xuXG4gIHVzZU1lbW8oKCkgPT4ge1xuICAgIGNvbW1pdENhY2hlLnNldFRyZWUoY29udHJvbGxlci5nZXRUcmVlKCkpXG4gICAgZGVsdGFDYWNoZS5yZXNldCgpO1xuICB9LCBbXSlcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdbSW5zaWdodF0gUG9wdWxhdGUgQ2FjaGUnKVxuXG4gICAgYnVzLm9uVGhyZWFkRG9uZSA9ICh0aHJlYWQsIGRlbHRhKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnW0luc2lnaHRdIFRocmVhZERvbmUnKVxuXG4gICAgICBkZWx0YUNhY2hlLmluZ2VzdERlbHRhKGRlbHRhKTtcbiAgICAgIGRlbHRhQ2FjaGUuaW5nZXN0VGhyZWFkKHRocmVhZCk7XG4gICAgICBkZWx0YUNhY2hlLnByZXZUYXNrID0gbnVsbDtcbiAgICAgIHNldFJlbmRlckNvdW50ZXIoYyA9PiBjICsgMSk7XG5cbiAgICAgIGZvciAoY29uc3Qgc3Vic2NyaWJlciBvZiBjYWNoZVN1YnNjcmliZXJzKSB7XG4gICAgICAgIHN1YnNjcmliZXIoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgYnVzLnRocmVhZC5vblF1ZXVlID0gKHJlYXNvbikgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1tJbnNpZ2h0XSBPblF1ZXVlJylcbiAgICAgIGNvbnN0IHRocmVhZCA9IGNvbnRyb2xsZXIuZ2V0VGhyZWFkKCk7XG4gICAgICBcbiAgICAgIGlmICh0aHJlYWQucmVhc29ucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgaWYgKGluc2lnaHRTdGF0ZS5icmVha09uQmVmb3JlVXBkYXRlKVxuICAgICAgICAgIGNvbnRyb2xsZXIuc2NoZWR1bGVyLmludGVyY2VwdCA9IHRydWU7XG5cbiAgICAgICAgaWYgKGRlbHRhQ2FjaGUucmVwb3J0KVxuICAgICAgICAgIGNvbW1pdENhY2hlLmluZ2VzdChkZWx0YUNhY2hlLnJlcG9ydCk7XG4gICAgICAgIFxuICAgICAgICBkZWx0YUNhY2hlLnJlc2V0KCk7XG4gICAgICAgIGRlbHRhQ2FjaGUuaW5nZXN0VGhyZWFkKHRocmVhZCk7XG4gICAgICAgIHNldFJlbmRlckNvdW50ZXIoYyA9PiBjICsgMSk7XG5cbiAgICAgICAgZm9yIChjb25zdCBzdWJzY3JpYmVyIG9mIGNhY2hlU3Vic2NyaWJlcnMpIHtcbiAgICAgICAgICBzdWJzY3JpYmVyKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgYnVzLnRocmVhZC5vbldvcmsgPSAocHJldlRhc2ssIG5leHRUYXNrLCBpc0RvbmUpID0+IHtcblxuICAgICAgaWYgKGluc2lnaHRTdGF0ZS5icmVha09uQWZ0ZXJVcGRhdGUgJiYgaXNEb25lKSB7XG4gICAgICAgIGNvbnRyb2xsZXIuc2NoZWR1bGVyLmludGVyY2VwdCA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAobmV4dFRhc2sgJiYgaW5zaWdodFN0YXRlLmNvbW1pdEJyZWFrcG9pbnRzLmhhcyhuZXh0VGFzay5pZCkpIHtcbiAgICAgICAgY29udHJvbGxlci5zY2hlZHVsZXIuaW50ZXJjZXB0ID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbnRyb2xsZXIuc2NoZWR1bGVyLmludGVyY2VwdCkge1xuICAgICAgICBjb25zdCB0aHJlYWQgPSBjb250cm9sbGVyLmdldFRocmVhZCgpO1xuICAgICAgICBjb25zdCBkZWx0YSA9IGNvbnRyb2xsZXIuZ2V0RGVsdGEoKTtcbiAgICAgICAgXG4gICAgICAgIGRlbHRhQ2FjaGUuaW5nZXN0RGVsdGEoZGVsdGEpO1xuICAgICAgICBkZWx0YUNhY2hlLmluZ2VzdFRocmVhZCh0aHJlYWQpO1xuICAgICAgICBzZXRSZW5kZXJDb3VudGVyKGMgPT4gYyArIDEpO1xuXG4gICAgICAgIGZvciAoY29uc3Qgc3Vic2NyaWJlciBvZiBjYWNoZVN1YnNjcmliZXJzKSB7XG4gICAgICAgICAgc3Vic2NyaWJlcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByZXZUYXNrKVxuICAgICAgICAgIGRlbHRhQ2FjaGUucHJldlRhc2sgPSBwcmV2VGFzaztcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtjb250cm9sbGVyLCBidXMsIGluc2lnaHRTdGF0ZV0pO1xuXG4gIGNvbnN0IGNhY2hlU3Vic2NyaWJlcnMgPSB1c2VSZWY8U2V0PCgpID0+IHZvaWQ+PihuZXcgU2V0KCkpLmN1cnJlbnQ7XG5cbiAgY29uc3Qgc2Nyb2xsVG9Db21taXRJbmRleCA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiAoaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgaWYgKCF2aWV3cG9ydFJlZi5jdXJyZW50KVxuICAgICAgICByZXR1cm47XG4gICAgICBjb25zdCB2aWV3UG9ydFJlY3QgPSB2aWV3cG9ydFJlZi5jdXJyZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgaWYgKGluZGV4KSB7XG4gICAgICAgIHZpZXdwb3J0UmVmLmN1cnJlbnQuc2Nyb2xsVG8oe1xuICAgICAgICAgIHRvcDogKGluZGV4ICogMzMpIC0gKHZpZXdQb3J0UmVjdC5oZWlnaHQgLyAyKSxcbiAgICAgICAgICBiZWhhdmlvcjogJ3Ntb290aCdcbiAgICAgICAgfSlcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfSwgW10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgeyBuZXh0VGFzaywgcHJldlRhc2sgfSA9IGRlbHRhQ2FjaGU7XG5cbiAgICBjb25zdCB0YXNrID0gbmV4dFRhc2sgfHwgcHJldlRhc2s7XG4gICAgY29uc3QgaW5kZXggPSB0YXNrICYmIGNvbW1pdHMuZmluZEluZGV4KGMgPT4gKG5leHRUYXNrICYmIGMuaWQgPT09IG5leHRUYXNrLmlkKSB8fCAocHJldlRhc2sgJiYgcHJldlRhc2suaWQgPT09IGMuaWQpKTtcbiAgICBcbiAgICBpZiAoaW5kZXggJiYgaW5kZXggIT09IC0xKSB7XG4gICAgICBzY3JvbGxUb0NvbW1pdEluZGV4KGluZGV4KTtcbiAgICB9XG4gIH0sIFtkZWx0YUNhY2hlLnByZXZUYXNrLCBkZWx0YUNhY2hlLm5leHRUYXNrLCBzY3JvbGxUb0NvbW1pdEluZGV4XSlcblxuICBjb25zdCByZW5kZXJDb21taXQgPSB1c2VNZW1vKCgpID0+IChjb21taXRJZDogQ29tbWl0SUQpID0+IHtcbiAgICByZXR1cm4gaChDb21taXRDb21wb25lbnQsIHsgY29tbWl0SWQgfSlcbiAgfSwgW10pO1xuXG4gIGNvbnN0IENvbW1pdENvbXBvbmVudCA9IHVzZU1lbW8oKCk6IENvbXBvbmVudDx7IGNvbW1pdElkOiBDb21taXRJRCB9PiA9PiAoeyBjb21taXRJZCB9KSA9PiB7XG4gICAgY29uc3QgW2MsIHNldFJlbmRlckNvdW50ZXJdID0gdXNlU3RhdGUoMCk7XG5cbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBjb21taXQgPSBkZWx0YUNhY2hlLmFsbC5nZXQoY29tbWl0SWQpO1xuICAgICAgICBjb25zdCBvcmlnaW5hbENvbW1pdCA9IGNvbW1pdENhY2hlLm1hcC5nZXQoY29tbWl0SWQpO1xuXG4gICAgICAgIGNvbnN0IGluVGFza0xpc3QgPSBkZWx0YUNhY2hlLmFsbFRhc2tzLmhhcyhjb21taXRJZCk7XG4gICAgICAgIFxuICAgICAgICBpZiAoY29tbWl0ICE9PSBvcmlnaW5hbENvbW1pdCB8fCBpblRhc2tMaXN0IHx8IChkZWx0YUNhY2hlLnByZXZUYXNrICYmIGRlbHRhQ2FjaGUucHJldlRhc2suaWQgPT09IGNvbW1pdElkKSlcbiAgICAgICAgICBzZXRSZW5kZXJDb3VudGVyKGMgPT4gYyArIDEpO1xuICAgICAgfVxuICAgICAgY2FjaGVTdWJzY3JpYmVycy5hZGQoc3Vic2NyaXB0aW9uKTtcbiAgICAgIHN1YnNjcmlwdGlvbigpO1xuXG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhgW0NvbW1pdF0gQ2xlYW5pbmcgdXAgJHtjb21taXRJZH1gKVxuICAgICAgICBjYWNoZVN1YnNjcmliZXJzLmRlbGV0ZShzdWJzY3JpcHRpb24pO1xuICAgICAgfVxuICAgIH0sIFtjb21taXRJZF0pXG5cbiAgICBjb25zdCBjb21taXQgPSBkZWx0YUNhY2hlLmFsbC5nZXQoY29tbWl0SWQpIHx8IG51bGw7XG4gICAgaWYgKCFjb21taXQpXG4gICAgICByZXR1cm4gKGNvbnNvbGUud2FybihgW0NvbW1pdF0gQ29tbWl0ICR7Y29tbWl0SWR9IG5vdCBmb3VuZCBpbiBkZWx0YSBjYWNoZWApLCBudWxsKTtcblxuICAgIGNvbnN0IGNvbG9yID0gXG4gICAgICAoZGVsdGFDYWNoZS5uZXh0VGFzayAmJiBkZWx0YUNhY2hlLm5leHRUYXNrLmlkID09PSBjb21taXQuaWQpID8gJyNlMWQ2MDBmZidcbiAgICAgIDogZGVsdGFDYWNoZS50YXJnZXRzLmhhcyhjb21taXQuaWQpID8gJyNkYjU1ZTdmZidcbiAgICAgIDogZGVsdGFDYWNoZS5hbGxUYXNrcy5oYXMoY29tbWl0LmlkKSA/ICcjZWE5MzFhZmYnXG4gICAgICA6IGRlbHRhQ2FjaGUuY3JlYXRlZC5oYXMoY29tbWl0LmlkKSA/IChkZWx0YUNhY2hlLnByZXZUYXNrICYmIGRlbHRhQ2FjaGUucHJldlRhc2suaWQgPT09IGNvbW1pdC5pZCA/ICcjNGJjODQ3ZmYnIDogJyMyMWE1MWNmZicpXG4gICAgICA6IGRlbHRhQ2FjaGUucmVtb3ZlZC5oYXMoY29tbWl0LmlkKSA/ICcjZjI1MjUyZmYnXG4gICAgICA6IGRlbHRhQ2FjaGUudXBkYXRlZC5oYXMoY29tbWl0LmlkKSA/ICcjMWFiOWVhZmYnXG4gICAgICA6IGRlbHRhQ2FjaGUudmlzaXRlZC5oYXMoY29tbWl0LmlkKSA/ICcjNmY2Zjk3ZmYnXG4gICAgICA6ICcjY2FjYWNhJztcbiAgICBcbiAgICBpZiAoIWNvbW1pdClcbiAgICAgIHJldHVybiAoY29uc29sZS5sb2coYFtDb21taXRdICR7Y29tbWl0SWR9IG5vdCByZWFkeSB5ZXQ/P2ApLCBudWxsKTtcblxuICAgIHJldHVybiB1c2VNZW1vKCgpID0+IGgoQ29tbWl0UHJldmlldywgeyBjb21taXQsIHJlbmRlckNvbW1pdCwgY29sb3IsIG9uQ2xpY2s6ICgpID0+IHNldFNlbGVjdGVkQ29tbWl0SWQoY29tbWl0LmlkKSB9KSwgW1xuICAgICAgY29tbWl0LnZlcnNpb24sXG4gICAgICBjb2xvcixcbiAgICBdKVxuICB9LCBbXSlcblxuICBjb25zdCB2aWV3cG9ydFJlZiA9IHVzZVJlZjxIVE1MRWxlbWVudCB8IG51bGw+KG51bGwpO1xuXG4gIGNvbnN0IFtzZWxlY3RlZENvbW1pdElkLCBzZXRTZWxlY3RlZENvbW1pdElkXSA9IHVzZVN0YXRlPENvbW1pdElEIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW3NlbGVjdGVkQ29tbWl0RGV0YWlscywgc2V0U2VsZWN0ZWRDb21taXREZXRhaWxzXSA9IHVzZVN0YXRlPENvbW1pdERldGFpbHNSZXBvcnQgfCBudWxsPihudWxsKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFzZWxlY3RlZENvbW1pdElkKVxuICAgICAgcmV0dXJuO1xuXG4gICAgY29uc3QgZGV0YWlscyA9IGNvbnRyb2xsZXIuZ2V0RGV0YWlscyhzZWxlY3RlZENvbW1pdElkKTtcbiAgICBzZXRTZWxlY3RlZENvbW1pdERldGFpbHMoZGV0YWlscylcbiAgfSwgW3NlbGVjdGVkQ29tbWl0SWRdKVxuXG4gIGNvbnN0IHJvb3RzID0gWy4uLmRlbHRhQ2FjaGUucm9vdHMua2V5cygpXTtcbiAgY29uc3QgY29tbWl0cyA9IGRlbHRhQ2FjaGUuZ2V0RmxhdCgpO1xuXG4gIGNvbnN0IENIVU5LX1NJWkUgPSA4O1xuXG4gIHJldHVybiBoKCdkaXYnLCB7IHN0eWxlOiB7IGRpc3BsYXk6ICdmbGV4JywgJ2ZsZXgtZGlyZWN0aW9uJzogJ2NvbHVtbicsIHBvc2l0aW9uOiAnYWJzb2x1dGUnLCB0b3A6IDAsIGxlZnQ6IDAsIHJpZ2h0OiAwLCBib3R0b206IDAgfSB9LCBbXG4gICAgaCgnZGl2JywgeyBzdHlsZTogeyBmbGV4OiAwLCBkaXNwbGF5OiAnZmxleCcgfSB9LCBbXG4gICAgICBoKFNjaGVkdWxlQ29udHJvbHMsIHtcbiAgICAgICAgY29udHJvbGxlcjogY29udHJvbGxlci5zY2hlZHVsZXIsXG4gICAgICAgIGJ1czogYnVzLnNjaGVkdWxlcixcbiAgICAgICAgcmVjb25jaWxlcjogY29udHJvbGxlcixcblxuICAgICAgICBzdGF0ZTogaW5zaWdodFN0YXRlLFxuICAgICAgICBvblN0YXRlQ2hhbmdlOiBzZXRJbnNpZ2h0U3RhdGUsXG4gICAgICB9KSxcbiAgICBdKSxcbiAgICBoKCdkaXYnLCB7IHN0eWxlOiB7IGZsZXg6IDEsIG92ZXJmbG93OiAnaGlkZGVuJywgYmFja2dyb3VuZDogJyNjMGQ3ZGRmZicsIGRpc3BsYXk6ICdmbGV4JyB9IH0sIFtcbiAgICAgIGgoJ2RpdicsIHsgc3R5bGU6IHsgZmxleDogMSB9IH0sXG4gICAgICAgIC8vaChUcmVlVmlld2VyLCB7IHJvb3RzLCByZW5kZXJDb21taXQgfSksXG4gICAgICAgIGgoVmlydHVhbDFELCB7IHZpZXdwb3J0UmVmLCB3aW5kb3dSYW5nZTogNSwgY2h1bmtDb3VudDogY29tbWl0cy5sZW5ndGggLyBDSFVOS19TSVpFLCBjaHVua1NpemU6ICgzMyAqIENIVU5LX1NJWkUpLCByZW5kZXJDaHVuayhpbmRleCkge1xuICAgICAgICAgIGlmIChpbmRleCA8IDApXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgICAgICAgIHJldHVybiBBcnJheS5mcm9tKHsgbGVuZ3RoOiBDSFVOS19TSVpFIH0pLm1hcCgoXywgY2h1bmtJbmRleCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVwb3J0ID0gY29tbWl0c1soaW5kZXggICogQ0hVTktfU0laRSkgKyAoY2h1bmtJbmRleCldO1xuICAgICAgICAgICAgaWYgKCFyZXBvcnQpXG4gICAgICAgICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgICAgICAgICBjb25zdCBjb2xvciA9IGdldENvbW1pdENvbG9yKGRlbHRhQ2FjaGUsIHJlcG9ydC5pZCk7XG5cbiAgICAgICAgICAgIGNvbnN0IG9uQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIHNldFNlbGVjdGVkQ29tbWl0SWQocmVwb3J0LmlkKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVzOiBbc3RyaW5nLCBzdHJpbmddW10gPSBbXG4gICAgICAgICAgICAgIGluc2lnaHRTdGF0ZS5jb21taXRCcmVha3BvaW50cy5oYXMocmVwb3J0LmlkKSA/IFsnQnJlYWtwb2ludCcsICdFbmFibGVkJ10gYXMgW3N0cmluZywgc3RyaW5nXSA6IG51bGxcbiAgICAgICAgICAgIF0uZmlsdGVyKHggPT4gISF4KVxuXG4gICAgICAgICAgICByZXR1cm4gaCgnZGl2JywgeyBzdHlsZTogeyAnbWFyZ2luLWxlZnQnOiAoKHJlcG9ydC5kaXN0YW5jZSAtIDEpICogMzIpICsgJ3B4JywgaGVpZ2h0OiAnMzNweCcgfSB9LCBbXG4gICAgICAgICAgICAgIGgoQ29tbWl0UHJldmlldywgeyBjb2xvciwgY29tbWl0OiByZXBvcnQsIG9uQ2xpY2ssIGF0dHJpYnV0ZXMgfSlcbiAgICAgICAgICAgIF0pXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sIH0pXG4gICAgICApLFxuICAgICAgaCgnZGl2JywgeyBzdHlsZTogeyAnbWluLXdpZHRoJzogJzMwMHB4JywgZmxleDogMCwgYmFja2dyb3VuZDogJyNmZmRlYWJmZicgfSB9LCBbXG4gICAgICAgIGRlbHRhQ2FjaGUudGhyZWFkICYmIGgoJ2RpdicsIHsgfSwgW1xuICAgICAgICAgIGgoJ2RsJywge30sIFtcbiAgICAgICAgICAgIGgoJ2R0Jywge30sICdUaHJlYWQgSUQnKSxcbiAgICAgICAgICAgIGgoJ2RkJywge30sIGRlbHRhQ2FjaGUudGhyZWFkLmlkKSxcbiAgICAgICAgICAgIGgoJ2R0Jywge30sICdUaHJlYWQgRG9uZScpLFxuICAgICAgICAgICAgaCgnZGQnLCB7fSwgZGVsdGFDYWNoZS50aHJlYWQuZG9uZS50b1N0cmluZygpKSxcbiAgICAgICAgICAgIGgoJ2R0Jywge30sICdUaHJlYWQgUGFzc2VzJyksXG4gICAgICAgICAgICBoKCdkZCcsIHt9LCBkZWx0YUNhY2hlLnRocmVhZC5wYXNzZXMpLFxuICAgICAgICAgICAgaCgnZHQnLCB7fSwgJ1Rhc2tzIChjb3VudCknKSxcbiAgICAgICAgICAgIGgoJ2RkJywge30sIGRlbHRhQ2FjaGUudGhyZWFkLnBlbmRpbmdUYXNrcy5sZW5ndGgpLFxuICAgICAgICAgICAgaCgnZHQnLCB7fSwgJ1Zpc2l0ZWQgKGNvdW50KScpLFxuICAgICAgICAgICAgaCgnZGQnLCB7fSwgZGVsdGFDYWNoZS50aHJlYWQudmlzaXRlZC5sZW5ndGgpLFxuICAgICAgICAgICAgaCgnZHQnLCB7fSwgJ0NyZWF0ZWQgKGNvdW50KScpLFxuICAgICAgICAgICAgaCgnZGQnLCB7fSwgZGVsdGFDYWNoZS5jcmVhdGVkLnNpemUpLFxuICAgICAgICAgICAgaCgnZHQnLCB7fSwgJ1VwZGF0ZWQgKGNvdW50KScpLFxuICAgICAgICAgICAgaCgnZGQnLCB7fSwgZGVsdGFDYWNoZS51cGRhdGVkLnNpemUpLFxuICAgICAgICAgICAgaCgnZHQnLCB7fSwgJ1JlbW92ZWQgKGNvdW50KScpLFxuICAgICAgICAgICAgaCgnZGQnLCB7fSwgZGVsdGFDYWNoZS5yZW1vdmVkLnNpemUpLFxuICAgICAgICAgICAgaCgnZHQnLCB7fSwgJ011c3RSZW5kZXIgJyksXG4gICAgICAgICAgICBoKCdkZCcsIHt9LCBkZWx0YUNhY2hlLnRocmVhZC5tdXN0UmVuZGVyLm1hcChjb21taXRJZCA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGNvbW1pdCA9IGRlbHRhQ2FjaGUuYWxsLmdldChjb21taXRJZCk7XG4gICAgICAgICAgICAgIGlmICghY29tbWl0KVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICBjb25zdCBjb2xvciA9IGdldENvbW1pdENvbG9yKGRlbHRhQ2FjaGUsIGNvbW1pdElkKTtcblxuICAgICAgICAgICAgICByZXR1cm4gaChDb21taXRQcmV2aWV3LCB7XG4gICAgICAgICAgICAgICAgY29tbWl0LFxuICAgICAgICAgICAgICAgIGNvbG9yLFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s6ICgpID0+IChzY3JvbGxUb0NvbW1pdEluZGV4KGNvbW1pdHMuaW5kZXhPZihjb21taXQpKSwgc2V0U2VsZWN0ZWRDb21taXRJZChjb21taXRJZCkpXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KSksXG4gICAgICAgICAgICBoKCdkdCcsIHt9LCAnTWlzc2VkJyksXG4gICAgICAgICAgICBoKCdkZCcsIHt9LCBkZWx0YUNhY2hlLnRocmVhZC5taXNzZWQubWFwKGNvbW1pdElkID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgY29tbWl0ID0gZGVsdGFDYWNoZS5hbGwuZ2V0KGNvbW1pdElkKTtcbiAgICAgICAgICAgICAgaWYgKCFjb21taXQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgIGNvbnN0IGNvbG9yID0gZ2V0Q29tbWl0Q29sb3IoZGVsdGFDYWNoZSwgY29tbWl0SWQpO1xuXG4gICAgICAgICAgICAgIHJldHVybiBoKENvbW1pdFByZXZpZXcsIHtcbiAgICAgICAgICAgICAgICBjb21taXQsXG4gICAgICAgICAgICAgICAgY29sb3IsXG4gICAgICAgICAgICAgICAgb25DbGljazogKCkgPT4gKHNjcm9sbFRvQ29tbWl0SW5kZXgoY29tbWl0cy5pbmRleE9mKGNvbW1pdCkpLCBzZXRTZWxlY3RlZENvbW1pdElkKGNvbW1pdElkKSlcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pKSxcbiAgICAgICAgICBdKVxuICAgICAgICBdKSxcbiAgICAgICAgaCgnaHInKSxcbiAgICAgICAgc2VsZWN0ZWRDb21taXREZXRhaWxzICYmIFtcbiAgICAgICAgICBoKENvbW1pdFByZXZpZXcsIHtcbiAgICAgICAgICAgIGNvbW1pdDogc2VsZWN0ZWRDb21taXREZXRhaWxzLmNvbW1pdCxcbiAgICAgICAgICAgIGNvbG9yOiBnZXRDb21taXRDb2xvcihkZWx0YUNhY2hlLCBzZWxlY3RlZENvbW1pdERldGFpbHMuY29tbWl0LmlkKSxcbiAgICAgICAgICAgIG9uQ2xpY2s6ICgpID0+IChzY3JvbGxUb0NvbW1pdEluZGV4KGNvbW1pdHMuaW5kZXhPZihzZWxlY3RlZENvbW1pdERldGFpbHMuY29tbWl0KSksIHNldFNlbGVjdGVkQ29tbWl0SWQoc2VsZWN0ZWRDb21taXREZXRhaWxzLmNvbW1pdC5pZCkpXG4gICAgICAgICAgfSksXG4gICAgICAgICAgaCgnYnV0dG9uJywgeyBvbkNsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICBzZXRJbnNpZ2h0U3RhdGUoc3RhdGUgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBwcmV2ID0gc3RhdGUuY29tbWl0QnJlYWtwb2ludHM7XG4gICAgICAgICAgICAgIGlmIChwcmV2LmhhcyhzZWxlY3RlZENvbW1pdERldGFpbHMuY29tbWl0LmlkKSkge1xuICAgICAgICAgICAgICAgIHByZXYuZGVsZXRlKHNlbGVjdGVkQ29tbWl0RGV0YWlscy5jb21taXQuaWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIGNvbW1pdEJyZWFrcG9pbnRzOiBuZXcgU2V0KHByZXYpIH07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcHJldi5hZGQoc2VsZWN0ZWRDb21taXREZXRhaWxzLmNvbW1pdC5pZClcbiAgICAgICAgICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIGNvbW1pdEJyZWFrcG9pbnRzOiBuZXcgU2V0KHByZXYpIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfX0sICdUb2dnbGUgQnJlYWtwb2ludCcpLFxuICAgICAgICAgIGgoJ2gzJywge30sICdQYXJlbnQnKSxcbiAgICAgICAgICAoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyZW50SWQgPSBzZWxlY3RlZENvbW1pdERldGFpbHMuY29tbWl0LnBhcmVudDtcbiAgICAgICAgICAgIGlmICghcGFyZW50SWQpXG4gICAgICAgICAgICAgIHJldHVybiAnTk8gUEFSRU5UJztcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IGRlbHRhQ2FjaGUuYWxsLmdldChwYXJlbnRJZCk7XG4gICAgICAgICAgICBpZiAoIXBhcmVudClcbiAgICAgICAgICAgICAgcmV0dXJuIGgoQ29tbWl0QXR0cmlidXRlVGFnLCB7IG5hbWU6ICdQYXJlbnRJRCcsIHZhbHVlOiBwYXJlbnRJZC50b1N0cmluZygpIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gaChDb21taXRQcmV2aWV3LCB7XG4gICAgICAgICAgICAgIGNvbW1pdDogcGFyZW50LFxuICAgICAgICAgICAgICBjb2xvcjogZ2V0Q29tbWl0Q29sb3IoZGVsdGFDYWNoZSwgcGFyZW50LmlkKSxcbiAgICAgICAgICAgICAgb25DbGljazogKCkgPT4gKHNjcm9sbFRvQ29tbWl0SW5kZXgoY29tbWl0cy5pbmRleE9mKHBhcmVudCkpLCBzZXRTZWxlY3RlZENvbW1pdElkKHBhcmVudC5pZCkpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KSgpLFxuICAgICAgICAgIGgoJ2gzJywge30sICdQcm9wcycpLFxuICAgICAgICAgIGgoJ3VsJywge30sXG4gICAgICAgICAgICBPYmplY3QuZW50cmllcyhzZWxlY3RlZENvbW1pdERldGFpbHMucHJvcHMpLm1hcCgoW3Byb3AsIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gaCgnbGknLCB7fSwgYCR7cHJvcH0gPSAke2dldFRleHRGb3JWYWx1ZSh2YWx1ZSl9YCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgIClcbiAgICAgICAgXVxuICAgICAgXSlcbiAgICBdKVxuICBdKVxufVxuXG5cbmV4cG9ydCBjb25zdCBnZXRUZXh0Rm9yVmFsdWUgPSAodmFsdWU6IFZhbHVlUmVwb3J0KTogc3RyaW5nID0+IHtcbiAgc3dpdGNoICh2YWx1ZS50eXBlKSB7XG4gICAgY2FzZSAncHJpbWl0aXZlJzpcbiAgICAgIHN3aXRjaCAodHlwZW9mIHZhbHVlLnZhbHVlKSB7XG4gICAgICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICAgICAgcmV0dXJuIGBudWxsYDtcbiAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgcmV0dXJuIHZhbHVlLnZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICB9XG4gICAgY2FzZSAnY29tcGxleCc6XG4gICAgICByZXR1cm4gdmFsdWUubmFtZTtcbiAgICBjYXNlICd1bmRlZmluZWQnOlxuICAgICAgcmV0dXJuIGB1bmRlZmluZWRgO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gIHZhbHVlO1xuICB9XG59XG5cbmNvbnN0IGdldENvbW1pdENvbG9yID0gKGRlbHRhQ2FjaGU6IFRocmVhZExvb2t1cENhY2hlLCBjb21taXRJZDogQ29tbWl0SUQpID0+IHtcblxuICBjb25zdCBjb2xvciA9IFxuICAgIChkZWx0YUNhY2hlLm5leHRUYXNrICYmIGRlbHRhQ2FjaGUubmV4dFRhc2suaWQgPT09IGNvbW1pdElkKSA/ICcjZTFkNjAwZmYnXG4gICAgOiBkZWx0YUNhY2hlLnRhcmdldHMuaGFzKGNvbW1pdElkKSA/ICcjZGI1NWU3ZmYnXG4gICAgOiBkZWx0YUNhY2hlLmFsbFRhc2tzLmhhcyhjb21taXRJZCkgPyAnI2VhOTMxYWZmJ1xuICAgIDogZGVsdGFDYWNoZS5jcmVhdGVkLmhhcyhjb21taXRJZCkgPyAoZGVsdGFDYWNoZS5wcmV2VGFzayAmJiBkZWx0YUNhY2hlLnByZXZUYXNrLmlkID09PSBjb21taXRJZCA/ICcjNGJjODQ3ZmYnIDogJyMyMWE1MWNmZicpXG4gICAgOiBkZWx0YUNhY2hlLnJlbW92ZWQuaGFzKGNvbW1pdElkKSA/ICcjZjI1MjUyZmYnXG4gICAgOiBkZWx0YUNhY2hlLnVwZGF0ZWQuaGFzKGNvbW1pdElkKSA/ICcjMWFiOWVhZmYnXG4gICAgOiBkZWx0YUNhY2hlLnZpc2l0ZWQuaGFzKGNvbW1pdElkKSA/ICcjNmY2Zjk3ZmYnXG4gICAgOiAnI2NhY2FjYSc7XG5cbiAgcmV0dXJuIGNvbG9yO1xufSIsICJcbmltcG9ydCB7IGgsIE5vZGUgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0XCI7XG5pbXBvcnQgeyBOb2RlQnVpbGRlciwgUmVuZGVyU3BhY2UyIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdC1iYWNrc3RhZ2VcIjtcbmltcG9ydCB7IGNyZWF0ZURlYnVnU2NoZWR1bGVyLCBEZWJ1Z1JlY29uY2lsZXIgfSBmcm9tIFwiQGx1a2VrYWFsaW0vYWN0LWRlYnVnXCI7XG5pbXBvcnQgeyBjcmVhdGVXZWJOb2RlQnVpbGRlciwgSFRNTCwgcmVuZGVyIH0gZnJvbSBcIkBsdWtla2FhbGltL2FjdC13ZWJcIjtcbmltcG9ydCB7IEluc2lnaHRBcHAgfSBmcm9tIFwiLi9JbnNpZ2h0QXBwXCI7XG5pbXBvcnQgeyBSZWNvbmNpbGVyMiB9IGZyb20gXCJAbHVrZWthYWxpbS9hY3QtcmVjb25cIjtcblxuZXhwb3J0IHR5cGUgRGV2T3B0aW9ucyA9IHtcbiAgbW9kZT86ICdleHRlbnNpb24nIHwgJ3BvcHVwJyB8ICdub25lJ1xufTtcblxuZXhwb3J0IGNvbnN0IHJlbmRlckRFViA9IChub2RlOiBOb2RlLCBidWlsZGVyczogTm9kZUJ1aWxkZXI8YW55LCBhbnk+W10sIHsgbW9kZSA9ICdub25lJyB9OiBEZXZPcHRpb25zID0ge30pID0+IHtcbiAgY29uc3QgcmVjb25jaWxlciA9IG5ldyBEZWJ1Z1JlY29uY2lsZXIoKTtcbiAgY29uc3Qgc3BhY2VzID0gYnVpbGRlcnMubWFwKGJ1aWxkZXIgPT4gbmV3IFJlbmRlclNwYWNlMihyZWNvbmNpbGVyLnRyZWUsIGJ1aWxkZXIpKTtcbiAgXG4gIHJlY29uY2lsZXIuYnVzID0ge1xuICAgIHJlbmRlcihkZWx0YSkge1xuICAgICAgZm9yIChjb25zdCBzcGFjZSBvZiBzcGFjZXMpXG4gICAgICAgIHNwYWNlLmNyZWF0ZShkZWx0YSk7XG4gICAgICBmb3IgKGNvbnN0IHNwYWNlIG9mIHNwYWNlcylcbiAgICAgICAgc3BhY2UudXBkYXRlKGRlbHRhKTtcbiAgICB9LFxuICB9XG4gIHN3aXRjaCAobW9kZSkge1xuICAgIGNhc2UgJ3BvcHVwJzpcbiAgICAgIGNyZWF0ZURlYnVnUG9wdXAocmVjb25jaWxlcik7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICB9XG5cbiAgY29uc3QgcmVmID0gcmVjb25jaWxlci5tb3VudChub2RlKTtcbiAgcmV0dXJuIHtyZWYsIHJlY29uY2lsZXJ9XG59XG5cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZURlYnVnUG9wdXAgPSAocmVjb25jaWxlcjogRGVidWdSZWNvbmNpbGVyKSA9PiB7XG4gIGNvbnN0IG5ld1dpbmRvdyA9IHdpbmRvdy5vcGVuKCcnLCBcIkRldlRvb2xzXCIsIFwicG9wdXBcIik7XG4gIGlmICghbmV3V2luZG93KVxuICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIG1ha2UvZmluZCBuZXcgd2luZG93IWApO1xuXG4gIGNvbnN0IGJvZHkgPSBuZXdXaW5kb3cuZG9jdW1lbnQuYm9keTtcbiAgZm9yIChjb25zdCBjaGlsZCBvZiBbLi4uYm9keS5jaGlsZE5vZGVzLCAuLi5uZXdXaW5kb3cuZG9jdW1lbnQuaGVhZC5jaGlsZE5vZGVzXSlcbiAgICBjaGlsZC5yZW1vdmUoKTtcblxuICBmb3IgKGNvbnN0IGhlYWRFbGVtZW50IG9mIFsuLi53aW5kb3cuZG9jdW1lbnQuaGVhZC5jaGlsZE5vZGVzXSlcbiAgICBpZiAoaGVhZEVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MU3R5bGVFbGVtZW50KVxuICAgICAgICBuZXdXaW5kb3cuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChoZWFkRWxlbWVudC5jbG9uZU5vZGUodHJ1ZSkpXG4gICAgZWxzZSBpZiAoaGVhZEVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MTGlua0VsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBoZWFkRWxlbWVudC5jbG9uZU5vZGUodHJ1ZSkgYXMgSFRNTExpbmtFbGVtZW50O1xuICAgICAgY29uc3Qgc3JjID0gbmV3IFVSTChlbGVtZW50LmhyZWYsIGRvY3VtZW50LmxvY2F0aW9uLmhyZWYpO1xuICAgICAgZWxlbWVudC5ocmVmID0gc3JjLmhyZWY7XG4gICAgICBuZXdXaW5kb3cuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbGVtZW50KVxuICAgIH1cblxuICBjb25zb2xlLmxvZygnPT09PT09PT09PT09PVBPUFVQIFJFTkRFUj09PT09PT09PT09PT0nKVxuICByZW5kZXIoXG4gICAgaChJbnNpZ2h0QXBwLCB7IGNvbnRyb2xsZXI6IHJlY29uY2lsZXIuY29udHJvbGxlciwgYnVzOiByZWNvbmNpbGVyLmRlYnVnQnVzLCBkb2N1bWVudDogbmV3V2luZG93LmRvY3VtZW50IH0pLFxuICAgIGJvZHksXG4gICAgeyB3aW5kb3c6IG5ld1dpbmRvdyB9XG4gICk7XG59IiwgImltcG9ydCB7IGNyZWF0ZURPTVNjaGVkdWxlciwgY3JlYXRlV2ViTm9kZUJ1aWxkZXIsIHByaW1pdGl2ZVRvU3ltYm9sTWFwIH0gZnJvbSAnQGx1a2VrYWFsaW0vYWN0LXdlYic7XG5pbXBvcnQgeyBBcHAgfSBmcm9tICcuL2FwcCc7XG5pbXBvcnQgeyBDb21taXQyLCBDb21taXRJRCwgQ29tbWl0UmVmMiwgUmVjb25jaWxlcjIgfSBmcm9tICdAbHVrZWthYWxpbS9hY3QtcmVjb24nO1xuaW1wb3J0IHsgRGVoeWRyYXRlZEJ1bmRsZSwgRGVoeWRyYXRlZENvbW1pdCB9IGZyb20gJ0BsdWtla2FhbGltL2FjdC13ZWIvbm9kZSc7XG5pbXBvcnQgeyBFbGVtZW50LCBFbGVtZW50VHlwZSwgaCwgcHJpbWl0aXZlTm9kZVR5cGVzLCBzcGVjaWFsTm9kZVR5cGVzLCB1c2VNZW1vLCB1c2VTdGF0ZSB9IGZyb20gJ0BsdWtla2FhbGltL2FjdCc7XG5pbXBvcnQgeyBjcmVhdGVEZWJ1Z1BvcHVwIH0gZnJvbSAnQGx1a2VrYWFsaW0vYWN0LWluc2lnaHQnO1xuaW1wb3J0IHsgRGVidWdSZWNvbmNpbGVyIH0gZnJvbSAnQGx1a2VrYWFsaW0vYWN0LWRlYnVnJztcbmltcG9ydCB7IFJlbmRlclNwYWNlMiB9IGZyb20gJ0BsdWtla2FhbGltL2FjdC1iYWNrc3RhZ2UnO1xuXG5cbmNvbnN0IG1haW4gPSAoKSA9PiB7XG4gIGNvbnN0IGNvbW1pdERhdGFFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ0NPTU1JVFMnKVxuICBjb25zdCBhdHRhY2hFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ0FUVEFDSCcpXG4gIGNvbnN0IHN0YXRlRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdTVEFURScpXG4gIGlmICghY29tbWl0RGF0YUVsZW1lbnQgfHwgIWF0dGFjaEVsZW1lbnQgfHwgIXN0YXRlRWxlbWVudClcbiAgICByZXR1cm47XG5cbiAgY29uc3QgeyBjb21taXRzLCBtb3VudElkIH0gPSBKU09OLnBhcnNlKGNvbW1pdERhdGFFbGVtZW50LmlubmVyVGV4dCkgYXMgRGVoeWRyYXRlZEJ1bmRsZTtcblxuICBjb25zdCByZWNvbmNpbGVyID0gbmV3IERlYnVnUmVjb25jaWxlcigpO1xuICBcbiAgY29uc3Qgc3BhY2UgPSBuZXcgUmVuZGVyU3BhY2UyKHJlY29uY2lsZXIudHJlZSwgY3JlYXRlV2ViTm9kZUJ1aWxkZXIoYXR0YWNoRWxlbWVudCkpXG5cbiAgY3JlYXRlRGVidWdQb3B1cChyZWNvbmNpbGVyKVxuXG4gIGNvbnN0IHJlZnMgPSBuZXcgTWFwPENvbW1pdElELCBDb21taXRSZWYyPigpO1xuICBjb25zdCBlbGVtZW50cyA9IG5ldyBNYXA8Q29tbWl0SUQsIEVsZW1lbnQ+KCk7XG4gIGNvbnN0IHJvb3RzOiBDb21taXRSZWYyW10gPSBbXTtcblxuICBjb25zdCBzdGF0ZSA9IEpTT04ucGFyc2Uoc3RhdGVFbGVtZW50LnRleHRDb250ZW50KTtcblxuICBjb25zdCB1c2VTU1JTdGF0ZSA9IChrZXksIF8pID0+IHtcbiAgICBjb25zdCBbdmFsdWUsIHNldFZhbHVlXSA9IHVzZVN0YXRlKHN0YXRlW2tleV0pO1xuXG4gICAgcmV0dXJuIFt2YWx1ZSwgc2V0VmFsdWVdO1xuICB9XG4gIGNvbnN0IHVzZVNTUkVmZmVjdCA9ICgpID0+IHtcblxuICB9XG5cbiAgZm9yIChjb25zdCBjb21taXQgb2YgY29tbWl0cykge1xuICAgIHJlZnMuc2V0KGNvbW1pdC5pZCwgQ29tbWl0UmVmMi5yZWh5ZHJhdGUoY29tbWl0LmlkLCBjb21taXQuZGlzdGFuY2UpKTtcbiAgICBcbiAgICBpZiAobW91bnRJZCA9PT0gY29tbWl0LmlkKVxuICAgICAgZWxlbWVudHMuc2V0KGNvbW1pdC5pZCwgaChBcHAsIHsgdXNlU1NSRWZmZWN0LCB1c2VTU1JTdGF0ZSwgZG9uZSgpIHsgY29uc29sZS5sb2coJ0FsbCBkb25lIScpIH0gfSkpO1xuICAgIGVsc2Uge1xuICAgICAgY29uc3QgZWxlbWVudFR5cGUgPSAocHJpbWl0aXZlVG9TeW1ib2xNYXBbY29tbWl0LmVsZW1lbnRUeXBlXVxuICAgICAgICB8fCBjb21taXQuZWxlbWVudFR5cGVcbiAgICAgICAgfHwgc3BlY2lhbE5vZGVUeXBlcy5wbGFjZWhvbGRlcikgYXMgc3RyaW5nIHwgc3ltYm9sXG5cbiAgICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmZyb21FbnRyaWVzKGNvbW1pdC5wcm9wcyk7XG4gICAgICBjb25zb2xlLmxvZyhlbGVtZW50VHlwZSwgY29tbWl0LnByb3BzKTtcblxuICAgICAgZWxlbWVudHMuc2V0KGNvbW1pdC5pZCwgaChlbGVtZW50VHlwZSwgcHJvcHMpKTtcbiAgICB9XG4gIH1cbiAgZm9yIChjb25zdCBkZWh5ZHJhdGVkQ29tbWl0IG9mIGNvbW1pdHMpIHtcbiAgICBjb25zdCByZWYgPSByZWZzLmdldChkZWh5ZHJhdGVkQ29tbWl0LmlkKSBhcyBDb21taXRSZWYyO1xuICAgIHJlZi5wYXJlbnQgPSBkZWh5ZHJhdGVkQ29tbWl0LnBhcmVudCAmJiByZWZzLmdldChkZWh5ZHJhdGVkQ29tbWl0LnBhcmVudCkgfHwgbnVsbDtcblxuICAgIGNvbnN0IGNoaWxkcmVuID0gZGVoeWRyYXRlZENvbW1pdC5jaGlsZHJlbi5tYXAoYyA9PiByZWZzLmdldChjKSkuZmlsdGVyKHggPT4gISF4KTtcbiAgICBjb25zdCBlbGVtZW50ID0gZWxlbWVudHMuZ2V0KGRlaHlkcmF0ZWRDb21taXQuaWQpIGFzIEVsZW1lbnQ7XG4gICAgZWxlbWVudC5jaGlsZHJlbiA9IGNoaWxkcmVuLm1hcChjID0+IGVsZW1lbnRzLmdldChjLmlkKSBhcyBFbGVtZW50KVxuXG4gICAgaWYgKCFyZWYucGFyZW50KSB7XG4gICAgICByb290cy5wdXNoKHJlZik7XG4gICAgfVxuXG4gICAgY29uc3QgY29tbWl0ID0gcmVjb25jaWxlci5wb29scy5jb21taXQuYWNxdWlyZShyZWYsXG4gICAgICBlbGVtZW50LFxuICAgICAgY2hpbGRyZW5cbiAgICApO1xuXG4gICAgY29uc3Qgbm9kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWNvbW1pdC1pZD1cIiR7Y29tbWl0LnJlZi5pZH1cIl1gKVxuICAgIGlmIChub2RlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgIHNwYWNlLm5vZGVCeUNvbW1pdC5zZXQoY29tbWl0LnJlZi5pZCwgbm9kZSk7XG4gICAgICBzcGFjZS5jb21taXRCeU5vZGUuc2V0KG5vZGUsIGNvbW1pdCk7XG4gICAgfVxuICAgIGlmIChjb21taXQuZWxlbWVudC50eXBlID09PSBzcGVjaWFsTm9kZVR5cGVzLnJlbmRlcikge1xuICAgICAgc3BhY2Uucm9vdHMuc2V0KGNvbW1pdC5yZWYuaWQsIGNvbW1pdCk7XG4gICAgfVxuXG4gICAgcmVjb25jaWxlci50cmVlLmNvbW1pdHMuc2V0KGNvbW1pdC5yZWYuaWQsIGNvbW1pdClcbiAgfVxuICBcbiAgY29uc3QgbW91bnRSZWYgPSByZWZzLmdldChtb3VudElkKSBhcyBDb21taXRSZWYyO1xuXG4gIHJlY29uY2lsZXIuYnVzLnJlbmRlciA9IChkZWx0YSkgPT4ge1xuICAgIGNvbnNvbGUubG9nKHsgZGVsdGEgfSlcbiAgICBzcGFjZS5idXMucmVuZGVyKGRlbHRhKVxuICB9O1xuXG4gIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09SVRTIE1ZIFJFTkRFUj09PT09PT09PT09PT0nKVxuICByZWNvbmNpbGVyLnJlbmRlcihtb3Vu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TUFDaEI7QUFFQSxZQUFNLFNBQVMsV0FBVyxNQUFNLE9BQU87QUFBQSxRQUFRO0FBQUEsUUFDN0M7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUVBLFlBQU0sT0FBTyxTQUFTLGNBQWMsb0JBQW9CLE9BQU8sSUFBSSxFQUFFLElBQUk7QUFDekUsVUFBSSxnQkFBZ0IsYUFBYTtBQUMvQixjQUFNLGFBQWEsSUFBSSxPQUFPLElBQUksSUFBSSxJQUFJO0FBQzFDLGNBQU0sYUFBYSxJQUFJLE1BQU0sTUFBTTtBQUFBLE1BQ3JDO0FBQ0EsVUFBSSxPQUFPLFFBQVEsU0FBUyxpQkFBaUIsUUFBUTtBQUNuRCxjQUFNLE1BQU0sSUFBSSxPQUFPLElBQUksSUFBSSxNQUFNO0FBQUEsTUFDdkM7QUFFQSxpQkFBVyxLQUFLLFFBQVEsSUFBSSxPQUFPLElBQUksSUFBSSxNQUFNO0FBQUEsSUFDbkQ7QUFFQSxVQUFNLFdBQVcsS0FBSyxJQUFJLE9BQU87QUFFakMsZUFBVyxJQUFJLFNBQVMsQ0FBQyxVQUFVO0FBQ2pDLGNBQVEsSUFBSSxFQUFFLE1BQU0sQ0FBQztBQUNyQixZQUFNLElBQUksT0FBTyxLQUFLO0FBQUEsSUFDeEI7QUFFQSxZQUFRLElBQUkseUNBQXlDO0FBQ3JELGVBQVcsT0FBTyxRQUFRO0FBQUEsRUFFNUI7QUFFQSxPQUFLOyIsCiAgIm5hbWVzIjogWyJ3aW5kb3ciLCAibmV4dCIsICJwcmV2IiwgIndpbmRvdyIsICJwcmV2SW5kZXgiLCAicHJvdmlkZXIiLCAicmVmIiwgInVzZVN0YXRlIiwgInVzZUVmZmVjdCIsICJlbGVtZW50QmFyIiwgImVsZW1lbnROYW1lIiwgImNvbW1pdCIsICJzZWxlY3RlZCIsICJjb21taXRMaXN0IiwgInRvcCIsICJjb21taXRBdHRyaWJ1dGVUYWciLCAiY29tbWl0QXR0cmlidXRlVGFnTmFtZSIsICJjb21taXRBdHRyaWJ1dGVUYWdWYWx1ZSIsICJkb2N1bWVudCIsICJjIiwgInNldFJlbmRlckNvdW50ZXIiLCAiY29tbWl0Il0KfQo=
