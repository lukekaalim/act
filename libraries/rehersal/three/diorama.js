// @flow strict
/*:: import type { Component, ElementNode } from '@lukekaalim/act'; */
/*:: import type { MeshProps, OrthographicCameraProps } from '@lukekaalim/act-three'; */
import { h, useRef } from "@lukekaalim/act";
import { useDisposable, useLookAt, useRenderLoop, useResizingRenderer, useWebGLRenderer } from "@lukekaalim/act-three";

import * as THREE from "@lukekaalim/act-three";
import {
  BoxGeometry,
  MeshStandardMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Vector3,
  Vector2,
  Color,
} from "three";

export const CubeMesh/*: Component<{ ...MeshProps, size: number, color?: Color }>*/ = ({
  size,
  color = new Color('white'),
  ...meshProps
}) => {
  const geometry = useDisposable(() =>
    new BoxGeometry(size, size, size),
    [size]);
  const material = useDisposable(() =>
    new MeshStandardMaterial({ color }),
    [color.toString()])

  return h(THREE.mesh, {
    ...meshProps,
    geometry,
    material,
  });
};

export const PlaneMesh/*: Component<{ ...MeshProps, size: Vector2, color: Color }>*/ = ({
  size,
  color,
  ...meshProps
}) => {
  const geometry = useDisposable(() =>
    new PlaneGeometry(size.x, size.y),
    [size.x, size.y]);
  const material = useDisposable(() =>
    new MeshStandardMaterial({ color, }),
    [color.toString()])

  return h(THREE.mesh, {
    ...meshProps,
    geometry,
    material,
  });
};

/*::
export type OrthographicDioramaProps = {
  cameraProps?: OrthographicCameraProps,
  canvasProps?: { [string]: mixed },
  canvasChildren?: ElementNode,
};
*/

export const OrthographicDiorama/*: Component<OrthographicDioramaProps>*/ = ({
  children,
  cameraProps = {},
  canvasProps = {},
  canvasChildren = null
}) => {
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const canvasRef = useRef(null);

  const renderer = useWebGLRenderer(canvasRef, { clearColor: 'white', antialias: true, shadowMap: { enabled: true } });
  useResizingRenderer(canvasRef, renderer);
  useRenderLoop(renderer, cameraRef, sceneRef, () => {}, [renderer]);

  useLookAt(cameraRef, new Vector3(0, 0, 0), [renderer]);

  return [
    h('canvas', { ...canvasProps, ref: canvasRef }),
    // dont bother loading the scene if the renderer isn't loaded
    !!renderer && h(THREE.scene, { ref: sceneRef }, [
      h(THREE.orthographicCamera, {
        ...cameraProps,
        position: new Vector3(50, 60, 50),
        ref: cameraRef,
        
        zoom: 3,
        //aspect: 380/190,

        left: -100,
        right: 100,
        top: 50,
        bottom: -50,
      }),
      h(THREE.ambientLight, { intensity: 0.8 }),
      h(THREE.directionalLight, {
        position: new Vector3(20, 100, 80),
        intensity: 0.4,
        castShadow: true,
        shadow: {
          camera: new OrthographicCamera(-32, 32, -32, 32, 0, 200),
          radius: 3,
          bias: -0.01,
          mapSize: new Vector2(256, 256)
        }
      }),
      children,
    ]),
  ]
};