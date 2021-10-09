// @flow strict
/*:: import type { Component as ActComponent } from '@lukekaalim/act'; */
/*:: import type {
  Vector3,
  Object3D,
  Quaternion,
  BufferGeometry,
  Material,
  Texture,
  Color,
  Group,
} from "three"; */
/*:: import * as Three from 'three'; */

/*::
export type Object3DProps<T> = {
  ref?: ((reference: T) => mixed) | { current: T | any },

  name?: string,
  position?: Vector3,
  quaternion?: Quaternion,
  visible?: boolean,
  scale?: Vector3,
};
export type MeshProps = {
  ...Object3DProps<Three.Mesh>,
  geometry?: BufferGeometry,
  material?: Material,
};
export type InstanceMeshProps = {
  ...MeshProps,
  ...Object3DProps<Three.InstanceMesh>,
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
export type ThreeProps = {
  width: number,
  height: number,
  setStyle?: boolean,
  background?: Color | null | Texture,
  alpha?: boolean,
  onRender?: (timestamp: number) => void,
};
export type GroupProps = {
  ...Object3DProps<Three.Group>,
  group?: ?Three.Object3D,
}
*/

export const Component = {
  mesh: ('mesh'/*: ActComponent<MeshProps>*/),
  instanceMesh: ('instanceMesh'/*: ActComponent<InstanceMeshProps>*/),
  pointLight: ('pointLight'/*: ActComponent<PointLightsProps>*/),
  points: ('points'/*: ActComponent<PointsProps>*/),
  three: ('three'/*: ActComponent<ThreeProps>*/),
  group: ('group'/*: ActComponent<GroupProps>*/),
};
export const C = Component;