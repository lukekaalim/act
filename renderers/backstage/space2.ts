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
export class RenderSpace2<TNode, TRootProps extends { type: string | symbol }> {
  /** The CommitTree this render space is connected to */
  tree: CommitTree2;

  /**
   * The core map of a CommitID to a Node. Not every commit has a node:
   *  - Components dont have nodes
   *  - Unsupported primitives dont have nodes
   *  - Foreign (i.e. handled by another renderspace) commits dont have a node here
   * */
  nodeByCommit: Map<CommitID, TNode> = new Map();
  /** A reverse map to look up Commits given just the node they represent */
  commitByNode: Map<TNode, Commit2> = new Map();

  /** For a given CommitID, find it's closest "real" parent (a ancestor with a non-null TNode) */
  //parentByNode: Map<CommitID, Commit2> = new Map();
  // (unused)

  /**
   * A set of all special Root element IDs in the tree.
   * A Root element helps tell a renderer what kind of element
   * to render, based on it's closest Root.
   */
  roots: Map<CommitID, Commit2> = new Map();

  /**
   * Every created node get assigned to a Root commit
   */
  rootByCommit: Map<CommitID, Commit2> = new Map();

  bus: ReconcilerEventBus;
  builder: NodeBuilder<TNode, TRootProps>;

  constructor(tree: CommitTree2, builder: NodeBuilder<TNode, TRootProps>) {
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

    if (this.builder.isRootLinkable && this.builder.roots.has(commit.element.props.type as string | symbol)) {
      if (this.builder.isRootLinkable(commit.element.props as TRootProps)) {
        return []
      }
    }
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
        const commit = this.tree.commits.get(ancestor.id) || null;

        if (commit) {
          // Early exit out of parent lookup if someone on the path is null;
          if (commit.element.type === primitiveNodeTypes.null)
            return { commit, node: null, attachable: false };

          // maybe a bad idea... we'll see
          if (commit.isSuspended())
            attachable = false;

          // if this node is a RenderRoot
          if (this.roots.has(commit.ref.id)) {
            // if it is a root owned by this space
            if (this.builder.isRootLinkable && this.builder.roots.has(commit.element.props.type as string | symbol)) {
              if (this.builder.isRootLinkable(commit.element.props as TRootProps)) {
                // This RenderRoot is linkable, so should try to attach to it via linkRoot
                return { commit: null, node: null, attachable: true };
              }
              // marked as not linkable, so we Passthrough to check the parents!
            } else {
              // if it a foreign root (or has no linkable implementation), quit out
              return { commit: null, node: null, attachable: false };
            }
          }
        }

        const node = this.nodeByCommit.get(ancestor.id);
        // If you find an element with a node
        if (node)
          return { commit, node, attachable }
      }
      ancestor = ancestor.parent;
    }

    // this element has no root... how hopeless
    return { commit: null, node: null, attachable: false };
  }

  findRoot(ref: CommitRef2) {
    let ancestor: CommitRef2 | null = ref;

    while (ancestor) {
      const ancestorsRoot = this.rootByCommit.get(ancestor.id);
      if (ancestorsRoot)
        return ancestorsRoot;
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
      this.rootByCommit.set(next.ref.id, root);

      const rootProps = root.element.props as { type: string | symbol };

      // test to see if this element
      // belongs to this 
      if (this.builder.roots.has(rootProps.type)) {
        // Try to create a <T> for every new commit
        const node = this.builder.create(next.element, rootProps as TRootProps, next.ref);
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
      unlinkRoot,
      suspend = unlink,
      unsuspend = link
    } = this.builder;

    if (link || sort) {
      // Loop through newly created nodes
      for (const [next, node] of this.newNodes) {
        const result = this.findParent(next.ref);

        if (result.commit && result.node && result.attachable) {
          this.needsReorder.add(result.commit.ref.id)

          if (link)
            link(node, result.node);
        }

        if (linkRoot && !result.commit && !result.node && result.attachable) {
          const root = this.rootByCommit.get(next.ref.id);
          if (root)
            linkRoot(node, root.element.props as TRootProps);
        }
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
        const root = this.rootByCommit.get(next.ref.id);
        if (!node || !root)
          continue;


        update(node, next.element, prev, next.ref, root.element.props as TRootProps);

        if (moved) {
          const result = this.findParent(next.ref);
          
          if (result.commit) {
            this.needsReorder.add(result.commit.ref.id);
          }
        }
      }
      for (const next of [...deltas.fresh.values()].reverse()) {
        const node = this.nodeByCommit.get(next.ref.id);
        const root = this.rootByCommit.get(next.ref.id) as Commit2;
        if (node && root)
          update(node, next.element, null, next.ref, root.element.props as TRootProps);
      }
    }
    for (const prev of deltas.removed.values()) {
      const node = this.nodeByCommit.get(prev.ref.id);
      if (node) {
        this.nodeByCommit.delete(prev.ref.id);
        const parent = this.findParent(prev.ref);
        if (parent.commit && parent.node)
          this.needsReorder.add(parent.commit.ref.id)

        this.commitByNode.delete(node);
        if (unlink && parent.node)
          unlink(node, parent.node);
        if (unlinkRoot && !parent.commit) {
          const root = this.rootByCommit.get(prev.ref.id);
          if (root)
            unlinkRoot(node, root.element.props as TRootProps)
        }
        if (destroy)
          destroy(node, prev.element);
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
