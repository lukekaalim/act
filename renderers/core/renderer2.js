// @flow strict

/*::
import type { Commit3, DiffSet, CommitID3 } from "@lukekaalim/act-reconciler";
import type { Element, Props } from "@lukekaalim/act";
import type { Diff3 } from "../../reconciler/diff";

export type RendereredNode<T> =
  | { type: 'empty' }
  | { type: 'skip' }
  | { type: 'node', node: T }
export type RenderResult2<T> = {
  node: T,
  commit: Commit3,
};

export type RendererImplementation<T> = {
  create: (type: string, props: Props, children: $ReadOnlyArray<Element>) => T,
  update: (node: T, set: DiffSet, next: Diff3) => void,
  attach: (node: T, set: DiffSet, next: Diff3, children: T[]) => void,
  remove: (node: T, set: DiffSet, next: Diff3, children: T[]) => void,
};

export type Renderer2<T> = {
  render: (diff: DiffSet, commitId: CommitID3) => T[],
  getNodes: (diff: DiffSet, commitId: CommitID3) => T[],
};
*/

const identityRenderer/*: Renderer2<any>*/ = {
  render: () => [],
  getNodes: () => [],
}

const defaultEmptyNodes = new Set([
  'act:null',
])
const defaultSkipNodes = new Set([
  'act:context',
  'act:suspend',
  'act:boundary',
])

export const createRenderer2 = /*::<T>*/(
  implementation/*: RendererImplementation<T>*/,
  nextRenderer/*: Renderer2<T>*/ = identityRenderer,
)/*: Renderer2<T>*/ => {
  const nodeDetailsByCommitId/*: Map<CommitID3, RendereredNode<T>>*/ = new Map();

  const createNode = (element) => {
    const { type, props, children } = element;
    if (typeof type === 'function')
      return { type: 'skip' };

    if (defaultEmptyNodes.has(type))
      return { type: 'empty' };

    if (defaultSkipNodes.has(type))
      return { type: 'skip' }

    return { type: 'node', node: implementation.create(type, props, children) };
  };
  const getNodeDetails = (commitId, change) => {
    if (change.type === 'create') {
      const createdNodeDetails = createNode(change.element);
      nodeDetailsByCommitId.set(commitId, createdNodeDetails);
      return createdNodeDetails;
    }

    const nodeDetails = nodeDetailsByCommitId.get(commitId);
    if (!nodeDetails)
      throw new Error('Missing Expected Node Details');
    return nodeDetails
  }

  /**
   * Get details for commit, or if node is skip, get details
   * for children.
   */
  const getNodes = (set, commitId) => {
    // Optimistically check if nodes are within the current renderer.
    const nodeDetails = nodeDetailsByCommitId.get(commitId);
    if (!nodeDetails)
      return nextRenderer.getNodes(set, commitId);

    const commit = set.nexts.get(commitId);

    if (nodeDetails.type === 'node')
      return [nodeDetails.node];

    const childNodes/*: T[]*/ = commit.children
      .map(commitId => getNodes(set, commitId))
      .flat(1);
    return childNodes;
  }
  
  const render = (set, commitId) => {
    const diff = set.diffs.get(commitId);
    if (!diff)
      return getNodes(set, commitId);
    const { change } = diff;
    
    const nodeDetails = getNodeDetails(diff.commit.id, change);
    const children = diff.commit.children
      .map(id => nextRenderer.render(set, id))
      .flat(1);

    const commit = set.nexts.get(commitId);
    if (commit.state === 'suspended' || nodeDetails.type === 'empty')
      return [];

    if (nodeDetails.type === 'skip')
      return children;

    if (change.type === 'remove') {
      implementation.remove(nodeDetails.node, set, diff, children);
      return [];
    }

    if (
      (change.type === 'update' && change.element.id !== change.commit.element.id) ||
      change.type === 'create'
    ) {
      implementation.update(nodeDetails.node, set, diff);
    }

    implementation.attach(nodeDetails.node, set, diff, children);
    return [nodeDetails.node];
  };

  const renderer = { render, getNodes };

  return renderer;
}