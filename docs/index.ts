import { createContext, h, Props, useContext, useEffect, useState } from "@lukekaalim/act";
import { createReconciler } from "@lukekaalim/act-recon";
import { createDOMScheduler, createWebSpace, render, render as renderWeb } from "@lukekaalim/act-web";
import { InsightApp } from '@lukekaalim/act-insight';

import { Component, ErrorBoundary, primitiveNodeTypes, useMemo, useRef } from '@lukekaalim/act';
import { hs, HTML, SVG } from '@lukekaalim/act-web';
import { three, ThreeJS, node } from '@lukekaalim/act-three';
import { TextGeometry, FontLoader, Font } from 'three/addons';
import fontURL from 'three/examples/fonts/helvetiker_regular.typeface.json?url';

const material = new three.MeshBasicMaterial({ color: 'red' });

const loader = new FontLoader();
const font = await new Promise<Font>(r => loader.load(fontURL, font => r(font)));

const TestContext = createContext("EMPTY NAME");

const App = () => {
  const [name, setName] = useState("World");
  const ref = useRef<null | HTMLElement>(null);
  const refB = useRef<null | HTMLElement>(null);
  const refC = useRef<null | three.Mesh>(null);
  const refD = useRef<null | SVGElement>(null);
  const refE = useRef<null | HTMLCanvasElement>(null);
  const refF = useRef<null | three.PerspectiveCamera>(null);
  const refG = useRef<null | three.Scene>(null);

  useEffect(() => {
    console.log({ ref, refB, refC, refD })
  }, []);

  useEffect(() => {
    const canvas = refE.current;
    const camera = refF.current;
    const scene = refG.current;
    if (!canvas || !camera || !scene)
      return;

    const renderer = new three.WebGLRenderer({ canvas })
    const render = () => {
      renderer.render(scene, camera)
      id = requestAnimationFrame(render);

      if (refC.current) {
        refC.current.rotateY(Math.PI / 180);
      }
    }
    let id = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(id);
    }
  }, [!!name])

  const geometry = useMemo(() => {
    return new TextGeometry(`Hello, ${name}!`, { depth: 1, font, size: 5 }).center()
  }, [name])

  const [boundaryValue, setBoundaryValue] = useState<null | Error>(null);
  const [boundaryClearer, setBoundaryClearer] = useState(() => () => {});

  const [order, setOrder] = useState<'forward' | 'backward'>('forward');

  const [toggle, setToggle] = useState(false);

  return [
    hs('div', {}, [
      hs('input', {
        type: 'text',
        onInput: e => {
          const newName = (e.currentTarget as HTMLInputElement).value;
          setName(newName);
        },
        value: name
      }),
      h(Ticker),
      toggle && hs('button', { onClick: () => setToggle(!toggle) }, 'Off!'),
      !toggle && hs('button', { onClick: () => setToggle(!toggle) }, 'On!'),
      hs('button', { onClick: () => {
        boundaryClearer()
        setBoundaryClearer(() => () => {});
        setBoundaryValue(null);
      }}, 'Clear Boundary'),
      hs('pre', {}, boundaryValue && boundaryValue.toString()),
      h('br'),
      !!name && [
        hs('h3', {}, `Hello, ${name}!`),
        hs('p', {}, `Hello, ${name}!`),
        hs('div', { ref: refB }),
        h(ErrorBoundary, { onError: (value) => {
          //setBoundaryClearer(() => clear);
          setBoundaryValue(value as Error)
         } }, [
          h(Ticker),
        ]),
        h(primitiveNodeTypes.null, {}, [
          h(HTML, {}, h('p', { ref }, 'A child')),
        ]),
        h(SVG, {}, h('svg', { ref: refD, width: 300, height: 300 }, [
          h('text', { fill: 'blue', x: '0px', y: '20px' }, `Hello, ${name}!`),
          h('rect', { x: '50px', y: '50px', stroke: 'orange', 'stroke-width': '8px', fill: 'red', width: '50px', height: '50px' })
        ])),
        h('canvas', { ref: refE, width: 300, height: 300 }),
        h(primitiveNodeTypes.null, {}, [
          h(ThreeJS, {}, [
            h(node.scene, { ref: refG }, [
              h(node.mesh, { ref: refC, geometry, material }),
              h(node.perspectiveCamera, { ref: refF, position: new three.Vector3(0, 0, 100) }),
            ])
          ])
        ]),
        h(TestContext.Provider, { value: name }, h(ContextTester))
      ],
      h('br', { key: 10 }),
      h('button', { onClick: () => setOrder(order === 'forward' ? 'backward' : 'forward')}, 'Swap'),
      useMemo(() => order === 'forward' ? [
        h(A, { key: 'a' }),
        h(B, { key: 'b' }),
        h(C, { key: 'c' }),
      ] : [
        h(C, { key: 'c' }),
        h(B, { key: 'b' }),
        h(A, { key: 'a' }),
      ], [order])
    ]),
  ]
};

class TooHighError extends Error {}

const WrapMemo = <T extends Props>(component: Component<T>): Component<T> => {
  return function MemoWrappedComponent(props) {
    return useMemo(() => h(component, props), []);
  }
}

const ContextTester = () => {
  return useMemo(() => h(ChildValue), [])
}

const ChildValue = () => {
  const name = useContext(TestContext);

  return hs('pre', {}, `name=${name}`);
}

const Ticker = WrapMemo(function Ticker() {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    console.log('mount')
    return () => console.log('unmount')
  }, [counter])

  if (counter > 10) {
    throw new TooHighError(`:( I can't count that high. ${counter} is too big!`)
  }

  return  hs('button', { onClick: () => (setCounter(c => c + 1), setCounter(c => c + 1)) }, counter);
});

const A = () => h(RenderCounter, { key: 'a' });
const B = () => h(RenderCounter, { key: 'b' });
const C = () => h(RenderCounter, { key: 'c' });

const RenderCounter: Component = ({ key }) => {
  const [real_key] = useState(key)
  const renderCounter = useRef(0);

  renderCounter.current++;

  return hs('pre', {}, `key=${real_key} Rendered ${renderCounter.current} times`);
};

const main = () => {
  const root = document.getElementById('main_root');
  if (root)
    render(h(HTML, {}, h(App)), document.body);// tree => createThreeWebSpace(tree, root))
};

main();