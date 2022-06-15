// @flow strict

/*:: import type { Page } from "@lukekaalim/act-rehersal"; */
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { h, useEffect, useRef } from "@lukekaalim/act";
import { createObjectRenderer, useDisposable } from "@lukekaalim/act-three";
import { createWebRenderer, setNodeChildren } from "@lukekaalim/act-web";
import { createNullRenderer, createManagedRenderer } from "@lukekaalim/act-renderer-core";
import { Document, Markdown } from "@lukekaalim/act-rehersal";

import text from './custom.md?raw';
import { createTree } from "@lukekaalim/act-reconciler";
import {
  BoxGeometry,
  Color,
  MeshBasicMaterial,
  Vector3,
  WebGLRenderer,
} from "three";

const css2dObjectRenderer = createObjectRenderer((diff, parent) => {
  if (parent instanceof CSS2DObject)
    setNodeChildren(diff, parent.element, webRenderer.render(diff))
  return [];
}, () => new CSS2DObject())
const objectRenderer = createObjectRenderer((diff) => {
  switch (diff.next.element.type) {
    case 'css2dObject':
      return css2dObjectRenderer.render(diff);
    default:
      return objectRenderer.render(diff);
  }
});
const sceneRenderer = createNullRenderer(objectRenderer);
const webRenderer = createWebRenderer(diff => {
  switch (diff.next.element.type) {
    case 'scene':
      return sceneRenderer.render(diff);
    default:
      return webRenderer.render(diff)
  }
});

const MultiRendererComponent = () => {
  const rootRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const canvasRef = useRef();
  const innerDivRef = useRef();
  const meshRef = useRef();
  const css2dObjectRef = useRef();

  useEffect(() => {
    const { current: root } = rootRef;
    const { current: canvas } = canvasRef;
    const { current: scene } = sceneRef;
    const { current: camera } = cameraRef;
    const { current: mesh } = meshRef;
    if (!canvas || !scene || !camera || !mesh || !root) 
      return;
    
    const webgl = new WebGLRenderer({ canvas });
    const css2d = new CSS2DRenderer({ element: root });

    css2d.setSize(200, 200, false);

    const render = () => {
      mesh.rotateOnAxis(new Vector3(0, 1, 0), 0.01);

      webgl.render(scene, camera);
      css2d.render(scene, camera);
      frameId = requestAnimationFrame(render)
    }
    let frameId = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(frameId);
    }
  }, [])
  const geometry = useDisposable(() => new BoxGeometry(5, 5, 5));
  const material = useDisposable(() => new MeshBasicMaterial({ color: new Color('white') }));

  return h('div', { ref: rootRef, style: { position: 'relative' } }, [
    h('canvas', { ref: canvasRef, height: 200, width: 200, style: { position: 'absolute' } }),
    h('scene', { ref: sceneRef, background: new Color('red') }, [
      h('perspectiveCamera', { ref: cameraRef, position: new Vector3(0, 0, 20) }),
      h('mesh', { ref: meshRef, geometry, material }, [
        h('css2dObject', { ref: css2dObjectRef, position: new Vector3(5, 0, 0) }, [
          h('button', { ref: innerDivRef, onClick: () => alert('WEB!') }, 'Front')
        ]),
        h('css2dObject', { ref: css2dObjectRef, position: new Vector3(-5, 0, 0) }, [
          h('button', { ref: innerDivRef, onClick: () => alert('WEB!') }, 'Back')
        ]),
      ])
    ])
  ])
}

const Demo = () => {
  const rootRef = useRef/*:: <?HTMLDivElement>*/();

  useEffect(() => {
    const { current: root } = rootRef;
    if (!root)
      return;

    const onDiff = (diff) => {
      const nodes = webRenderer.render(diff)
      setNodeChildren(diff, root, nodes);
    }

    const options = {
      onDiff,
      scheduleWork: (c) => requestAnimationFrame(() => void c()),
      cancelWork: (t) => cancelAnimationFrame(t),
    };
    createTree(h(MultiRendererComponent), options);
  }, []);

  return h('div', { ref: rootRef });
}

const directives = {
  'demo': Demo
}

export const customRendererPage/*: Page*/ = {
  link: { name: 'Custom Renderer', href: '/renderers/custom', children: [] },
  content: h(Document, {}, h(Markdown, { text, directives }))
};
