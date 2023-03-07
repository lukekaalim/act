// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { Mesh } from "three"; */

import { h, useRef, useState } from "@lukekaalim/act";
//import { CubeMesh, OrthographicDiorama, PlaneMesh } from "@lukekaalim/act-rehersal";
import { useAnimatedNumber, useBezierAnimation } from "@lukekaalim/act-curve";
import {
  Vector3,
  Vector2,
  Color,
  Euler,
} from "three";
import cat from './assets/cat.png';

import styles from './examples.module.css';

export const CurveCubeDemo/*: Component<>*/ = ({ }) => {
  const meshRef = useRef/*:: <?Mesh>*/(null)
  const [active, setActive] = useState(false)
  const [showInstruction, setShowInstruction] = useState(true);

  const [animation] = useAnimatedNumber(active ? 1 : 0, 0, { duration: 1000, impulse: 3 });

  useBezierAnimation(animation, ({ position }) => {
    const { current: mesh } = meshRef;
    if (!mesh)
      return;
    mesh.position.set(10, 5 + (position * 15), 10);
    mesh.rotation.set(0, position * Math.PI * 2, 0);
  })

  const onCanvasClick = () => {
    setActive(!active);
    //setShowInstruction(false);
  };
  
  return [
    h(OrthographicDiorama, {
      canvasProps: { width: 360, height: 190, onClick: onCanvasClick },
    }, [
      h(CubeMesh, {
        size: 10,
        color: new Color('rgb(128, 179, 238)'),
        ref: meshRef,
        castShadow: true
      }),
      h(PlaneMesh, {
        size: new Vector2(150, 150),
        color: new Color('rgb(232, 211, 211)'),
        receiveShadow: true, 
        rotation: new Euler(-1.5708, 0, 0)
      })
    ]),
  ]
};


const ScrollingDigit = ({ value }) => {
  const [container, setContainer] = useState();

  const [anim] = useAnimatedNumber(value, 0, { duration: 1000, impulse: 1 });

  useBezierAnimation(anim, ({ position }) => {
    if (container)
      container.style.transform = `translate(0px, ${-(position % 10) * 20}px)`;
  });

  return h('div', { className: styles.scrollingDigitWindow }, [
    h('div', { ref: setContainer, className: styles.scrollingDigitContainer }, [
      Array.from({ length: 10 })
      .map((_, i) =>
        h('div', {}, i))
    ])
  ]);
}

const getDigitOfNumber = (value, digitIndex) => {
  const remainder = value % Math.pow(10, digitIndex);
  const digit = Math.floor(remainder / Math.pow(10, digitIndex-1));
  return digit;
}

export const CurveScrollingNumbersDemo/*: Component<>*/ = () => {
  const [value, setValue] = useState(0);
  
  return [
    h('div', { className: styles.scrollingNumberDemoContainer }, [
      h('div', { className: styles.scrollingNumber }, [
        h(ScrollingDigit, { value: getDigitOfNumber(value, 3) }),
        h(ScrollingDigit, { value: getDigitOfNumber(value, 2) }),
        h(ScrollingDigit, { value: getDigitOfNumber(value, 1) }),
      ]),
      h('input', { type: 'range', min: 0, max: 999, step: 1, value, onInput: e => setValue(e.target.valueAsNumber) })
    ]),
  ];
}


export const FlippingButtonDemo/*: Component<>*/ = () => {
  const [value, setValue] = useState/*:: <number>*/(0);

  const buttonRef = useRef/*::<?HTMLButtonElement>*/(null);
  const [container, setContainer] = useState(null)

  const [anim] = useAnimatedNumber(value, 0, { duration: 500, impulse: 3 });
  
  useBezierAnimation(anim, ({ position }) => {
    const { current: button } = buttonRef;
    if (!button || !container)
      return;

    button.style.transform = `rotate3d(0, 1, 0, ${(((position * 180) + 90) % 180) - 90}deg)`;
    button.textContent = Math.round(position).toString();

    const colorA = `hsl(${Math.floor(position * 20)}, 70%, 70%)`;
    const colorB = `hsl(${Math.floor((position * 20) + 20)}, 70%, 70%)`;
    const colorC = `hsl(${Math.floor((position * 20) + 40)}, 70%, 70%)`;

    container.style.background = `linear-gradient(0deg, ${colorA} 0%, ${colorB} 50%, ${colorC} 100%)`
  });

  const onClick = () => {
    setValue(v => v + 1);
  }

  return [
    h('div', { ref: setContainer, style: { position: 'relative', width: '360px', height: '190px' }, className: styles.flippingButtonDemo }, [
      h('button', { ref: buttonRef, className: styles.flippingButton, onClick }),
    ]),
  ]
};

const slides = [
  [h('h2', {}, 'My Slideshow'), h('p', {}, 'Click the slide advance')],
  [h('p', {}, 'This is the next slide')],
  [h('p', {}, 'here comes a cat!')],
  [h('img', { src: cat, height: 100 })],
];

export const SlideShowDemo/*: Component<>*/ = () => {
  const [slide, setSlide] = useState(0);
  const [container, setContainer] = useState(null);

  const [anim] = useAnimatedNumber(slide, 0, { duration: 1000, impulse: 3 });

  useBezierAnimation(anim, ({ position }) => {
    if (!container)
      return;
    container.style.transform = `translate(${-position * 360}px)`;
  })

  return [
    h('div', { className: styles.slideShow, onClick: () => setSlide((slide + 1) % slides.length) }, [
      h('div', { ref: setContainer, className: styles.slideShowContainer }, [
        slides.map(s => h('div', { className: styles.slide }, h('div', { className: styles.slideContainer }, s)))
      ])
    ])
  ]
};

export const DemosContainer/*: Component<>*/ = () => {
  return [
    h('div', { style: { display: 'flex', flexDirection: 'column' } }, [
      h('div', { style: { display: 'flex', flexDirection: 'row' } }, [
        h(CurveCubeDemo),
        h(CurveScrollingNumbersDemo),
      ]),
      h('div', { style: { display: 'flex', flexDirection: 'row' } }, [
        h(FlippingButtonDemo),
        h(SlideShowDemo),
      ])
    ])
  ]
}