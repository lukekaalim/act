// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import { useRef, useState, h } from '@lukekaalim/act';
import { useAnimatedNumber, useBezierAnimation } from '@lukekaalim/act-curve';

export const AnimatedNumberDemo/*: Component<>*/ = () => {
  const progressRef = useRef/*:: <?HTMLProgressElement>*/();
  const sampleRef = useRef/*:: <?HTMLElement>*/();
  const [value, setValue] = useState(0);

  const [anim] = useAnimatedNumber(value);

  useBezierAnimation(anim, (interpolatedValue) => {
    const { current: progress } = progressRef;
    const { current: sample } = sampleRef;
    if (!progress || !sample)
      return;
    progress.value = interpolatedValue;
    sample.textContent = interpolatedValue.toFixed(4);
  });

  const onInput = (event) => {
    setValue(event.target.valueAsNumber)
  };

  return h('div', { style: { display: 'flex', flexDirection: 'column', margin: 'auto', width: '50%' } }, [
    h('input', { type: 'range', value, onInput }),
    h('progress', { ref: progressRef, min: 0, max: 100 }),
    h('samp', { ref: sampleRef })
  ])
};