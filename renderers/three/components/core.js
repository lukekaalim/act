// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { Scene, Color, Texture, CubeTexture, Fog, Material } from "three"; */
/*:: import type { Object3DProps } from './object.js'; */


/*::
export type WebGLRendererProps = {
  
};
export type SceneProps = {
  ...Object3DProps<Scene>,
  autoUpdate?: ?boolean,
  background?: ?(Color | Texture | CubeTexture),
  environment?: ?Texture,
  fog?: ?Fog,
  overrideMaterial?: ?Material
};
*/

export const coreComponents = {
  webglRenderer: ('webglRenderer'/*: Component<WebGLRendererProps>*/),
  scene: ('scene'/*: Component<SceneProps>*/),
}
