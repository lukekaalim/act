// @flow strict
import { h, useRef, useState } from '@lukekaalim/act';
import { render } from '@lukekaalim/act-web';
import { toWords } from 'number-to-words';

const App = () => {
  const ref = useRef();
  const ref2 = useRef();
  const [v, setV] = useState(0);
  const [duration, setDuration] = useState(1000);
  const [t, toggle] = useState(false);

  const v2 = t ? { x: 0, y: 0 } : { x: 150, y: 150 };

  return [
    h('p', { ref, style: { padding: 20, display: 'inline-block', position: 'relative' } }),
    h('br'),
    h('p', { ref: ref2, style: { padding: 20, display: 'inline-block', position: 'relative' } }),
    h('br'),
    h('input', { type: 'number', value: v, onInput: (e) => setV(e.target.valueAsNumber || 0) }),
    h('input', { type: 'number', value: duration, onInput: (e) => setDuration(e.target.valueAsNumber || 0) }),
    h('button', { onClick: () => toggle(!t) }, 'Toggle ' + t.toString())
  ];
};

const main = () => {
  render(h(App), (document.body/*: any*/));
};

main();