// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type {
  Vector3,
  Vector2,
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
export type RefProp<T> = ((reference: T) => mixed) | { current: T | any }

export type Object3DProps<T> = {
  ref?: RefProp<?T>,

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
export type SpriteProps = {
  ...Object3DProps<Three.Sprite>,
  material: Material;
  center: Vector2;
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
export type DirectionalLightProps = {
  ...Object3DProps<Three.DirectionalLight>,
  distance?: number,
  decay?: number,
  intensity?: number,
  power?: number,
};
export type AmbientLightProps = {
  ...Object3DProps<Three.AmbientLight>,
  intensity?: number,
  power?: number,
};
export type PointsProps = {
  ...Object3DProps<Three.Points>,
  geometry?: BufferGeometry,
  material?: Material,
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
export type OrthographicCameraProps = {
  ...Object3DProps<Three.OrthographicCamera>,
  aspect?: number,
  near?: number,
  far?: number,
  zoom?: number,
}
*/

export const scene = ('scene'/*: Component<SceneProps>*/);
export const group = ('group'/*: Component<GroupProps>*/);

export const perspectiveCamera = ('perspectiveCamera'/*: Component<PerspectiveCameraProps>*/);
export const orthographicCamera = ('orthographicCamera'/*: Component<OrthographicCameraProps>*/);

export const mesh = ('mesh'/*: Component<MeshProps>*/);
export const sprite = ('sprite'/*: Component<SpriteProps>*/);
export const points = ('points'/*: Component<PointsProps>*/);
export const instancedMesh = ('instancedMesh'/*: Component<InstancedMeshProps>*/);

export const pointLight = ('pointLight'/*: Component<PointLightsProps>*/);
export const ambientLight = ('ambientLight'/*: Component<AmbientLightProps>*/);
export const hemisphereLight = ('hemisphereLight'/*: Component<PointLightsProps>*/);
export const directionalLight = ('directionalLight'/*: Component<DirectionalLightProps>*/);


export * from './components/groups.js';
export * from './components/lights.js';
