# Hooks

## API
- [useCurve](#useCurve)
- [useChangeList](#useChangeList)

::::api{name=useCurve source=@lukekaalim/act-curve}
:::type
{
  type: "function",
  arguments: [
    { name: "target", value: { type: "opaque", name: "number" }, referenceURL: "#useCurve.target" },
    { name: "onInterpolate", value:
      { type: "function", arguments: [
        { name: "position", value: { type: "opaque", name: "number" } },
        { name: "velocity", value: { type: "opaque", name: "number" } },
        { name: "acceleration", value: { type: "opaque", name: "number" } },
      ], returns: { type: "opaque", name: "void" } }, referenceURL: "#useCurve.onInterpolate" },
    { name: "options", optional: true, value: { type: "object", entries: [
      { key: "initial", optional: true, value: { type: "opaque", name: "number" } },
      { key: "impulse", optional: true, value: { type: "opaque", name: "number" } },
      { key: "duration", optional: true, value: { type: "opaque", name: "number" } },
    ] }, referenceURL: "#useCurve.options" }
  ],
  returns: { type: "opaque", name: "BezierAnimator", referenceURL: "animators#BezierAnimator" }
}
:::

Cool stuff!
::::

::::api{name=useChangeList source=@lukekaalim/act-curve}
:::type
{
  type: "function",
  genericArguments: [
    { name: "T" },
    { name: "K" }
  ],
  arguments: [
    { name: "target", value: { type: "array", element: { type: "opaque", name: "T" } }, referenceURL: "#useChangeList.target" },
    { name: "options", optional: true, value: { type: "object", entries: [
      { key: "calculateKey", optional: true, value:
        { type: "function", arguments: [{ name: 'element', value: { type: "opaque", name: "T" } }], returns: { type: "opaque", name: "K" } } },
      { key: "initialArray", optional: true, value: { type: "array", element: { type: "opaque", name: "T" } } },
    ] }, referenceURL: "#useCurve.options" }
  ],
  returns: { type: "tuple", elements: [
    { type: "array", element: { type: "opaque", name: "ElementStaus", referenceURL: "#useChangeList.elementStatus" }  },
    { type: "opaque", name: "ArrayAnimator", referenceURL: "animators#ArrayAnimator" },
  ] },
}
:::

### ElementStatus

:::type
{ type: "tuple", elements: [{ type: "opaque", name: "T" }, { type: "union", values: [
  { type: "opaque", name: "\'entering\'" },
  { type: "opaque", name: "\'inital\'" },
  { type: "opaque", name: "\'exiting\'" },
] }] }
:::
::::