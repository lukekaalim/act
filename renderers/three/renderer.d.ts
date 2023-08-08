import { ElementType } from "@lukekaalim/act";
import { Renderer2 } from "@lukekaalim/act-renderer-core";
import { Object3D } from "three";

export declare function createObjectRenderer(
  getNextRenderer?: null | ((type: ElementType) => null | Renderer2<Object3D>)
): Renderer2<Object3D>;

/**
 * A scene renderer is just an object renderer connected to
 * a null renderer
 */
export declare function createSceneRenderer<T>(): Renderer2<T>;