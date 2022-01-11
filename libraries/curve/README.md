# @lukekaalim/act-curve

A [@lukekaalim/act](/)-based library for working with fast-updating changes.

## Features

- Simple interpolator hook for smoothly changing a value based on state.
- Custom Animator framework for building data-driven animations
- Transition Component to animate individual or arrays of component entry/exits

## Install
```bash
npm i @lukekaalim/act-curve
```

## Quickstart Usage

Interpolate between values using [useCurve](/libraries/curve/hooks#useCurve) hook.

```js
const HookDemo = () => {
  const elementRef = useRef();
  const [value, setValue] = useState(0);

  useCurve(
    value,
    (interpolatedValue) => {
      // Perform imperetive animation within this function
      // using the "interpolated value"
      elementRef.current.textContent = Math.floor(interpolatedValue)
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
```

::hook_demo

Use the [useTransitions]() hook to show/hide sets of elements gradually

```ts
const FadingElement = ({ transition, render }) => {
  const elementRef = useRef/*:: <?HTMLElement>*/(null);

  useCurve(transition.removed ? 1 : 0, v => {
    const { current: element } = elementRef;
    if (!element)
      return;
  
    element.style.opacity = (1 - Math.abs(v)).toString();
    if (v === 1)
      element.style.display = 'none';
  }, { start: -1 })

  return render(elementRef);
}

const TransitionDemo = () => {
  const [colorList, setColorList] = useState(['red', 'blue', 'green']);
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

  const colorListTransitions = useTransitions(
    colorList,
    v => v,
    t => !!t.removed && (t.removed + 1000) < performance.now()
  )

  return [
    h('form', { onSubmit }, [
      h('input', { type: 'text', value: nextColor, onInput: onNextColorInput }),
      h('button', { type: 'submit' }, 'Add New Color'),
    ]),
    h('ul', {}, [
      colorListTransitions.map(transition =>
        h(FadingElement, { transition, render: (ref) => [
          h('li', { ref, key: transition.value },
            h('button', {
              style: { backgroundColor: transition.value, color: 'white' },
              onClick: onColorClick(transition.value)
            }, transition.value))
        ] }))
    ])
  ];
};
```

::transition_demo