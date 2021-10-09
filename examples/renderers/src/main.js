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
} from "three";
import { h, useEffect, useMemo, useRef, useState } from '@lukekaalim/act';
import { createThreeRenderer, threeNodes, render, C } from '@lukekaalim/act-three';
import { useCurve } from '@lukekaalim/act-curve';

const geometry = new BoxGeometry(1, 1, 1);
const material = new MeshBasicMaterial()

const pointsMat = new PointsMaterial({ color: 0x888888 })
const object = new Mesh(geometry, material);

const App = () => {
  const ref = useRef/*:: <?Points>*/();
  const [r, setR] = useState(0);

  const [color, setColor] = useState('#00ff00');
  const [[wx,wy,wz], setSize] = useState([1, 1, 1]);

  useCurve(r, r => ref.current && (
    ref.current.rotation.x = r
  ));

  material.color = new Color(color);
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

  const onRender = () => {
    const cube = ref.current;
    if (cube)
      cube.rotation.y += 0.01;
  }
  const onRef = console.log; 
  const [show, setShow] = useState(false);

  return [
    h('h1', {}, 'hello world!'),
    h('input', { type: 'range', min: 0, max: Math.PI * 10, step: 0.05, value: r, onInput: e => setR(e.currentTarget.valueAsNumber) }),
    h('input', { type: 'color', value: color, onChange: e => setColor(e.currentTarget.value) }),
    h('input', { type: 'text', value: JSON.stringify([wx, wy, wz]), onChange: e => setSize(JSON.parse(e.currentTarget.value)) }),
    h('button', { onClick: () => setShow(b => !b) }, 'Show!'),
    h(C.three, { width: windowSize.x / 2, height: windowSize.y / 2, updateStyle: true, onRender, ref: onRef }, [
      null,
      //h('particles'),
      //h(C.mesh, { ref, geometry, material }),
      show && h(C.group, { group: object }),
      h(C.points, { ref, geometry, material })
    ]),
  ];
};

const renderer = createThreeRenderer([
  ...threeNodes,
]);

const main = () => {
  const body = document.body;
  if (!body)
    throw new Error();
  
  render(h(App), body, renderer);
};

main();