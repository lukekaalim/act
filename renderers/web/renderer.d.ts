import { ElementType } from "@lukekaalim/act";
import { Renderer2 } from "@lukekaalim/act-renderer-core";

export declare function createWebRenderer(
  getNextRenderer?: null | ((element: ElementType) => null | Renderer2<Node>),
): Renderer2<Node>