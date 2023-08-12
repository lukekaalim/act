// @flow strict
/*::
import type { SceneProps } from "../components";
import type { Scene, Texture } from "three";
*/
import { Color } from "three";

/*::
export type PropSetters<T> = {
  [string]: (object: T, nextProp: any, prevProp: any) => void,
}
*/

export const scenePropSetters/*: PropSetters<Scene>*/ = {
  'background': (scene/*: Scene*/, prop/*: null | Color | Texture*/) => {
    if (scene.background instanceof Color && prop instanceof Color)
      scene.background.copy(prop)
    else
      scene.background = prop;
  }
}