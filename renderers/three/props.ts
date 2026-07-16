import * as three from 'three';
import * as act from '@lukekaalim/act';
import { PropsFromClass } from "./elements";


export const setProps = (object: three.Object3D, props: PropsFromClass<three.Object3D>) => {
  if (props.position)
    object.position.copy(props.position);
  if (props.scale)
    object.scale.copy(props.scale);
  if (props.quaternion)
    object.quaternion.copy(props.quaternion);
  if (props.rotation)
    object.rotation.copy(props.rotation);

  if (props.name  !== undefined)
    object.name = props.name;
  if (props.layers)
    object.layers = props.layers;

  if (props.visible  !== undefined)
    object.visible = props.visible;
  if (props.static  !== undefined)
    object.static = props.static;
  if (props.renderOrder  !== undefined)
    object.renderOrder = props.renderOrder;
  if (props.receiveShadow  !== undefined)
    object.receiveShadow = props.receiveShadow;
  if (props.castShadow  !== undefined)
    object.castShadow = props.castShadow;
  if (props.frustumCulled  !== undefined)
    object.frustumCulled = props.frustumCulled;

  if (props.animations)
    object.animations = props.animations;
  if (props.userData)
    object.userData = props.userData;

  if (props.ref)
    props.ref.current = object;
  
  if (object instanceof three.Mesh || object instanceof three.Points || object instanceof three.Line) {
    const meshProps = props as PropsFromClass<three.Mesh | three.Points | three.Line>;
    object.geometry = meshProps.geometry;
    object.material = meshProps.material;
  }

  if (object instanceof three.PerspectiveCamera) {
    const perspectiveCameraProps = props as PropsFromClass<three.PerspectiveCamera>;
    if (perspectiveCameraProps.aspect)
      object.aspect = perspectiveCameraProps.aspect;
    if (perspectiveCameraProps.fov)
      object.fov = perspectiveCameraProps.fov;
    
    if (perspectiveCameraProps.far)
      object.far = perspectiveCameraProps.far;
    if (perspectiveCameraProps.near)
      object.near = perspectiveCameraProps.near;

    if (perspectiveCameraProps.zoom)
      object.zoom = perspectiveCameraProps.zoom;
    
    object.updateProjectionMatrix();
  }
  if (object instanceof three.Scene) {
    const sceneProps = props as PropsFromClass<three.Scene>;
    if (sceneProps.background  !== undefined)
      object.background = sceneProps.background;
    if (sceneProps.environment  !== undefined)
      object.environment = sceneProps.environment;

    if (sceneProps.fog  !== undefined)
      object.fog = sceneProps.fog;
    if (sceneProps.overrideMaterial !== undefined)
      object.overrideMaterial = sceneProps.overrideMaterial;
  }

  if (object instanceof three.Light) {
    const lightProps = props as PropsFromClass<three.Light>;
    if (lightProps.color)
      object.color.copy(lightProps.color)
    if (lightProps.intensity !== undefined)
      object.intensity = lightProps.intensity;
  }

  if (object instanceof three.Sprite) {
    const spriteProps = props as PropsFromClass<three.Sprite>;
    if (spriteProps.center)
      object.center.copy(spriteProps.center)
  }
};

