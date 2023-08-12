import { Deps, Ref } from "@lukekaalim/act";
import { WebGLRenderer } from "three";

export type WebGLOptions = {
  antialias?: boolean,
  alpha?: boolean,

  shadowMap?: {
    enabled?: boolean,
    autoUpdate?: boolean,
    type?: number,
  }
};

export function useWebGLRenderer(
  canvasRef: Ref<null | HTMLCanvasElement>,
  options?: WebGLOptions,
  deps?: Deps
): null | WebGLRenderer