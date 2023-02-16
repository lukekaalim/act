// @flow strict
import { render } from '@lukekaalim/act-web';
import {
  createElement as h, useMemo,
  useState, Boundary, useEffect, useRef
} from '@lukekaalim/act';

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

  const memoButton = useMemo(() => h(ToggleButton), []);
  const [working, setWorking] = useState(true);

  const fallback = h('pre', {}, 'Ooopsie!')
  const [loadTime, setLoadTime] = useState(1000);

  return [
    h('button', { style: { borderColor: randomColor() }, key: value, onClick: () => setValue(v => v + 1) }, value),
    memoButton,
    h('input', { type: 'checkbox', checked: working, onInput: e => setWorking(e.target.checked) }),
    h(FallbackBoundary, { fallback, deps: [working] }, [
      h(BadComponent, { working }),
    ]),
    h('div', {}, [
      h('input', { type: 'number', value: loadTime, onInput: e => setLoadTime(e.target.valueAsNumber) }),
      h(FallbackBoundary, { fallback: "Loading", deps: [loadTime] }, [
        h(LoadingComponent, { loadTime }),
      ]),
    ])
  ];
};

const LoadingComponent = ({ loadTime }) => {
  useLoading(loadTime);

  return [
    'Loaded'
  ];
}

const FallbackBoundary = ({ children, fallback, deps = [] }) => {
  const [hasError, setHasError] = useState(false);

  const memoChildren = useMemo(() => children, deps)

  return [
    h(Boundary, { handleBoundaryValue: es => (es.map(e => console.error(e)), setHasError(es.length > 0), []) },
      memoChildren),
    hasError && fallback,
  ];
}

const BadComponent = ({ working }) => {
  if (working)
    return 'Working';
  throw new Error(`AAAAaaarg!`)
}

class LoadingSuspension {
  /*:: 
  message: string;
  */
  constructor() {
    this.message = 'This component is loading';
  }
}

const useLoading = (duration = 1000) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    console.log('Start Loading', duration);
    const id = setTimeout(() => setLoaded(true), duration);
    return () => {
      console.log('Cleanup Loading', duration);
      clearTimeout(id);
      setLoaded(false);
    }
  }, [duration])

  if (!loaded)
    throw new LoadingSuspension()
}



render(h(App), (document.body/*: any*/));