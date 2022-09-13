// @flow strict
import {
  MeshBasicMaterial,
  BoxGeometry,
  Color,
  Mesh,
  Points,
  BufferGeometry,
  Vector3,
  BufferAttribute,
  PointsMaterial,
  PerspectiveCamera,
  Euler,
  GridHelper,
  Matrix4,
  Quaternion,
} from "three";
import { h, useEffect, useMemo, useRef, useState, createContext, useContext } from '@lukekaalim/act';
import { render, scene, group, points, perspectiveCamera } from '@lukekaalim/act-three';
import * as a3 from '@lukekaalim/act-three';

const geometry = new BoxGeometry(1, 1, 1);
const material = new MeshBasicMaterial()

const pointsMat = new PointsMaterial({ color: 0x888888, size: 0.1 })
const object = new Mesh(geometry, material);

const a = createContext(null);
const b = createContext(null);

const App = () => {
  const ref = useRef/*:: <?Points>*/();
  const [r, setR] = useState(0);

  const [color, setColor] = useState('#00ff00');
  const [[wx,wy,wz], setSize] = useState([1, 1, 1]);

  material.color = new Color(color);
  pointsMat.color = material.color;
  const geometry = useMemo(() => new BoxGeometry(wx,wy,wz), [wx,wy,wz])
  const pointGeo = useMemo(() => {
    const geo = new BufferGeometry();
    const vertices = new Float32Array( [
      -1.0, -1.0,  1.0,
       1.0, -1.0,  1.0,
       1.0,  1.0,  1.0,
    
       1.0,  1.0,  1.0,
      -1.0,  1.0,  1.0,
      -1.0, -1.0,  1.0
    ] );
    geo.setAttribute('position', new BufferAttribute(vertices, 3 ));
    return geo;
  }, []);
  const [windowSize, setWindowSize] = useState({ x: window.innerWidth, y: window.innerHeight });
  useEffect(() => {
    window.addEventListener('resize', () => {
      setWindowSize({ x: window.innerWidth, y: window.innerHeight });
    });
  }, []);

  const onRender = (t, r, s) => {
    const cube = ref.current;
    if (cube)
      cube.rotation.y += 0.01;
  }
  const [show, setShow] = useState(false);
  const camera = useMemo(() => {
    return new PerspectiveCamera();
  }, [])

  const grid = useMemo(() => new GridHelper());

  const [cameraRotation, setCameraRotation] = useState/*:: <Euler>*/(new Euler(0, 0, 0));
  const size = { width: windowSize.x / 2, height: windowSize.y / 2, updateStyle: true };

  useMemo(() => {
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
  }, [camera, windowSize])

  const [cameraPosition, setCameraPosition] = useState/*:: <Vector3>*/(new Vector3(0, 1, 5));
  const [cameraFocusPosition, setCameraFocusPosition] = useState(new Vector3(0, 0, 0));

  useEffect(() => {
    const onKeyUp = (e/*: KeyboardEvent*/) => {
      console.log(e.code);
      switch (e.code) {
        case 'KeyW':
          return setCameraPosition(v => v.clone().add(new Vector3(0, 0, 1)));
        case 'KeyS':
          return setCameraPosition(v => v.clone().add(new Vector3(0, 0, -1)));
        case 'KeyA':
          return setCameraPosition(v => v.clone().add(new Vector3(-1, 0, 0)));
        case 'KeyD':
          return setCameraPosition(v => v.clone().add(new Vector3(1, 0, 0)));
      }
    };
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keyup', onKeyUp);
    }
  }, []);

  const matrix = new Matrix4()
    .lookAt(cameraPosition, cameraFocusPosition, new Vector3(0,1,0));
  const cameraQuaternion = new Quaternion().setFromRotationMatrix(matrix);

  return [
    h('h1', {}, 'hello world!'),
    h(a.Provider, { value: r }, [
      h(b.Provider, { value: null }, [
        h('h2', {}, 'Testing context!')
      ])
    ]),
    h('input', { type: 'range', min: 0, max: Math.PI * 10, step: 0.05, value: r, onInput: e => setR(e.currentTarget.valueAsNumber) }),
    h('input', { type: 'color', value: color, onInput: e => setColor(e.currentTarget.value) }),
    h('input', { type: 'text', value: JSON.stringify([wx, wy, wz]), onChange: e => setSize(JSON.parse(e.currentTarget.value)) }),
    h('button', { onClick: () => setShow(b => !b) }, 'Show!'),
    h('button', { onClick: () => setCameraRotation(b => new Euler(b.x, b.y, b.z + (Math.PI / 16))) }, 'spin!!'),
    h('br'),
  ];
};

const main = () => {
  const body = document.body;
  if (!body)
    throw new Error();
  
  render(h(App), body);
};

main();