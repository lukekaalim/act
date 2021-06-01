# Act-Web
The web renderer for Act, turning components into HTML or SVG elements.
> ⚠️ Warning: This library is designed as an experiment, and should not be used for production.

> ⚠️ Warning: This library is only available as an ESM.

## API
### `render`
```
(root: Element, htmlRoot: HTMLElement) => void
```
Starts the rendering of a root Act element, under a htmlRoot parent. You can create Act elements from the `@lukekaalim/act`'s `createElement` function.

```js
import { h } from '@lukekaalim/act';
import { render } from '@lukekaalim/act-web';

const App = () => [
  h('h1', {}, 'Hello, World!'),
  h('p', {}, 'Welcome to my first webpage!'),
];

render(h(App), document.body);
```