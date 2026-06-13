import { Component, EmptyProps } from "./component.ts";
import { createId, OpaqueID } from "./id.ts";
import { Props } from "./mod.ts";
import { Node } from "./node.ts";

/**
 * This is a unique value that is generated
 * every time you call createElement - it
 * is used to compare two different elements
 * and quickly determine if they are the same.
 */
export type ElementID = OpaqueID<"ElementID">;

/**
 * The "Element" is the fundamental building
 * block of act - Components return an Element
 * Tree, which then eventually becomes a tree
 * of Commits.
 */
export type Element = {
  type: ElementType;
  id: ElementID;
  props: Record<string, unknown>;
  children: Node;
};

export type ElementType<T extends Props = EmptyProps> = null | string | symbol | Component<T>;
export type ElementKey = string | number | symbol;

const EMPTY_PROPS = Object.freeze({});

/**
 * Generate a unique element. Each element has an internal
 * ID to quickly tell if elements are different.
 */
export function createElement<P extends Props>(
  type: Component<P> | string | symbol,
  props: P | void,
  children?: Node
): Element;
export function createElement(
  type: ElementType,
  props?: Props,
  children: Node = []
): Element {
  return {
    id: createId("ElementID"),
    type,
    props: props || EMPTY_PROPS,
    children,
  } as Element;
}

export const h = createElement;
