// @flow strict
import { h, useState, useEffect } from '@lukekaalim/act';
import { render } from '@lukekaalim/act-dom';

const randomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const lightness = 45 + Math.floor(Math.random() * 10);
  return `hsl(${hue}, 80%, ${lightness}%)`
};

const useSlideState = (active, max) => {
  const [slideState, setSlideState] = useState(5);
  useEffect(() => {
    const keydownListener = (e) => {
      if (document.activeElement instanceof HTMLInputElement)
        return;
      if (!active)
        return;
      switch (e.keyCode) {
        case 40:
        case 83:
          return setSlideState(Math.min(max, slideState + 1))
        case 38:
        case 87:
          return setSlideState(Math.max(0, slideState - 1))
      }
    };
    window.addEventListener('keydown', keydownListener);
    return () => window.removeEventListener('keydown', keydownListener);
  }, [active, max, slideState])

  return slideState;
};

const reactTerms = [
  ['Element',
    `An element represents a DOM Node to be part of the document. It has a type,
    props, and potentially children`],
  ['Props',
    'Props is a map of values assigned to a name, typically mapped to Attributes in the DOM.'],
  ['Components',
    'A Component is a function that accepts Props, and returns an Element'],
  ['Reconciler',
    `A Reconciler is a program that can determine what Elements changed between
    two renders of a component, instructing a Renderer to update efficiently`],
  ['Renderer',
    `A Renderer consumes a reconcilers commands, and updates the DOM Node
    with the attributes they should have, creating or removing elements
    when nessicarry`]
];

const Terms = ({ activeTermIndex, terms }) => {
  return h('ul', {}, terms.map(([summary, details], index) =>
    h('li', {},
      h('details', { open: activeTermIndex === index }, [
        h('summary', {}, activeTermIndex === index ? h('strong', {}, summary) : summary),
        h('p', {}, details)]))
  ));
};

const FirstTerms = () => {
  const state = useSlideState(true, reactTerms.length);

  return [
    h('h2', {}, 'Basic React Terms'),
    h('pre', {}, state),
    h('p', {}, `Looking at how react is practically used, in terms of writing HTML pages.`),
    h('p', {},
      `(This definitions is similar, but not technically identical to when
        writing react for other platforms, like React Native. Just pretend
        for now pls.)`
    ),
    h(Terms, { activeTermIndex: state - 1, terms: reactTerms }),
  ];
};

const Entry = ({ children }) => {
  return h('span', { style: { backgroundColor: randomColor(), padding: '8px' } }, children);
};

const Root = () => {
  const [keys, setKeys] = useState('0,1,2,3')
  const [activeTermIndex, setIndex] = useState/*:: <number>*/(0)
  return [
    h('h1', {}, 'Hello!'),
    h('input', { onInput: e => setKeys(e.currentTarget.value), value: keys }),
    h('ul', { style: { padding: 0, display: 'flex' } }, [
      ...keys.split(',').filter(Boolean).map(key => h('li', { key, style: { display: 'flex' } }, h(Entry, {}, key)))
    ]),
    h('button', { onClick: () => setIndex(i => i + 1) }, 'Increase Index'),
    h('button', { onClick: () => setIndex(i => i - 1) }, 'Decrease Index'),
    h('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 300 100", stroke: "red", fill: "grey" }, [
      h('circle', { cx: "150", cy: "50", r: "4" }),
    ]),
    h(FirstTerms)
  ];
};

const main = () => {
  const { body } = document;
  if (body)
    render(h(Root), body);
};

main();