// @flow strict
import { h, useState } from '@lukekaalim/act';
import { render } from '@lukekaalim/act-web';
import { useCurve, useCurves } from '@lukekaalim/act-curve';
import { toWords } from 'number-to-words';

const App = () => {
  const [ref, setRef] = useState/*:: <?HTMLElement>*/(null);
  const [ref2, setRef2] = useState/*:: <?HTMLElement>*/(null);
  const [v, setV] = useState(0);
  const [duration, setDuration] = useState(1000);
  const [t, toggle] = useState(false);

  useCurve(v, x => ref && (
    ref.style.transform = `translate(${x}px)`,
    ref.textContent = toWords(x),
    ref.style.backgroundColor = `hsl(${Math.floor(x) % 360}, 70%, 80%)`
  ), { duration });

  const v2 = t ? { x: 0, y: 0 } : { x: 150, y: 150 };

  useCurves(v2, v2 => ref2 && (
    ref2.textContent = JSON.stringify({ x: Math.floor(v2.x), y: Math.floor(v2.y) })
  ));

  return [
    h('p', { ref: setRef, style: { padding: 20, display: 'inline-block', position: 'relative' } }),
    h('br'),
    h('p', { ref: setRef2, style: { padding: 20, display: 'inline-block', position: 'relative' } }),
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