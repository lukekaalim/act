import { Renderer2 } from "@lukekaalim/act-renderer-core";
import { Object3D } from "three";

declare export function createObjectRenderer(
  getNextRenderer?: null | ((type: ElementType) => null | Renderer2<Object3D>)
): Renderer2<Object3D>;

/**
 * A scene renderer is just an object renderer connected to
 * a null renderer
 */
declare export function createSceneRenderer(): Renderer2;