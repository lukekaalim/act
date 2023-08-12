import { Component, Ref } from "@lukekaalim/act";
import { AmbientLight, Color, CubeTexture, DirectionalLight, Euler, HemisphereLight, Light, Mesh, PerspectiveCamera, PointLight, Quaternion, Scene, Sprite, Texture, Vector3 } from "three";

export type ReferenceProps<T> = {
  ref?: ((reference: T) => unknown) | Ref<T>
};

type PropsFromList<TObject, TPropList extends (keyof TObject)[]> = {
  [Property in TPropList[number]]?: undefined | TObject[Property]
};

export type Object3DProps<T> =
  & ReferenceProps<T>
  & {
      name?: string,
      position?: Vector3,
      rotation?: Euler,
      quaternion?: Quaternion,
      visible?: boolean,
      scale?: Vector3,
    };

export const scene: Component<SceneProps>;
export type SceneProps =
  & Object3DProps<Scene>
  & PropsFromList<Scene, [
    "fog",
    "backgroundBlurriness",
    "backgroundIntensity",
    "overrideMaterial",
    "background",
    "environment"
  ]>

export const mesh: Component<MeshProps>;
export type MeshProps = 
  & Object3DProps<Mesh>
  & PropsFromList<Mesh, ["geometry", "material"]>

export const sprite: Component<SpriteProps>;
export type SpriteProps =
  & Object3DProps<Sprite>
  & PropsFromList<Sprite, ["geometry", "material", "center"]>


export type LightProps = PropsFromList<Light, [
  "color", "intensity", "shadow"
]>

export const pointLight: Component<PointerLightProps>;
export type PointerLightProps =
  & Object3DProps<PointLight>
  & LightProps
  & PropsFromList<PointLight, [
    "distance", "castShadow",
    "decay", "shadow", "power"
  ]>

export const ambientLight: Component<AmbientLightProps>;
export type AmbientLightProps =
  & Object3DProps<AmbientLight>
  & LightProps

export const directionalLight: Component<DirectionalLightProps>;
export type DirectionalLightProps =
  & Object3DProps<DirectionalLight>
  & LightProps
  & PropsFromList<DirectionalLight, [
    "shadow", "target", 
  ]>

export const hemisphereLight: Component<HemisphereLightProps>;
export type HemisphereLightProps =
  & Object3DProps<HemisphereLight>
  & LightProps

export const perspectiveCamera: Component<PerspectiveCameraProps>;
export type PerspectiveCameraProps =
  & Object3DProps<PerspectiveCamera>
  & PropsFromList<PerspectiveCamera, [
    "aspect", "near", "far",
    "zoom", "fov", "focus", "view",
    "filmGauge", "filmOffset"
  ]>

