// @flow strict
/*:: import type { Object3D } from "three"; */
/*:: import type { PropDiff } from '@lukekaalim/act-reconciler'; */ 
import { Mesh, PointLight, Points } from "three";

/*::
export type NodeInstance = {
  object: Object3D,
  update: (props: PropDiff[]) => void,
  dispose: () => void,
};

export type NodeDefinition = {
  type: string,
  create: () => NodeInstance,
};
*/

const createNodeDefinitionFromConstructor = ([type, constructor])/*: NodeDefinition*/ => {
  const create = () => {
    const object = new constructor();
    const update = (props) => {
      for (const { key, next } of props)
        switch (key) {
          case 'position':
            object.position.copy((next/*: any*/)); break;
          case 'quaternion':
            object.quaternion.copy((next/*: any*/)); break;
          default:
            (object/*: any*/)[key] = next; break;
        }
    };
    const dispose = () => {
      return;
    };
    const instance = {
      object,
      update,
      dispose,
    };
    return instance;
  };
  return {
    type,
    create,
  }
};

export const threeNodes/*: NodeDefinition[]*/ = [
  ['mesh', Mesh],
  ['pointLight', PointLight],
  ['points', Points],
].map(createNodeDefinitionFromConstructor);

