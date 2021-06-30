// @flow strict
import { h, useEffect, useRef, useState } from '@lukekaalim/act';
import { Cube, render, Three } from '@lukekaalim/act-three';
import { useCurve } from '@lukekaalim/act-curve';

const App = () => {
  const ref = useRef();
  const [r, setR] = useState(0);

  useCurve(r, r => ref.current && (
    ref.current.rotation.x = r
  ));
  useEffect(() => {
    let running = true;
    const frame = () => {
      const cube = ref.current;
      if (cube)
        cube.rotation.y += 0.01;

      if (running)
        requestAnimationFrame(frame)
    };
    frame();
    return () => running = false;
  }, [])

  return [
    h('h1', {}, 'hello world!'),
    h('input', { type: 'range', min: 0, max: Math.PI * 10, step: 0.05, value: r, onInput: e => setR(e.currentTarget.valueAsNumber) }),
    h(Three, { width: window.innerWidth / 2, height: window.innerHeight / 2, updateStyle: true }, [
      h(Cube, { ref }),
    ]),
  ];
};

const main = () => {
  const body = document.body;
  if (!body)
    throw new Error();
  
  render(h(App), body);
};

main();