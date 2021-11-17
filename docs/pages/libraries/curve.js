// @flow strict
/*:: import type { Page } from '@lukekaalim/act-rehersal'; */
import { useConstantInterpolation, useCubicEaseInterpolation, useLinearInterpolation, useProgress } from '@lukekaalim/act-curve';
import { h, useRef, useState } from '@lukekaalim/act';
import { Document, GridBench, NumberInput, TabbedToolbox, Workspace } from '@lukekaalim/act-rehersal';

const clamp = (value, ...bounds) => {
  const lowerBound = Math.min(...bounds);
  const upperBound = Math.max(...bounds);

  return Math.min(upperBound, Math.max(lowerBound, value));
};
const interpolateNumber = (to, from, progress) => clamp(from + ((to - from) * (progress)), from, to);
const createProgressInterpolater = (progressRef) => (to, from, progress) => {
  const value = interpolateNumber(to, from, progress);

  const { current: element } = progressRef;
  if (element)
    element.value = Math.floor(value);

  return value;
}
const withRefElement = (ref, callback) => {
  const { current: element } = ref;
  if (element)
    callback(element);
}
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
    const [value, setValue] = useState(0);
    const [duration, setDuration] = useState(1000);
    const [speed, setSpeed] = useState(10);

    useProgress(duration, (progress) => withRefElement(progressRef, element => element.value = progress), [value])
    useConstantInterpolation(value, interpolateNumber, duration, v => setProgressValue(constantRef, v), [value]);
    useCubicEaseInterpolation(value, interpolateNumber, duration, v => setProgressValue(cubicRef, v), [value]);
    useLinearInterpolation(value, interpolateNumber, (a, b) => Math.abs(a - b) / (speed / 1000), v => setProgressValue(linearRef, v), [value]);

    return h(Workspace, {
      bench: [
        h('label', {}, [
          h('div', {}, 'Progress'),
          h('progress', { ref: progressRef, style: { height: '50px', width: '100%' }, max: '1', min: '0', step: '0.01' })
        ]),
        h('label', {}, [
          h('div', {}, 'Constant'),
          h('progress', { ref: constantRef, style: { height: '50px', width: '100%' }, max: '100', min: '0' })
        ]),
        h('label', {}, [
          h('div', {}, 'Linear'),
          h('progress', { ref: linearRef, style: { height: '50px', width: '100%' }, max: '100', min: '0' })
        ]),
        h('label', {}, [
          h('div', {}, 'Cubic'),
          h('progress', { ref: cubicRef, style: { height: '50px', width: '100%' }, max: '100', min: '0' })
        ]),
      ],
      tools: h(TabbedToolbox, { tabs: {
        'controls': [
          h(NumberInput, { value, onChange: setValue, label: 'Target (unit)' }),
          h(NumberInput, { max: 100, value: speed, onChange: setSpeed, label: 'Speed (unit per second)' }),
          h(NumberInput, { max: 1000, value: duration, onChange: setDuration, label: 'Duration (milliseconds)' })
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
