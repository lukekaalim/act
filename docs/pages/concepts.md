
> @lukekaalim/act behaves very similarly to [facebook's React](https://reactjs.org/) -
> if you are familiar with React, then all these concepts
> should be familiar to you.
>
> This guide assumes that you don't have such knowlege,
> and starts from the beginning.

# Basic Concepts

At it's core, **[@lukekaalim/act](/)** (or just **act**) helps you break apart your applications into units called **Components**.
A Component is a function that you write which, given some inputs (which can generally be broken into **Props** and **State**), can generate set of Elements that can represent various things, like DOM nodes. You can attach event listeners, set attributes and properties, and create parent-child relationships with them.

The elements you create can also be other components - so your application often looks like a **Tree** of components, with a **Root Component** (often the called "Application") defining a number of child components - which themselves may create more components, or more concrete elements. With your State being isolated in each component, often you can seperate logical parts of your application into independant units - making it easier to maintain and test (at least, that's the goal).

What your elements represent is decided by which **Renderer** you use. A renderer to get started with (and what we'll use in most examples) is the **[@lukekaalim/act-web](/web)** renderer, which uses the element's type to decide which DOM node to create.

An element is created by the [**createElement()**](#createElement) function (otherwise known as **h()**).

To use a renderer, you typically pick your **Root Component** and pass it as an
argument to your renderer, along with "where" the component will mount. The specifics are
up to the renderer, but for Web you simply pass the HTML Element that will be your component's parent.

An example of the process is here:

```js
import { h } from '@lukekaalim/act';
import { render } from '@lukekaalim/act-web';

const HelloExample = () => {
  const greet = () => {
    alert('Hello!');
  }
  return h('button', { id: 'hello', onClick: () => greet() }, 'Hello, World!');
};

render(HelloExample, document.body);
```

::hello_example

> **Wait, where's JSX? What about \<h1\> syntax?**
>
> Act was designed to be as bare-bones as possible, and so doesn't
> use or document external compilers by default.
> 
> However, adding JSX support to your project isn't impossible: you
> simply need to
> change the "pragma" of JSX to `act.createElement` instead of
> `react.createElement`. This is different depending on your
> compiler, so you should check out their documentation.
>
> How this works should be similar to users of the [Preact]() project, which
> has a similar interface and requires the same kind of change to support
> JSX.


## Main Functions

As mentioned, there is one main function that act exports for element creation.

::::api{source=@lukekaalim/act aliases=h name=createElement}

> #### Why the `h()` alias?
>
> It's just shorter, and kind of conventional to [Preact](https://preactjs.com/),
> which in turn follows [hyperscript](https://hyperscript.org/) (which is presumably what the "h" stands for).
> You can use the full "createElement" name, or just alias it to something shorter yourself - there is no difference there.

:::type{format=json5}
{
  type: "function",
  arguments: [
    { name: "type", value: { type: "union", values: [
      { type: "opaque", name: "string" },
      { type: "opaque", name: "Component", referenceURL: "#Component" },
    ] } },
    { name: "props", optional: true, value: { type: "opaque", name: "Object" } },
    { name: "children", optional: true, value: { type: "opaque", name: "Element", referenceURL: "#Element" } },
  ],
  returns: { type: "opaque", name: "Element", referenceURL: "#Element" }
}
:::

#### type
A special string that tells the renderer what this element represents.
The set of valid values depends on your renderer.
Values like **img** or **div** are valid for the web renderer, which passes
the value to `document.createElementNS()` when creating the element.

Can also be a Component instead of a string, causing the renderer to
create that component, passing in the props and children as arguments.

#### props
This second argument is an object - which will be passed to the
Component function as it's argument if the 'type' argument is a Component.
It is optional - it will default to `{}` if not provided.

If the 'type' argument is a string, then each key/value pair of this object represents an
attribute or property that will be set on the resulting element.
We call each key/value pair a "prop", and often just refer to the entire object as an element's "props".

For the web renderer,
you can attach event listeners like "onClick" or "onChange" to listen to inputs or buttons, set styles
by including a "styles" prop, or set things like a link's destination with "href".
#### children
The final argument is the children argument: this is an element (or an array of elements)
that the element may have as it's descendants. Once again, this property changes if the "type"
is a string or a Component.

If the "type" is a Component, then the provided node here will be merged with the props object as
the special prop "children". The children argument will, **always**
override any prop named "children" passed into the element.

Otherwise, if the "type" is a string, then the renderer gets to decide what children represent: in the
case of the Web Renderer, children are Child Elements in the DOM hierarchy.

::::

## Types

Apart from the [createElement](#createElement) function, there are two important types of data
that you will work with when using act: the [Element](#Element) type, and the [Component](#Component) type.

These types aren't classes or things you import, they are just abstract interfaces included here
for reference.

::::api{name=Element}
The `Element` type is a set of acceptable values that you can put anywhere the API
asks for an Element.

:::type{format=json5}
{
  type: "union",
  values: [
    { type: 'opaque', name: 'string' },
    { type: 'opaque', name: 'number' },
    { type: 'opaque', name: 'null' },
    { type: 'opaque', name: 'ElementNode' },
    { type: 'array', element: { type: 'opaque', name: 'Element', referenceURL: '#Element' } },
  ]
}
:::

Most commontly, you put elements as the return value of [Components](#Component) and as the third
argument to the [createElement](#createElement) function.

As to what an `Element` literally is, you can put a string literal, number, null, or even a recursive array of those previous values.

A valid "Element" using this logic can look like:
```
const exampleElement = [
  'A standard string',
  `Then we have this template ${value}`,
  [
    'We can even have',
    ['as many arrays as we like'],
    [],
  ],
  'and null',
  null,
  condition ? 'we can write these inline expressions' : null,
  'and of course createElement() is a valid element',
  h('pre', {}, [
    `And the third "children" argument lets `,
    `you do all the same things again as well!`
  ])
]
```
The `ElementNode` type mentioned is actually the specific return value of `createElement`,
and you typically don't need to worry about it directly.

> In fact, all those previous values get transformed into ElementNode specifically internally,
> with strings becoming basically equivelant to:
> `h('act:string')`
> and `null` becoming
> `h('act:null')`.

::::


::::api{name=Component}

:::type{format=json5}
{
  type: "function",
  arguments: [
    { name: 'props', value: { type: 'opaque', name: 'Object' } }
  ],
  returns: { type: 'opaque', name: 'Element', referenceURL: '#Element' }
}
:::

The Component type represents the interface all your component functions must follow.

As mentioned previously, the "props" object you recieve will contain all the "props"
that you pass to "createElement".

```ts
const Application = () => {
  return h(ChildComponent, { name: 'Luke' });
}

const ChildComponent = (props) => {
  console.log(props.name); // should be 'Luke';
  return `Hello, ${props.name}`;
};
```

In addition to props, components have another feature that lets them access some values: their **State**.

Every component (and really every element) keeps track of a set of data called **State**, often accessible by
special functions called **Hooks**.
::::