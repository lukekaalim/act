# @lukekaalim/act-curve

A [@lukekaalim/act](/)-based library for working with fast-updating changes.

## Features

- Simple interpolator hook for smoothly changing a value based on state.
- Array interpolator hook to tell if elements are entering or exiting and animate them accordingly
- Custom Animator framework for building data-driven animations

## Install
```bash
npm i @lukekaalim/act-curve
```

## Quickstart Usage

Interpolate between values using [useCurve](/libraries/curve/hooks#useCurve) hook.

```js
useCurve(value, (interpolatedValue) => {
  element.textContent = Math.floor(interpolatedValue)
});
```

::hook_demo

Use the [useChangeList](/libraries/curve/hooks#useChangeList) hook to show/hide sets of elements gradually

```ts
const [colorListChanges, animator] = useChangeList(colorList);
colorListChanges.map(([color, change]) =>
  h(ColorBox, { color, change, onDone: () => animator.remove(color) }))

// inside ColorBox
useCurve(change === 'exiting' ? 1 : 0, v => {
  element.style.opacity = (1 - Math.abs(v)).toString();
  element.style.maxHeight = ((1 - Math.abs(v)) * 1).toString() + 'em';
  if (v === 1)
    onDone()
}, { start: -1 })
```

::transition_demo