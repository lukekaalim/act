// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { MeshProps, OrthographicCameraProps } from '@lukekaalim/act-three'; */
import { h, useState } from "@lukekaalim/act";
import { LookAtGroup, useDisposable, useRenderLoop, useWebGLRenderer } from "@lukekaalim/act-three";

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
};
*/

export const OrthographicDiorama/*: Component<OrthographicDioramaProps>*/ = ({ children, cameraProps = {}, canvasProps = {} }) => {
  const [scene, setScene] = useState(null);
  const [camera, setCamera] = useState(null);
  const [canvas, setCanvas] = useState(null);

  const renderer = useWebGLRenderer(canvas, { clearColor: 'white', antialias: true, shadowMap: { enabled: true } });
  useRenderLoop(renderer, camera, scene);

  return [
    h('canvas', { ...canvasProps, ref: setCanvas }),
    h(THREE.scene, { ref: setScene, }, [
      h(LookAtGroup, { target: new Vector3(0, 0, 0), position: new Vector3(50, 50, 50) }, [
        h(THREE.orthographicCamera, {
          ...cameraProps,
          ref: setCamera,
          
          zoom: 3,
          aspect: 380/190,

          left: -100,
          right: 100,
          top: 50,
          bottom: -50,
        }),
      ]),
      h(THREE.ambientLight, { intensity: 0.8 }),
      h(THREE.directionalLight, {
        position: new Vector3(20, 100, 80),
        intensity: 0.4,
        castShadow: true,
        shadow: {
          camera: new OrthographicCamera(-32, 32, -32, 32, 0, 200),
          radis: 3,
          bias: -0.01,
          mapSize: new Vector2(256, 256)
        }
      }),
      children,
    ]),
  ]
};