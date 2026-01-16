import { Component, ElementType, Ref } from "./mod";
import { providerNodeType } from './context';

export const boundaryNodeType = Symbol('boundary');
export const renderNodeType = Symbol('render');

export type BoundaryProps = {
  onError?: (value: unknown) => unknown,
  ref?: Ref<null | { clear: () => void }>
}
export type RenderRootProps = {
  type: string | symbol,
}

export const Boundary: Component<BoundaryProps> = boundaryNodeType as any;
export const RenderRoot: Component<RenderRootProps> = renderNodeType as any;

export type SpecialNodeType =
  | typeof boundaryNodeType
  | typeof renderNodeType
  | typeof providerNodeType

export const specialNodeTypes = {
  boundary: boundaryNodeType,
  render: renderNodeType,
  provider: providerNodeType
}