// @flow strict
/*:: import type { Page } from '@lukekaalim/act-rehersal'; */
import { useCurve } from '@lukekaalim/act-curve';
import { h, useEffect, useRef, useState } from '@lukekaalim/act';
import { Document, ExportDescription, Markdown, SyntaxCode } from '@lukekaalim/act-rehersal';


import beachBallSrc from './beach_ball.png';
import { CurveCubeDemo, CurveScrollingNumbersDemo, FlippingButtonDemo, SlideShowDemo } from "./rehersal/demos";

const useCurveType = {
  type: 'function',
  arguments: [
    {
      name: 'target',
      type: 'number',
      description: 'The "target" value to curve towards. Changing this value will cause the animation to begin playing.'
    },
    {
      name: 'onUpdate',
      description: [
        `A function that will be called every frame. The "current" parameter will be closer to `,
        `the target each time, until the last call will be exactly the target value. `,
        `In this function, perform all the imperative animation work you want like updating colors, positions, or opacity.`
      ],
      type: {
        type: 'function',
        arguments: [{ name: 'current', type: 'number' }],
        return: 'any'
      }
    },
    {
      name: 'options',
      description: [
        `A function that will be called every frame. The "current" parameter will be closer to `,
        `the target each time, until the last call will be exactly the target value. `,
        `In this function, perform all the imperative animation work you want like updating colors, positions, or opacity.`
      ],
      type: {
        type: 'object',
        properties: [{ name: 'current', type: 'number' }],
        return: 'any'
      }
    }
  ],
  return: 'void',
};

const hooksContent = h(Document, {}, [
  h('h1', {}, 'Hooks'),
  h('p', {}, [
    `The easiest way to get animating a property is to use a curve hook. `,
    `These hooks allow you to interpolate between values, creating a smooth blending experience.`
  ]),
  h('p', {}, [
    `Without needing to get into the complexities of custom animators, you can `,
    `achieve some nice effects with just the useCurve hook.`
  ]),
  h('act:boundary', { fallback: ({ value }) => h('pre', {}, value.stack) }, [
    h('div', { style: { display: 'flex', flexDirection: 'row' } }, [
      h(CurveCubeDemo),
      h(CurveScrollingNumbersDemo),
    ]),
    h('div', { style: { display: 'flex', flexDirection: 'row' } }, [
      h(FlippingButtonDemo),
      h(SlideShowDemo)
    ])
  ]),
  h(ExportDescription, {
    name: 'useCurve',
    type: useCurveType,
    summary: [
      h('p', {}, [
        `A fairly basic hook, composed of a pre-built animator that converges to the target `,
        `over the course of 1000 milliseconds at most.`
      ]),
      h('p', {}, [
        `Internally, it uses a bezier animator `,
        `to maintain velocity when changing targets, and uses the Animator context to register `,
        `it's updates. `,
        /*
        `The "useCurve" hook contains a pre-built animator, interpolating between `,
        `the values you pick with a fixed duration. It's the simplest way to get started with your `,
        `animations.`
      ]),
      h('p', {}, [
        `"useCurve" has a couple built-in features: it will smoothly switch to a new target if the `,
        `values change quickly: so connecting it to continous user input (like a mouse or touchpad) `,
        `should still provide a smooth animation. This is because it will preserve the velocity of the `,
        `value (how quickly it is changing) and keeps track of it in the animator's internal state.`
      ]),
      h('p', {}, [
        `"onUpdate" is called every animation frame (as per requestAnimationFrame) - but only as long as `,
        `there is something to interpolate. Once the transition is complete - onUpdate won't be called until `,
        `value changes.`
      */
      ]),
      h('p', {}, [
        `For more control over the timing, consider using the Advanced Hooks.`
      ]),
    ],
    usage: [
      h(SyntaxCode, { code:
`import { h, useRef, useState } from '@lukekaalim/act';
import { useCurve } from '@lukekaalim/act-curves';

const MyComponent = () => {
  const ref = useRef();
  const [target, setTarget] = useState(50);
  useCurve(target, currentTarget => {
    ref.current.value = currentTarget;
  });

  return [
    h('pre', {}, \`Target: \${target}\`),
    h('progress', { ref, min: 0, max: 100 }),
    h('input', {
      min: 0,
      max: 100,
      type: 'range',
      value: target,
      onInput: e => setTarget(e.target.value)
    }),
  ];
};`
      }),
      h(() => {
        const ref = useRef();
        const [target, setTarget] = useState(50);
        useCurve(target, currentTarget => {
          ref.current.value = currentTarget;
        });
      
        return h('div', { style: { display: 'flex', flexDirection: 'column' } }, [
          h('pre', {}, `Target: ${target}`),
          h('progress', { ref, min: 0, max: 100, style: { display: 'block', width: '100%' } }),
          h('input', { type: 'range', value: target, onInput: e => setTarget(e.target.value) }),
        ]);
      }),
    ]
  })
]);

export const hooksPage/*: Page*/ = {
  link: { href: '/libraries/curve/hooks', name: 'Hooks', children: [] },
  content: hooksContent
}
export const animatorsPage/*: Page*/ = {
  link: { href: '/libraries/curve/animators', name: 'Animators', children: [] },
  content: []
}
export const componentsPage/*: Page*/ = {
  link: { href: '/libraries/curve/components', name: 'Components', children: [] },
  content: []
}
export const advancedHooksPage/*: Page*/ = {
  link: { href: '/libraries/curve/advanced-hooks', name: 'Advanced Hooks', children: [] },
  content: []
}
export const playersPage/*: Page*/ = {
  link: { href: '/libraries/curve/players', name: 'Players', children: [] },
  content: []
}

const text = `
# @lukekaalim/act-curve.

A hook library for working with fast-rendering changes.

## Install
${'```'}js
npm install @lukekaalim/act-rehersal
${'```'}
`;

export const curvePage/*: Page*/ = {
  link: {
    href: '/libraries/curve',
    name: 'Curve',
    children: [hooksPage.link, animatorsPage.link, componentsPage.link, playersPage.link, advancedHooksPage.link]
  },
  content:  h(Document, {}, [
    h(Markdown, { text }),
    h(Markdown, { text: `
# Curves

Some kinds of animations are important - they need to be snappy, communicate
some intent to the audience, and _not_ hog all the resources of your computer.

Assigning animations to work via the build-in state management tools for [@lukekaalim/act](https://act.luke.kaal.im)
may prove to be a bit too much for it's naive scheduler. As such, it is sometimes
best to take matters into your own hand, and use some more dedicated scheduling.
    ` }),
    h(() => {
      const [position, setPosition] = useState/*::<number>*/(-400);
      const ballRef = useRef();
      const targetRef = useRef();
      const onClick = () => {
        setPosition(p => -p);
      };
      useCurve(position, position => {
        ballRef.current.style.transform = `translate(${position}%) rotate(${position}deg)`;
      }, { duration: 1000 });
      useEffect(() => {
        targetRef.current.style.transform = `translate(${position}%)`;
      }, [position])

      return [
        h('div', { style: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' } }, [
          h('img', { ref: ballRef, src: beachBallSrc, width: '50', height: '50' }),
          h('hr', { ref: targetRef, style: { width: '50px'} }),
        ]),
        h('button', { onClick }, 'Move Ball')
      ];
    }),
    h(Markdown, { text: `
The provided animation libary  [@lukekaalim/act-curves](https://act.luke.kaal.im/libraries/curve) is all about
exposing useful animation primitives and hooks to a user so they can easily define simple relationships between
values and transitions.

We call the library _"Curves"_ because it's most interesting function is all about smoothly interpolating from
one value to another: instead of "abruptly stepping" to the next value, we "curve" there - visiting all intermediate
values as well along the way.
    ` }),
  ])
}

export const curvePages = [
  curvePage,
  animatorsPage,
  componentsPage,
  advancedHooksPage,
  playersPage,
  hooksPage,
];
