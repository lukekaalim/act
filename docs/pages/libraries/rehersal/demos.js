// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */

import { h, useState } from "@lukekaalim/act";
import { CubeMesh, OrthographicDiorama, PlaneMesh } from "@lukekaalim/act-rehersal";
import { useCurve, Vector2 } from "@lukekaalim/act-curve";
import {
  Vector3,
  Color,
  Euler,
} from "three";
import cat from './cat.png';

import styles from './demos.module.css';

export const CurveCubeDemo/*: Component<>*/ = ({ }) => {
  const [active, setActive] = useState(false)
  const [mesh, setMesh] = useState(null);

  useCurve(active ? 1 : 0, y => {
    if (!mesh)
      return;
    mesh.position.set(0, 5 + (y * 15), 0);
    mesh.rotation.set(0, y * Math.PI * 2, 0);
  }, { duration: 1000, impulse: 3 });

  const onCanvasClick = () => {
    setActive(!active);
  };
  
  return [
    h(OrthographicDiorama, {
      canvasProps: { width: 360, height: 190, onClick: onCanvasClick },
      cameraProps: { position: new Vector3(0, 10, 0) }
    }, [
      h(CubeMesh, {
        size: 10,
        color: new Color('rgb(128, 179, 238)'),
        ref: setMesh,
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

  useCurve(value, value => {
    if (container)
      container.style.transform = `translate(0px, ${-(value % 10) * 20}px)`;
  })

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
  const [value, setValue] = useState(false);

  const [onButton, setOnButton] = useState(null);
  const [offButton, setOffButton] = useState(null);
  const [container, setContainer] = useState(null)

  useCurve(value ? 1 : 0, (value) => {
    if (!onButton || !offButton || !container)
      return;

    onButton.style.opacity = 1-value;
    offButton.style.opacity = value;
    onButton.style.pointerEvents = value < 0.5 ? 'all' : 'none';
    offButton.style.pointerEvents = value > 0.5 ? 'all' : 'none';
    onButton.style.transform = `rotate3d(0, 1, 0, ${value * 180}deg)`;
    offButton.style.transform = `rotate3d(0, 1, 0, ${(1-value) * -180}deg)`;

    container.style.background = `linear-gradient(${720 * value}deg, rgba(34,193,195,1) 0%, rgba(253,187,45,1) 100%)`
  });

  const onClick = () => {
    setValue(v => !v);
  }

  return [
    h('div', { ref: setContainer, style: { position: 'relative', width: '360px', height: '190px' }, className: styles.flippingButtonDemo }, [
      h('button', { ref: setOnButton, className: styles.flippingButton, style: { pointerEvents: value ? 'none' : 'all' }, onClick }, 'Turn On'),
      h('button', { ref: setOffButton, className: styles.flippingButton, onClick }, 'Turn Off'),
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

  useCurve(slide, (slide) => {
    if (!container)
      return;
    container.style.transform = `translate(${-slide * 360}px)`;
  }, { duration: 1000, impulse: 3 })

  return [
    h('div', { className: styles.slideShow, onClick: () => setSlide((slide + 1) % slides.length) }, [
      h('div', { ref: setContainer, className: styles.slideShowContainer }, [
        slides.map(s => h('div', { className: styles.slide }, h('div', { className: styles.slideContainer }, s)))
      ])
    ])
  ]
};