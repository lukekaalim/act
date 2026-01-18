import { Component, ElementType, Ref } from "./mod";
import { providerNodeType } from './context';
import { Node } from './node';

export const boundaryNodeType = Symbol('boundary');
export const fallbackNodeType = Symbol('fallback');
export const renderNodeType = Symbol('render');

export type BoundaryProps = {
  fallback?: Node,

  onError?: (value: unknown) => unknown,
  ref?: Ref<null | { clear: () => void }>
}
export type RenderRootProps = {
  type: string | symbol,
}

export const Boundary: Component<BoundaryProps> = boundaryNodeType as any;
export const RenderRoot: Component<RenderRootProps> = renderNodeType as any;
export const Fallback: Component = fallbackNodeType as any;

export type SpecialNodeType =
  | typeof boundaryNodeType
  | typeof renderNodeType
  | typeof providerNodeType
  | typeof fallbackNodeType

export const specialNodeTypes = {
  boundary: boundaryNodeType,
  render: renderNodeType,
  provider: providerNodeType,
  fallback: fallbackNodeType
}