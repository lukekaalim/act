// @flow strict
/*:: import type { Page } from '@lukekaalim/act-rehersal'; */
import { useCurve, useChangeList } from '@lukekaalim/act-curve';
import { h, useEffect, useRef, useState } from '@lukekaalim/act';
import { Document, ExportDescription, Markdown, SyntaxCode } from '@lukekaalim/act-rehersal';
import readmeText from '@lukekaalim/act-curve/README.md?raw';
import curveHooksText from './curve_hooks.md?raw';


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


export const hooksPage/*: Page*/ = {
  link: { href: '/libraries/curve/hooks', name: 'Hooks', children: [] },
  content: h(Document, {}, h(Markdown, { text: curveHooksText, directives: {} })),
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

const oldContent = h(Document, {}, [
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
]);

const HookDemo = () => {
  const elementRef = useRef/*:: <?HTMLElement>*/();
  const [value, setValue] = useState(0);

  useCurve(
    value,
    (interpolatedValue) => {
      const { current: element } = elementRef;
      if (!element)
        return;
      // Perform imperetive animation within this function
      // using the "interpolated value"
      element.textContent = Math.floor(interpolatedValue).toString()
    }
  );

  const onInput = (event) => {
    setValue(event.target.valueAsNumber)
  };

  return [
    h('input', { type: 'range', value, onInput }),
    h('samp', { ref: elementRef })
  ]
};

/*::
type ElementState<T> = {
  key: mixed,
  value: T,
  added: DOMHighResTimeStamp,
  removed: null | DOMHighResTimeStamp,
};
*/


const FadingElement = ({ change, render, onDone }) => {
  const elementRef = useRef/*:: <?HTMLElement>*/(null);

  useCurve(change === 'exiting' ? 1 : 0, (p) => {
    const { current: element } = elementRef;
    if (!element)
      return;
  
    element.style.opacity = (1 - Math.abs(p)).toString();
    element.style.maxHeight = ((1 - Math.abs(p)) * 1.5).toString() + 'em';
    element.style.zIndex = p === 0 ? '1' : '0';
    if (p === 1) {
      onDone()
    }
  }, { start: change === 'entering' ? -1 : 0, duration: 1000 })

  return render(elementRef);
}

const TransitionDemo = () => {
  const [colorList, setColorList] = useState/*:: <string[]>*/(['red', 'blue', 'green']);
  const [nextColor, setNextColor] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    setColorList(l => [...new Set([...l, nextColor])]);
    setNextColor('');
  };
  const onColorClick = (color) => () => {
    setColorList(l => l.filter(c => c !== color));
  }
  const onNextColorInput = (e) => {
    setNextColor(e.target.value)
  }

  const [colorListChanges, animator] = useChangeList(colorList, { initialArray: colorList })

  return [
    h('form', { onSubmit }, [
      h('input', { type: 'text', value: nextColor, onInput: onNextColorInput }),
      h('button', { type: 'submit' }, 'Add New Color'),
    ]),
    h('ul', {}, [
      colorListChanges.map(([color, change]) =>
        h(FadingElement, { change, onDone: () => animator.remove(color), key: color, render: (ref) => [
          h('li', { ref, style: { position: 'relative' } },
            h('button', { 
              style: { backgroundColor: color, color: 'white' },
              onClick: onColorClick(color)
            }, color))
        ] }))
    ])
  ];
};

export const curvePage/*: Page*/ = {
  link: {
    href: '/libraries/curve',
    name: 'Curve',
    children: [hooksPage.link, animatorsPage.link, componentsPage.link, playersPage.link, advancedHooksPage.link]
  },
  content:  h(Document, {},
    h(Markdown, { text: readmeText, directives: { hook_demo: HookDemo, transition_demo: TransitionDemo } }))
}

export const curvePages = [
  curvePage,
  animatorsPage,
  componentsPage,
  advancedHooksPage,
  playersPage,
  hooksPage,
];
