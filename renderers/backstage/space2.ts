import { primitiveNodeTypes, renderNodeType, specialNodeTypes } from "@lukekaalim/act";
import { Commit2, CommitID, CommitRef2, CommitTree2, Delta, DeltaSet2, ReconcilerEventBus } from "@lukekaalim/act-recon"
import { NodeBuilder } from "./builder";

/**
 * The RenderSpace class
 */
export class RenderSpace2<TNode, TRoot extends string | symbol> {
  /** The CommitTree this render space is connected to */
  tree: CommitTree2;

  /** A reverse map to look up Commits given just the node they represent */
  nodeByCommit: Map<CommitID, TNode> = new Map();
  /** A reverse map to look up Commits given just the node they represent */
  commitByNode: Map<TNode, Commit2> = new Map();

  /** For a given CommitID, find it's closest "real" parent (a ancestor with a non-null TNode) */
  parentByNode: Map<CommitID, Commit2> = new Map();

  /**
   * A set of all special Root element IDs in the tree.
   * A Root element helps tell a renderer what kind of element
   * to render, based on it's closest Root.
   */
  roots: Map<CommitID, Commit2> = new Map();
  bus: ReconcilerEventBus;
  builder: NodeBuilder<TNode, TRoot>;

  constructor(tree: CommitTree2, builder: NodeBuilder<TNode, TRoot>) {
    this.tree = tree;
    this.bus = {
      render: (delta) => {
        this.create(delta);
        this.update(delta);
      },
    }
    this.builder = builder;
  }

  findChildren(id: CommitID, ignoreFirst = false): TNode[] {
    const node = this.nodeByCommit.get(id);
    if (node && !ignoreFirst)
      return [node];

    const commit = this.tree.commits.get(id);
    if (!commit)
      return [];
    if (commit.element.type === primitiveNodeTypes.null)
      return [];
    return commit.children.map(c => this.findChildren(c.id)).flat(1);
  }

  /**
   * "find parent" can return 3 types of results:
   *  - An ancestor has a node! we return that.
   *  - An ancestor is a "null" node - we return the special form of "commit but no node"
   *  - No ancestor has a node - you might be near the root
   * @param ref 
   * @returns 
   */
  findParent(ref: CommitRef2) {
    for (let i = 1; i < ref.path.length; i++) {
      const id = ref.path[ref.path.length - i - 1];

      const commit = this.tree.commits.get(id) as Commit2;

      // Early exit out of parent lookup if someone on the path is null;
      if (commit.element.type === primitiveNodeTypes.null)
        return { id, node: null };

      const node = this.nodeByCommit.get(id);
      // If you find an element with a node
      if (node)
        return { id, node }
    }
    // this element has no "node" parents - it is probably a "root" commit
    return null;
  }

  findRoot(ref: CommitRef2) {
    for (let i = ref.path.length - 1; i >= 0; i--) {
      const id = ref.path[i];
      const root = this.roots.get(id);
      if (root)
        return root;
    }
    return null;
  }

  newNodes: Set<[Commit2, TNode]> = new Set();
  needsReorder: Set<CommitID> = new Set();

  create(deltas: Delta) {
    this.newNodes.clear();
    this.needsReorder.clear();

    for (const next of deltas.fresh.values()) {
      if (next.element.type === specialNodeTypes.render) {
        // add render boundary
        this.roots.set(next.ref.id, next);
        continue;
      }
      const root = this.findRoot(next.ref);
      if (!root)
        continue;

      const rootType = root.element.props['type'] as TRoot;

      // test to see if this element
      // belongs to this 
      if (this.builder.roots.has(rootType) ) {
        // Try to create a <T> for every new commit
        const node = this.builder.create(next.element, rootType);
        // Not all commits have a corresponding node
        if (node) {
          this.newNodes.add([next, node]);
          this.nodeByCommit.set(next.ref.id, node);
          this.commitByNode.set(node, next);
        }
      }
    }
  }

  update(deltas: Delta) {
    if (this.builder.link || this.builder.sort) {
      // Loop through newly created nodes
      for (const [next, node] of this.newNodes) {
        const parent = this.findParent(next.ref);
        const parentNode = parent && parent.node;

        if (parentNode) {
          this.needsReorder.add(parent.id)

          if (this.builder.link)
            this.builder.link(node, parentNode);
        }

        if (this.builder.linkRoot && !parent)
          this.builder.linkRoot(node,);
      }
    }

    if (this.builder.update) {
      for (const { prev, next, moved } of deltas.changed.values()) {
        const node = this.nodeByCommit.get(next.ref.id);
        if (!node)
          continue;
        this.builder.update(node, next.element, prev);
        if (moved) {
          const parent = this.findParent(next.ref);
          const parentNode = parent && parent.node;
          if (parentNode) {
            this.needsReorder.add(parent.id)
          }
        }
      }
      for (const next of deltas.fresh.values()) {
        const node = this.nodeByCommit.get(next.ref.id);
        if (node)
          this.builder.update(node, next.element, null);
      }
    }
    for (const prev of deltas.removed.values()) {
      const prevResult = this.nodeByCommit.get(prev.ref.id);
      if (prevResult) {
        this.nodeByCommit.delete(prev.ref.id);
        const parentId = prev.ref.path.find(id => this.nodeByCommit.get(id));
        if (parentId)
          this.needsReorder.add(parentId)

        this.commitByNode.delete(prevResult);
        this.builder.destroy(prevResult);
      }
    }

    if (this.builder.sort) {
      for (const id of this.needsReorder) {
        const node = this.nodeByCommit.get(id);
        if (node) {
          const children = this.findChildren(id, true);
          this.builder.sort(node, children);
        }
      }
    }
  }
}