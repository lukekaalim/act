# Act
Small react-like library for rendering components.

> ⚠️ Warning: This library is designed as an experiment, and should not be used for production.

## Types
### `Component<T>`
```
type Component<T> = (props: {
  ...T,
  children: Element[]
}) => ElementNode;
where
T: { [string]: mixed }
```
A component is a function that accepts a Props object, and optionally a children object, and returns an ElementNode. While a component is running in an Act renderer, some special globals are set, allowing the use of `useEffect`, `useContext`, `useState` and other hooks.
### `ElementNode`
```
type ElementNode =
  | string
  | number
  | null
  | false
  | ElementNode[]
  | Element
```
An element node represents a "approximate" Element or group of elements. It can contain arrays, nulls, string and all those thing recursively. An "Element" is a special object returned by [createElement](#`createElement`-or-`h`).
## API
### `createElement` or `h`
```
<T>(
  type: string | Component<T>,
  props: T,
  children: ElementNode
) => Element 
where
T: { [string]: mixed }
```
Creates a new Element.