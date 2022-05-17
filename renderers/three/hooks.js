// @flow strict
/*:: import type { Ref } from '@lukekaalim/act'; */
/*:: import type {
  Camera,
  Scene,
  Texture,
  Object3D,
  PerspectiveCamera,
  OrthographicCamera,
} from "three"; */
import { TextureLoader, Vector2, WebGLRenderer } from "three";

import { useEffect, useState } from "@lukekaalim/act";
import { useRef } from "@lukekaalim/act";


/*::
export type WebGLOptions = {
  antialias?: boolean,
  alpha?: boolean,

  shadowMap?: {
    enabled?: boolean,
    autoUpdate?: boolean,
    type?: number,
  }
};
*/

export const useWebGLRenderer = (
  canvasRef/*: Ref<?HTMLCanvasElement>*/,
  options/*: WebGLOptions*/ = {},
  deps/*: mixed[]*/ = []
)/*: ?WebGLRenderer*/ => {
  const [renderer, setRenderer] = useState/*:: <?WebGLRenderer>*/(null);
  useEffect(() => {
    const { current: canvas } = canvasRef; 
    if (!canvas)
      return;
    
    const renderer = new WebGLRenderer({ ...options, canvas });
    renderer.shadowMap.enabled = options.shadowMap?.enabled || false;
    setRenderer(renderer);

    return () => {
      setRenderer(null);
      renderer.dispose();
    }
  }, deps);

  return renderer;
};

// Resize the canvas's resolution whenever it changes size
// useful for when the canvas is some percentage of the screen
// like: width: 100%
export const useResizingRenderer = (
  canvasRef/*: Ref<?HTMLCanvasElement>*/,
  renderer/*: ?WebGLRenderer*/,
  cameraRef/*: ?Ref<?PerspectiveCamera>*/ = null,
)/*: ?Vector2*/ => {
  const [size, setSize] = useState(null)
  useEffect(() => {
    const { current: canvas } = canvasRef; 
    const { current: camera } = (cameraRef || { current: null })
    if (!canvas || !renderer)
      return null;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries.filter(e => e.target === canvas)) {
        const width = entry.contentBoxSize[0].inlineSize;
        const height = entry.contentBoxSize[0].blockSize;
        const size = new Vector2(width, height);
        setSize(size);
        renderer.setSize(width, height, false);
        if (camera) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
      }
    });
    observer.observe(canvas, { box: 'content-box' });

    return () => {
      observer.unobserve(canvas);
      setSize(null);
    }
  }, [renderer]);

  return size;
}

export const useAnimationFrame = (
  onAnimate/*: ?(now: DOMHighResTimeStamp, delta: number) => mixed*/ = null,
  deps/*: mixed[]*/ = []
) => {
  useEffect(() => {
    if (!onAnimate)
      return;
    
    let lastFrame = performance.now();
    const animate = (now) => {
      const delta = now - lastFrame;
      lastFrame = now;

      onAnimate(now, delta);
      id = requestAnimationFrame(animate);
    };
    let id = requestAnimationFrame(animate);

    return () => {
      if (id)
        cancelAnimationFrame(id);
    }
  }, deps);
}

export const useRenderLoop = /*:: <TCamera: Camera, TScene: Object3D>*/(
  renderer/*: ?WebGLRenderer*/,
  camera/*: Ref<?TCamera>*/,
  scene/*: Ref<?TScene>*/,
  onAnimate/*: (now: DOMHighResTimeStamp, delta: number) => mixed*/ = (_, __) => {},
  deps/*: mixed[]*/ = []
) => {
  const renderFunction = renderer && ((now, delta) => {
    onAnimate(now, delta);
    if (camera.current && scene.current)
      renderer.render(scene.current, camera.current);
  });

  useEffect(() => {
    if (renderFunction)
      renderFunction(performance.now(), 0);
  }, [renderer, ...deps])

  useAnimationFrame(renderFunction, [renderer, ...deps])
}

/*::
export interface Disposable {
  dispose(): void;
}
*/

export const useDisposable = /*:: <T: Disposable>*/(
  create/*: () => T*/,
  deps/*: mixed[]*/ = []
)/*: T*/ => {
  const [resource, setResource] = useState/*:: <T>*/(() => create());
  const disposedRef = useRef(false);

  useEffect(() => {
    const { current: disposed } = disposedRef

    if (disposed) {
      setResource(create());
      disposedRef.current = false;
    }
  
    return () => {
      resource.dispose();
      disposedRef.current = true;
    }
  }, deps);
  return resource;
};

export const useTexture = (url/*: string*/)/*: Texture*/ => {
  const [texture, setTexture] = useState(null)
  useEffect(() => {
    const loader = new TextureLoader();

    const texture = loader.load(url);
    setTexture(texture);
    
    return () => {
      texture.dispose();
    }
  }, []);

  if (!texture)
    throw { type: 'loading' };
  
  return texture;
};


export * from './hooks/matrix.js';