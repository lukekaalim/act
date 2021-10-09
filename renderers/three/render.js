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

export type Frame = {
  id: ?AnimationFrameID
}
*/

export const createThreeRenderer = (nodeDefs/*: NodeDefinition[]*/ = threeNodes)/*: ThreeRenderer*/ => {
  const nodeDefsByType = new Map(nodeDefs.map(def => [def.type, def]));

  const roots = new Map/*:: <CommitID, [WebGLRenderer, Scene, PerspectiveCamera, Frame]>*/();
  const objects = new Map();

  const createRoot = (diff) => {
    const { width, height, setStyle = false, background = null, alpha = false, onRender, sceneRef } = (diff.next.element.props/*: any*/);
    
    const renderer = new WebGLRenderer({ alpha });
    renderer.setSize(width, height, setStyle);
    const scene = new Scene();
    scene.background = background;
    const camera = new PerspectiveCamera( 75, width / height, 0.1, 1000 );
    camera.position.z = 5;

    const frame/*: Frame*/ = { id: null };

    const animate = (timestamp) => {
      onRender && onRender(timestamp);
      renderer.render( scene, camera );
      frame.id = requestAnimationFrame( animate );
    };
    frame.id = animate(performance.now());

    roots.set(diff.next.id, [renderer, scene, camera, frame]);
    return [renderer, scene, camera, frame];
  };
  const setRootProps = (diff, [renderer, scene, camera, frame]) => {
    const props = calculatePropsDiff(diff.prev.element.props, diff.next.element.props);
    const { width, height, setStyle = false, background = null, onRender } = (diff.next.element.props/*: any*/);

    if (props.has('width') || props.has('height') || props.has('setStyle')) {
      renderer.setSize(width, height, setStyle);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    if (props.has('background'))
      scene.background = background;
    if (props.has('onRender')) {
      frame.id && cancelAnimationFrame(frame.id);
      const animate = (timestamp) => {
        onRender && onRender(timestamp);
        renderer.render( scene, camera );
        frame.id = requestAnimationFrame( animate );
      };
      frame.id = animate(performance.now());
    }
  }

  const removeRenderer = (diff, [renderer, scene, camera, frame]) => {
    roots.delete(diff.next.id);
    renderer.dispose();
    frame.id && cancelAnimationFrame(frame.id);

    const { parentNode } = renderer.domElement;
    if (parentNode)
      parentNode.removeChild(renderer.domElement);
    return [];
  };

  const createObject = (diff) => {
    const { type } = diff.next.element;
    if (typeof type !== 'string')
      return null;
    if (type === 'act:null')
      return null;

    const nodeDef = nodeDefsByType.get(type);
    if (!nodeDef)
      throw new Error(`Unknown type ${type}`);

    const nodeInstance = nodeDef.create();
    objects.set(diff.next.id, nodeInstance);

    return nodeInstance;
  }

  const removeObject = (nodeInstance) => {
    nodeInstance.object.removeFromParent();
    nodeInstance.dispose();
  };

  const setRef = (diff, reference) => {
    if (diff.prev.pruned) {
      const { ref } = (diff.next.element.props/*: any*/);
      if (typeof ref === 'object')
        ref.current = reference;
      else if (typeof ref === 'function')
       ref(reference);
    } else if (diff.next.pruned) {
      const { ref } = (diff.next.element.props/*: any*/);
      if (typeof ref === 'object')
        ref.current = null;
      else if (typeof ref === 'function')
       ref(null);
    }
  };

  const renderObject = (diff/*: CommitDiff*/)/*: Object3D[]*/ => {
    const nodeInstance = objects.get(diff.next.id) || createObject(diff);

    setRef(diff, nodeInstance && nodeInstance.object)
    const children = diff.diffs.map(renderObject).flat(1);

    if (!nodeInstance)
      return children;
    
    if (diff.next.pruned)
      return (removeObject(nodeInstance), []);

    const props = calculatePropsDiff(diff.prev.element.props, diff.next.element.props);
    nodeInstance.update([...props.values()]);
    attachObjects(nodeInstance.object, children);
    
    return [nodeInstance.object];
  };
  const attachObjects = (scene, children) => {
    if (children.length > 0)
      scene.add(...children);
  };

  const renderRoot = (diff/*: CommitDiff*/)/*: Node[]*/ => {
    if (diff.next.element.type !== 'three')
      return [];

    const root = roots.get(diff.next.id) || createRoot(diff);

    setRef(diff, root[1]);
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
