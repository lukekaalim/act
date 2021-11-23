// @flow strict
/*:: import type { Page } from '@lukekaalim/act-rehersal'; */
import { useBezier, useBezierVelocity, useProgress } from '@lukekaalim/act-curve';
import { h, useRef, useState } from '@lukekaalim/act';
import { Document, NumberInput, TabbedToolbox, Workspace } from '@lukekaalim/act-rehersal';


const setProgressValue = (progressRef, value) => {
  const { current: element } = progressRef;
  if (element)
    element.value = value;
}

export const linearCurvePage/*: Page*/ = {
  link: { href: '/libraries/curve/constant', name: 'Curves', children: [] },
  content: h(() => {
    const constantRef = useRef/*:: <?HTMLProgressElement>*/(null);
    const linearRef = useRef/*:: <?HTMLProgressElement>*/(null);
    const progressRef = useRef/*:: <?HTMLProgressElement>*/(null);
    const cubicRef = useRef/*:: <?HTMLProgressElement>*/(null);
    const bezierRef = useRef/*:: <?HTMLProgressElement>*/(null);
    const bezierVelocityRef = useRef/*:: <?HTMLProgressElement>*/(null);
    const [value, setValue] = useState(0);
    const [duration, setDuration] = useState(1000);
    const [speed, setSpeed] = useState(10);

    useProgress(duration, v => setProgressValue(progressRef, v), [value])
    //useConstantInterpolation(value, interpolateNumber, duration, v => setProgressValue(constantRef, v), [value]);
    //useCubicEaseInterpolation(value, interpolateNumber, duration, v => setProgressValue(cubicRef, v), [value]);
    //useLinearInterpolation(value, interpolateNumber, (a, b) => Math.abs(a - b) / (speed / 1000), v => setProgressValue(linearRef, v), [value]);
    useBezier(value, value => setProgressValue(bezierRef, value));
    useBezierVelocity(value, velocity => setProgressValue(bezierVelocityRef, velocity + 50));

    return h(Workspace, {
      bench: [
        h(Document, {}, [
          h('label', {}, [
            h('div', {}, 'Progress'),
            h('progress', { ref: progressRef, style: { height: '50px', width: '100%' }, max: '1', min: '0', step: '0.01' })
          ]),
          h('label', {}, [
            h('div', {}, 'Constant [WIP]'),
            h('progress', { ref: constantRef, style: { height: '50px', width: '100%' }, max: '100', min: '0' })
          ]),
          h('label', {}, [
            h('div', {}, 'Linear [WIP]'),
            h('progress', { ref: linearRef, style: { height: '50px', width: '100%' }, max: '100', min: '0' })
          ]),
          h('label', {}, [
            h('div', {}, 'Cubic [WIP]'),
            h('progress', { ref: cubicRef, style: { height: '50px', width: '100%' }, max: '100', min: '0' })
          ]),
          h('label', {}, [
            h('div', {}, 'Bezier'),
            h('progress', { ref: bezierRef, style: { height: '50px', width: '100%' }, max: '100', min: '0' })
          ]),
          h('label', {}, [
            h('div', {}, 'Bezier Velocity'),
            h('progress', { ref: bezierVelocityRef, style: { height: '50px', width: '100%' }, max: '100', min: '0' })
          ]),
        ]),
      ],
      tools: h(TabbedToolbox, { tabs: {
        'controls': [
          h(NumberInput, { value, onInput: setValue, label: 'Target (unit)' }),
          h(NumberInput, { max: 100, value: speed, onChange: setSpeed, label: 'Speed (unit per second)' }),
          h(NumberInput, { value: duration, max: 10000, onChange: setDuration, label: 'Duration (milliseconds)' })
        ]
      } })
    })
  })
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
  link: { href: '/libraries/curve', name: '@lukekaalim/act-curve', children: [linearCurvePage.link] },
  content:  h(Document, { text })
}

export const curvePages = [
  curvePage,
  linearCurvePage,
];
