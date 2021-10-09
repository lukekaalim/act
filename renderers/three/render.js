// @flow strict
/*:: import type { CommitDiff, PropDiff, CommitID } from '@lukekaalim/act-reconciler'; */
/*:: import type { Object3D } from 'three'; */
/*:: import type { NodeDefinition } from './node.js'; */
import {  PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { threeNodes } from './node.js';
import { calculatePropsDiff } from '@lukekaalim/act-reconciler'

/*::
export type ThreeRenderer = {
  renderRoot: CommitDiff => Node[],
};
*/

export const createThreeRenderer = (nodeDefs/*: NodeDefinition[]*/ = threeNodes)/*: ThreeRenderer*/ => {
  const nodeDefsByType = new Map(nodeDefs.map(def => [def.type, def]));

  const roots = new Map/*:: <CommitID, [WebGLRenderer, Scene, PerspectiveCamera]>*/();
  const objects = new Map();

  const createRoot = (diff) => {
    const { width, height, setStyle = false, background = null, alpha = false } = (diff.next.element.props/*: any*/);
    
    const renderer = new WebGLRenderer({ alpha });
    renderer.setSize(width, height, setStyle);
    const scene = new Scene();
    scene.background = background;
    const camera = new PerspectiveCamera( 75, width / height, 0.1, 1000 );
    camera.position.z = 5;

    const animate = () => {
      renderer.render( scene, camera );
      requestAnimationFrame( animate );
    };
    animate();

    roots.set(diff.next.id, [renderer, scene, camera]);
    return [renderer, scene, camera];
  };
  const setRootProps = (diff, [renderer, scene, camera]) => {
    const props = calculatePropsDiff(diff.prev.element.props, diff.next.element.props);
    const { width, height, setStyle = false, background = null, alpha = false } = (diff.next.element.props/*: any*/);

    if (props.has('width') || props.has('height') || props.has('setStyle')) {
      renderer.setSize(width, height, setStyle);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    if (props.has('background'))
      scene.background = background;
  }

  const removeRenderer = (diff, [renderer, scene, camera]) => {
    roots.delete(diff.next.id);
    renderer.dispose();

    const { parentNode } = renderer.domElement;
    if (parentNode)
      parentNode.removeChild(renderer.domElement);
    return [];
  };

  const createObject = (diff) => {
    const { type } = diff.next.element;
    if (typeof type !== 'string')
      return null;

    const nodeDef = nodeDefsByType.get(type);
    if (!nodeDef)
      throw new Error(`Unknown type ${type}`);

    const nodeInstance = nodeDef.create();
    objects.set(diff.next.id, nodeInstance);

    return nodeInstance;
  }

  const removeObject = (nodeInstance) => {
    nodeInstance.dispose();
  };

  const renderObject = (diff/*: CommitDiff*/)/*: Object3D[]*/ => {
    const nodeInstance = objects.get(diff.next.id) || createObject(diff);

    const { ref } = (diff.next.element.props/*: any*/);
    if (diff.prev.pruned && typeof ref === 'object' && ref)
      ref.current = nodeInstance && nodeInstance.object;

    const children = diff.diffs.map(renderObject).flat(1);

    if (!nodeInstance)
      return children;
    
    if (diff.next.pruned)
      return (removeObject(nodeInstance), []);

    const props = calculatePropsDiff(diff.prev.element.props, diff.next.element.props);
    nodeInstance.update([...props.values()]);
    
    return [nodeInstance.object];
  };
  const attachObjects = (scene, children) => {
    scene.add(...children);
  };

  const renderRoot = (diff/*: CommitDiff*/)/*: Node[]*/ => {
    if (diff.next.element.type !== 'three')
      return [];

    const root = roots.get(diff.next.id) || createRoot(diff);

    const children = diff.diffs.map(renderObject).flat(1);

    if (diff.next.pruned)
      return removeRenderer(diff, root);
    
    const [renderer, scene] = root;
    setRootProps(diff, root);
    attachObjects(scene, children);

    return [renderer.domElement];
  }

  return {
    renderRoot,
  }
};
