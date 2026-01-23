import { Component, ElementType, Ref } from "./mod";
import { providerNodeType } from './context';
import { Node } from './node';

export const boundaryNodeType = Symbol('boundary');
export const fallbackNodeType = Symbol('fallback');
export const suspendNodeType = Symbol('suspend');
export const renderNodeType = Symbol('render');
export const placeholderNodeType = Symbol('placeholder');

export type BoundaryProps = {
  fallback?: Node,

  onThrow?: (value: unknown, allValues: unknown[]) => unknown,
  onClear?: () => unknown,

  ref?: Ref<null | { clear: () => void }>
}
export type RenderRootProps = {
  type: string | symbol,
}
export type SuspendProps = {
  suspended: boolean,
}

export const Boundary: Component<BoundaryProps> = boundaryNodeType as any;
export const RenderRoot: Component<RenderRootProps> = renderNodeType as any;
export const Fallback: Component = fallbackNodeType as any;
export const Suspend: Component<SuspendProps> = suspendNodeType as any;

export type SpecialNodeType =
  | typeof boundaryNodeType
  | typeof renderNodeType
  | typeof providerNodeType
  | typeof fallbackNodeType
  | typeof suspendNodeType
  | typeof placeholderNodeType

export const specialNodeTypes = {
  boundary: boundaryNodeType,
  render: renderNodeType,
  provider: providerNodeType,
  fallback: fallbackNodeType,
  suspend: suspendNodeType,
  placeholder: placeholderNodeType,
}