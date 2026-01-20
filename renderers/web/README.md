# @lukekaalim/act-web

```bash
npm i @lukekaalim/act-web
```

```ts
import { h, Component } from "@lukekaalim/act";
import { render } from "@lukekaalim/act-web";

const MyApp = () => {
  return h('article', {}, [
    h('h1', {}, "Hello, world!")
  ])
}

render(h(MyApp), document.body)
```

<TypeDoc project="@lukekaalim/act-web" name="render" />

## Capabilities

  - [x] Supports HTML elements and SVG elements
    - [x] Add in the `web:html` or `web:svg` root pick the correct type
  - [x] Prop support
    - [x] **Attributes.** Most props will just be assigned directly to the element
    - [x] **Event Listeners.** `onClick` adds an event listener for `click`
    - [x] **Ref.** `ref` will attach a `HTMLElement` to `ref.current`
    - [x] **Styles.** `style` will set styles directly on the element
    - [x] **ClassList.** An array of strings or falseish values will be added as classes via `classList`

## Builder

If you are composing another renderer and want to give
it web powers, use the builder:

<TypeDoc project="@lukekaalim/act-web" name="createWebNodeBuilder" />
