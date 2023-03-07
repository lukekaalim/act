// @flow strict

import { h } from "@lukekaalim/act";
import { createId } from "@lukekaalim/act/ids";

/*::
import type { GraphNode, GraphEdge, GraphNodeID } from "./basicGraph";
import type { ElementNode } from "@lukekaalim/act";

export type TreeGraphNode = {
  id?: GraphNodeID,
  size?: { height: number, width: number },
  content?: ElementNode,
  children?: TreeGraphNode[],
};

export type TreeGraphResult = {
  nodes: GraphNode[],
  edges: GraphEdge[],
  root: GraphNodeID,
}
*/

export const calculateTreeNodesEdges = (
  treeNodes/*: TreeGraphNode[]*/,
  padding/*: number*/ = 10
)/*: TreeGraphResult[]*/ => {

  /*::
  type TreeBounds = {
    width: number,
    height: number,
    widths: number[],
    offsets: number[],
    children: TreeBounds[],
  }
  */

  const calculateTreeBounds = (treeNodes/*: TreeGraphNode[]*/)/*: TreeBounds*/ => {
    const children = treeNodes
      .map(tree => calculateTreeBounds(tree.children || []));

    const widths = children.map((result, index) => {
      const width = Math.max(
        treeNodes[index].size?.width || 100,
        result.width
      );
      return width + padding;
    })
  
    const offsets = children.reduce((offsets, result, index) => {
      const width = widths[index];
      const prevOffset = offsets[offsets.length - 1] || 0;
      return [...offsets, prevOffset + width]
    }, [])
  
    const width = offsets[offsets.length - 1] || 0;
    const height = children.reduce((maxHeight, currentResult) => {
      return Math.max(maxHeight, currentResult.height)
    }, 0)
    return { width, height, offsets, children, widths }
  }

  const bounds = calculateTreeBounds(treeNodes);

  const calculateGraph = (
    treeNodes/*: TreeGraphNode[]*/,
    bounds/*: TreeBounds*/,
    depth/*: number*/ = 0,
    offset/*: number*/ = 0,
  )/*: TreeGraphResult[]*/ => {
    return treeNodes.map((node, index) => {
      const width = bounds.widths[index];
      const localOffset = (bounds.offsets[index - 1] || 0);
      const left = -(bounds.width / 2);

      const position = {
        x: left + localOffset + offset + width/2,
        y: depth,
      }
      const size = {
        width: (node.size?.width || 100) - (padding),
        height: 30 }
      const children = calculateGraph(
        node.children || [], bounds.children[index],
        depth + 100,
        position.x,
      );
      const id = node.id || createId();
      const nodes = [
        {
          id,
          content: node.content || h('pre', {}, JSON.stringify(offset)),
          position,
          size,
        },
        ...children.flatMap(c => c.nodes),
      ];
      const edges = [
        ...children.map(child => {
          return { id: `${id}:${child.root}:edge`, start: id, end: child.root }
        }),
        ...children.flatMap(child => child.edges)
      ];

      return {
        nodes,
        edges,
        root: id,
      };
    })
  };

  return calculateGraph(treeNodes, bounds);
}