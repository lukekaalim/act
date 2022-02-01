# Hooks

This library provides some hooks to cover common cases, like animating arrays and
individual numbers. These hooks make several assumptions about how you'd like the animation
to be interpolated.

For greater control, take a look a writing your own reducers or editing animations.

## API
- [useAnimatedNumber](#useAnimatedNumber)
- [useAnimatedList](#useAnimatedList)
- [useBezierAnimation](#useBezierAnimation)
- [useAnimation](#useAnimation)

::::api{name=useAnimatedNumber}
```ts
import { useCurve } from '@lukekaalim/act-curve';

declare function useCurve(
  value: number,
  inital?: number,
  options?: AnimatedNumberOptions
): CubicBezierAnimation
```

:::type
```
{
  type: "function",
  arguments: [
    { name: "value", value: { type: "opaque", name: "number" } },
    { name: "initial", optional: true, value: { type: "opaque", name: "number" } },
    { name: "options", optional: true, value: { type: "opaque", name: "AnimatedNumberOptions" } }
  ],
  returns: { type: "opaque", name: "CubicBezierAnimation" }
}
```
:::

Pass a value to this hook to generate an "animation" for how the value changes over time.

As the value you pass changes each render, this hook will generate animations that interpolate the
"current" value to the next one. The current value might be halfway from the previous transition, and
preserves velocity and position when it transitions.

A `CubicBezierAnimation` can be passed to the `useBezierAnimation` hook to start applying the changes.

::::

::::api{name=useAnimatedList}

```js
import { useAnimatedList } from '@lukekaalim/act-curve';
```

:::type
```
{
  type: "function",
  genericArguments: [
    { name: "T" },
  ],
  arguments: [
    { name: "value", value: { type: "array", element: { type: "opaque", name: "T" } }, referenceURL: "#useChangeList.target" },
  ],
  returns: { type: "tuple", elements: [
    { type: "array", element: { type: "opaque", name: "ElementAnimation", genericArguments: [{ type: "opaque", name: "T" }] }  },
    { type: "opaque", name: "ArrayAnimator", referenceURL: "animators#ArrayAnimator" },
  ] },
}
```
:::

Pass an array to this hook to generate an array of animations for each element, tracking how it enters, exits, or moves around in the array.

Each element of the returned array contains a "status" animation, animating between `-1` to `0` and `0` to `1` to track if the element is "entering" or "exiting" the array.

Each element also contains an "index" property, animating between the index of the element if it moves. If an element is "removed" from the array, then it's
index never changes.

The return array isn't ordererd in the same order as the previous.

::::