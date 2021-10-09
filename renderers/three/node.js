// @flow strict
/*:: import type { Object3D } from "three"; */
/*:: import type { PropDiff } from '@lukekaalim/act-reconciler'; */ 
import { Group, Mesh, PointLight, Points } from "three";

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
          case 'scale':
            object.scale.copy((next/*: any*/)); break;
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

const groupDefinition = {
  type: 'group',
  create: () => {
    const object = new Group();
    const update = (props) => {
      for (const { key, next, prev } of props)
        switch (key) {
          case 'group':
            prev && object.remove((prev/*: any*/));
            next && object.add((next/*: any*/));
        }
    };
    const dispose = () => {

    };
    return { object, update, dispose };
  },
}

const constructorNodes/*: NodeDefinition[]*/ = [
  ['mesh', Mesh],
  ['pointLight', PointLight],
  ['points', Points],
].map(createNodeDefinitionFromConstructor);


export const threeNodes/*: NodeDefinition[]*/ = [
  ...constructorNodes,
  groupDefinition,
];