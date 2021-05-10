# `@lukekaalim/act`

Tiny (react-like) Component Graph resolver. Use it to build your own graph systems for whatever you like.

## Usage
Install with npm
```bash
npm i @lukekaalim/act
```
Build your components like normal.
```js
import { node as n } from '@lukekaalim/act';

const Person = ({ name, age }) => {
  return [
    n('box', {}, [
      n('text', { content: `name: ${name}` }),
      n('text', { content: `name: ${age}` }),
    ])
  ];
};

const App = () => {
  const people = [
    { name: 'luke', age: 25 },
    { name: 'ari', age: 29 }
  ];
  return [
    ...people.map(person => n(Person, {
      name: person.name,
      age: person.age
    }))
  ];
}
```
Define a function that turns "commits" into something useful to you

```js
// TODO: Example
```