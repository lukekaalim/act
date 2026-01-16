# @lukekaalim/act

![NPM Version](https://img.shields.io/npm/v/%40lukekaalim%2Fact)
![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/%40lukekaalim%2Fact)


Core library for act!

```bash
npm install @lukekaalim/act
```

## Usage

  - [Elements](#elements)
  - [Components](#components)
  - [Hooks](#hooks)
  - [Context](#context)
  - [Rendering](#rendering)

### Elements
Describe parts of (probably HTML) tree's with Elements!

An element is a string, number, array, boolean, null, or
created by the `createElement` function (which is aliased to `h` for ease)
with a "type", "props", and "children"
arguments.

```ts
import { h } from '@lukekaalim/act';

const myArticle = h('article', {}, [
  h('h1', {}, 'My Article'),
  h('p', {},
    `This is the content of an article that I have written`
  ),
  h('button', { disabled: true }, `Can't click me!`)
])
```

<TypeDoc project="@lukekaalim/act" name="createElement" />

### Components

A function that returns some Elements is a Component! It
takes in a single object argument, called "props". The `Component`
interface takes a generic argument for the type of props.

```ts
import { h, Component } from '@lukekaalim';

type MyArticleComponentProps = {
  subject: string,
  contents: string[]
}

const MyArticleComponent: Component<MyArticleComponentProps> = ({
  subject,
  contents
}) => {
  return h('article', {}, [
    h('h1', {}, subject),
    contents.map(content => h('p', {}, content)),
    h('button', { disabled: true }, `Can't click me!`)
  ])
}

// elsewhere
h(MyArticleComponent, {
  subject: "The world",
  contents: ["This is a guide for how to take over the world."]
})
```

### Hooks

Components can keep track of variables with `useState`,
perform side effects on render with `useEffect`, get
an instance of the underlying HTML element with `useRef`,
and even cache precalculated values with `useMemo`.

```ts
import {
  useState, useEffect, useRef, useMemo,
  h
} from '@lukekaalim/act';

const MyInteractiveComponent = () => {
  const [name, setName] = useState('World');
  
  const ref = useRef<HTMLInputElement | null>(null);

  const guessedAge = useMemo(() => {
    return supercomputer.guessAgeFromName(name);
  }, [name])

  useEffect(() => {
    if (guessedAge > 80)
      window.alert("You are old!")
  }, [guessedAge])

  const onInput = (event: InputEvent) => {
    const input = ref.current;
    if (!input)
      return; 
    setName(input.value);
  }

  return [
    h('input', { ref, type: 'text', value: name, onInput }),
    h('p', {}, `Hello, ${name}!`)
  ];
}
```

### Context

Create values in parents that can be read by children
with createContext and useContext.

```ts
import { h, createContext, useContext } from '@lukekaalim/act';

const myContext = createContext('Default');

const Parent = () => {
  return h(myContext.Provider, { value: 'my-value', },
    h(Child)
  )
};

const Child = () => {
  const providedValue = useContext(myContext);

  return h('p', {},
    `I got the value ${providedValue} from one of my parents!`);
}
```

### Errors

If a component throws an error (or anything, really), it either unmounts the whole app,
or "suspends" the app up until a Boundary (a special kind of Element).

```ts
import { h, Boundary } from '@lukekaalim/act';

const BadComponent = () => {
  throw new Error("Oopsies")
}

const Parent = () => {
  const fallback = "Something went wrong!";

  return h(Boundary, { fallback }, h(BadComponent))
}
```

### Rendering

Grab a Renderer (which turns Elements into actual HTML instances),
and run it's render function:

```ts
import { render } from '@lukekaalim/act-web';
import { h } from '@lukekaalim/act';

const MyApp = () => {
  const onClick = () => {
    alert("Nothing");
  }

  return [
    h('h1', {}, `This is my application!`),
    h('button', { onClick } , 'this button shows you nothing')
  ]
}

render(h(MyApp), document.body);
```

<Demo demo="core.rendering"/>

## Utilities

The core library also bundles a short amount of utilities:

<TypeDoc project="@lukekaalim/act" name="createId" extras="OpaqueID" />

## Types

<TypeDoc project="@lukekaalim/act" name="Node" />
<TypeDoc project="@lukekaalim/act" name="Element" />
<TypeDoc project="@lukekaalim/act" name="Component" />