// @flow strict
/*:: import type { CommitDiff } from '@lukekaalim/act-reconciler'; */
/*:: import type { Object3D } from 'three'; */
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer } from 'three';

/*::
export type ThreeRenderer = {
  renderRoot: CommitDiff => Node[],
};
*/

export const createThreeRenderer = ()/*: ThreeRenderer*/ => {
  const roots = new Map();
  const objects = new Map();

  const createRoot = (diff) => {
    const renderer = new WebGLRenderer();
    const { width, height, setStyle = false } = (diff.next.element.props/*: any*/);
    
    renderer.setSize(width, height, setStyle);
    const scene = new Scene();
    const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.z = 5;

    const animate = () => {
      renderer.render( scene, camera );
      requestAnimationFrame( animate );
    };
    animate();

    roots.set(diff.next.id, [renderer, scene, camera]);
    return [renderer, scene, camera];
  };

  const removeRenderer = (diff, [renderer, scene, camera]) => {
    roots.delete(diff.next.id);
    renderer.dispose();

    const { parentNode } = renderer.domElement;
    if (parentNode)
      parentNode.removeChild(renderer.domElement);
    return [];
  };

  const createObject = (diff) => {
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial( { color: '#00ff00' } );
    const cube = new Mesh( geometry, material );

    objects.set(diff.next.id, cube);

    return cube;
  }

  const renderObject = (diff/*: CommitDiff*/)/*: Object3D[]*/ => {
    const object = objects.get(diff.next.id) || createObject(diff);

    const { ref } = (diff.next.element.props/*: any*/);
    if (diff.prev.pruned && typeof ref === 'object' && ref)
      ref.current = object;
  
    return [object];
  };
  const attachObjects = (scene, children) => {
    scene.add(...children);
  };

  const renderRoot = (diff/*: CommitDiff*/)/*: Node[]*/ => {
    if (diff.next.element.type !== 'Three')
      return [];

    const root = roots.get(diff.next.id) || createRoot(diff);

    const children = diff.diffs.map(renderObject).flat(1);

    if (diff.next.pruned)
      return removeRenderer(diff, root);
    
    const [renderer, scene] = root;
    attachObjects(scene, children);

    return [renderer.domElement];
  }

  return {
    renderRoot,
  }
};
