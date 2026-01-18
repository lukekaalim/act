import { primitiveNodeTypes, specialNodeTypes, SuspendProps } from "@lukekaalim/act";
import { Commit2, CommitID, CommitRef2, CommitTree2, Delta, ReconcilerEventBus } from "@lukekaalim/act-recon"
import { NodeBuilder } from "./builder";

type ParentSearchResult<TNode> = {
  /**
   * You might not have a parent - no
   * commit means there are no Nodes above you - just Root.
   */
  commit: Commit2 | null,
  /**
   * Your parent might be a valid node,
   * or it might be "null"
   */
  node: TNode | null,

  attachable: boolean,
}

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

  findChildren(id: CommitID, ignoreFirst = false, ignoreSuspended = true): TNode[] {
    const node = this.nodeByCommit.get(id);
    if (node && !ignoreFirst)
      return [node];

    const commit = this.tree.commits.get(id);
    if (!commit)
      return [];
    if (commit.element.type === primitiveNodeTypes.null)
      return [];
    // suspended nodes don't count as children
    if (ignoreSuspended && commit.isSuspended())
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
  findParent(ref: CommitRef2): ParentSearchResult<TNode> {
    let ancestor: CommitRef2 | null = ref;
    let attachable = true;

    while (ancestor) {
      if (ancestor.id !== ref.id) {
        const commit = this.tree.commits.get(ancestor.id) as Commit2;

        // Early exit out of parent lookup if someone on the path is null;
        if (commit.element.type === primitiveNodeTypes.null)
          return { commit, node: null, attachable: false };

        // maybe a bad idea... we'll see
        if (commit.isSuspended())
          attachable = false;

        const node = this.nodeByCommit.get(ancestor.id);
        // If you find an element with a node
        if (node)
          return { commit, node, attachable }
      }
      ancestor = ancestor.parent;
    }

    // this element has no "node" parents - it is probably a "root" commit
    return { commit: null, node: null, attachable };
  }

  findRoot(ref: CommitRef2) {
    let ancestor: CommitRef2 | null = ref;

    while (ancestor) {
      const root = this.roots.get(ancestor.id);
      if (root)
        return root;
      ancestor = ancestor.parent;
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
    const {
      link,
      unlink,
      linkRoot,
      sort,
      update,
      destroy,
      suspend = unlink,
      unsuspend = link
    } = this.builder;

    if (link || sort) {
      // Loop through newly created nodes
      for (const [next, node] of this.newNodes) {
        const result = this.findParent(next.ref);

        if (next.element.type === specialNodeTypes.suspend)
          console.log(`Creating suspense node`, result)

        if (result.commit && result.node && result.attachable) {
          this.needsReorder.add(result.commit.ref.id)

          if (link)
            link(node, result.node);
        }

        if (linkRoot && !result.commit && result.attachable)
          linkRoot(node);
      }
    }

    if (update) {
      for (const { prev, next, moved } of deltas.changed.values()) {

        // suspense code
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

        update(node, next.element, prev);

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
          update(node, next.element, null);
      }
    }
    for (const prev of deltas.removed.values()) {
      const prevResult = this.nodeByCommit.get(prev.ref.id);
      if (prevResult) {
        this.nodeByCommit.delete(prev.ref.id);
        const parentId = prev.ref.find(ref => this.nodeByCommit.has(ref.id) && ref.id);
        if (parentId)
          this.needsReorder.add(parentId)

        this.commitByNode.delete(prevResult);
        destroy(prevResult);
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
}