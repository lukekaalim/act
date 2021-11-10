// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type {
  Vector3,
  Object3D,
  Quaternion,
  BufferGeometry,
  Material,
  Texture,
  Color,
  Group,
  Camera,
  PerspectiveCamera,
  Euler,
  Scene,
  CubeTexture,
  Fog,
  WebGLRenderer,
} from "three"; */
/*:: import * as Three from 'three'; */

/*::
export type RootProps = {
  canvas?: ?{ [string]: mixed },
  renderer?: ?{
    size?: ?{ width: number, height: number, updateStyle: boolean },
    clearColor?: ?{ color: Color, alpha: number },
    clearAlpha?: number,
  },
  onRender?: ?(timestamp: number, renderer: WebGLRenderer, scene: Object3D) => mixed,
  camera?: ?Camera,
};

export type Object3DProps<T> = {
  ref?: ((reference: T) => mixed) | { current: T | any },

  name?: string,
  position?: Vector3,
  rotation?: Euler,
  quaternion?: Quaternion,
  visible?: boolean,
  scale?: Vector3,
};

export type SceneProps = {
  ...Object3DProps<Scene>,
  autoUpdate?: ?boolean,
  background?: ?(Color | Texture | CubeTexture),
  environment?: ?Texture,
  fog?: ?Fog,
  overrideMaterial?: ?Material
};

export type MeshProps = {
  ...Object3DProps<Three.Mesh>,
  geometry?: BufferGeometry,
  material?: Material,
};
export type InstancedMeshProps = {
  ...MeshProps,
  ...Object3DProps<Three.InstancedMesh>,
};
export type PointLightsProps = {
  ...Object3DProps<Three.PointLight>,
  distance?: number,
  decay?: number,
  intensity?: number,
  power?: number,
};
export type PointsProps = {
  ...Object3DProps<Three.Points>,
  geometry?: BufferGeometry,
  material?: Material,
};
type Ref<T> = ((reference: T) => mixed) | { current: T | any };
export type ThreeProps = {
  ref?: Ref<{ scene: Three.Scene, camera: PerspectiveCamera, renderer: Three.WebGLRenderer }>,
  width: number,
  height: number,
  setStyle?: boolean,
  background?: Color | null | Texture,
  alpha?: boolean,
  camera?: Camera,
  onRender?: (timestamp: number) => void,
};
export type GroupProps = {
  ...Object3DProps<Three.Group>,
  group?: ?Three.Object3D,
}
export type PerspectiveCameraProps = {
  ...Object3DProps<Three.PerspectiveCamera>,
  aspect?: number,
  near?: number,
  far?: number,
  fov?: number,
  zoom?: number,
}
*/

export const three = ('three'/*: Component<RootProps>*/);

export const scene = ('scene'/*: Component<SceneProps>*/);
export const group = ('group'/*: Component<GroupProps>*/);

export const perspectiveCamera = ('perspectiveCamera'/*: Component<PerspectiveCameraProps>*/);

export const mesh = ('mesh'/*: Component<MeshProps>*/);
export const points = ('points'/*: Component<PointsProps>*/);
export const instancedMesh = ('instancedMesh'/*: Component<InstancedMeshProps>*/);
export const pointLight = ('pointLight'/*: Component<PointLightsProps>*/);