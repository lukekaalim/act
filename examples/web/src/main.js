// @flow strict
import { render } from '@lukekaalim/act-web';
import { createElement as h, useState } from '@lukekaalim/act';

const ToggleButton = () => {
  const [toggle, setToggle] = useState/*:: <boolean>*/(false);

  return h('div', { style: { borderColor: randomColor(), borderWidth: '2px', borderStyle: 'solid' } }, [
    toggle ? h('p', {}, `Only appears on toggle!`) : null,
    h('button', { onClick: () => setToggle(!toggle) }, toggle ? 'hide' : 'show'),
  ]);
};

const randomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const lightness = Math.floor(Math.random() * 20);
  return `hsl(${hue}, 80%, ${40 + lightness}%)`
};

const App = () => {
  const [value, setValue] = useState/*:: <number>*/(0);

  return [
    h('button', { style: { borderColor: randomColor() }, key: value, onClick: () => setValue(v => v + 1) }, value),
    h(ToggleButton)
  ];
};

render(h(App), (document.body/*: any*/));