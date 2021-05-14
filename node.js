// @flow strict
const { nanoid: uuid } = require('nanoid');
/*:: import type { StateHooks, StatePath } from './state'; */
/*:: import type { ActGraph } from './graph'; */
const { setupHooks, loadHooks } = require('./state');

/*::
export type UntypedComponent = Component<mixed>;
export type Component<T> = (props: T, children: Node, hooks: StateHooks) => Node;
export type NormalNode = {|
  id: string,
  type: string | Component<mixed> | symbol,
  props: mixed,
  children: $ReadOnlyArray<NormalNode>,
|};

export type Node =
  | NormalNode
  | string
  | null
  | false
  | $ReadOnlyArray<Node>
*/

const createNode = /*::<T>*/(
  type/*: symbol | string | Component<T>*/,
  props/*: T*/,
  children/*: Node*/ = []
)/*: NormalNode*/ => {
  return {
    id: uuid(),
    // $FlowFixMe
    type,
    props,
    children: normalizeNode(children),
  }
};

const nodeStringSymbol/*: symbol*/ = Symbol();

const normalizeNode = (node/*: Node*/)/*: NormalNode[]*/ => {
  if (Array.isArray(node)) {
    return node.map(normalizeNode).flat(1);
  }
  if (!node)
    return [];
  if (typeof node === 'string')
    return [createNode(nodeStringSymbol, { content: node })];
  return [node];
};

const propsEqual = (propsA/*: mixed*/, propsB/*: mixed*/)/*: boolean*/ => {
  if (propsA === propsB)
    return true;
  if (!propsA || !propsB)
    return false; 
  // Only support object comparisons shallow equality
  if (typeof propsA !== 'object' || typeof propsB !== 'object')
    return false;
  const keysA = Object.keys(propsA);
  const keysB = Object.keys(propsB);

  if (keysA.length !== keysB.length)
    return false;

  for (let key of keysA)
    if (propsA[key] !== propsB[key])
      return false;

  return true;
}

/** Determine if two nodes are equivalent in props, type and children  */
const nodesEqual = (node/*: NormalNode*/, lastNode/*: NormalNode*/)/*: boolean*/ => {
  if (typeof node === 'string' || typeof lastNode === 'string')
    return node === lastNode;
  if (node.id === lastNode.id)
    return true;
  if (node.type !== lastNode.type)
    return false;
  if (!propsEqual(node.props, lastNode.props))
    return false;
  if (node.children.length !== lastNode.children.length)
    return false;
  if (!node.children.every((child, index) =>
    lastNode.children[index] && nodesEqual(child, lastNode.children[index])
  ))
    return false;
  return true;
};

/*::
type NodeLifecycle =
  | 'create'
  | 'update'
*/

const getHooks = (lifecycle/*: NodeLifecycle*/, graph/*: ActGraph*/, path/*: StatePath*/) => {
  switch (lifecycle) {
    case 'create':
      return setupHooks(graph, path);
    case 'update':
      return loadHooks(graph, path);
    default:
      throw new Error(`Unknown lifecycle type`);
  }
};

const traverseNode = (lifecycle/*: NodeLifecycle*/, graph/*: ActGraph*/, node/*: NormalNode*/, path/*: StatePath*/)/*: $ReadOnlyArray<NormalNode>*/ => {
  if (typeof node === 'string')
    return [];
  const { type, children, props } = node;
  switch (typeof type) {
    case 'function':
      return normalizeNode(type(props, children, getHooks(lifecycle, graph, path)));
    case 'string':
    case 'symbol':
      return node.children;
    default:
      throw new Error(`Unknown component type`);
  }
};

module.exports = {
  node: createNode,
  n: createNode,
  createNode,
  normalizeNode,
  propsEqual,
  nodesEqual,
  traverseNode,
  renderNode: traverseNode,
  nodeStringSymbol,
};
