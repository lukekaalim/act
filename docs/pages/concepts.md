# Concepts

> @lukekaalim/act behaves very similarly to [facebook's React](https://reactjs.org/) -
> if you are familiar with React, then all these concepts
> should be familiar to you.
>
> This guide assumes that you don't have such knowlege,
> and starts from the beginning.

## Basics
To get started with @lukekaalim/act, you need to create Components,
which are just functions that return Elements. 

An element is created by the **createElement()** function (otherwise known as **h()**).

An example of such a component looks like this:

```js
const MyComponent = () => {
  return h('h1', { id: 'hello' }, 'Hello, World!');
};
```

> **Wait, where's JSX? What about \<h1\> syntax?**
>
> Act was designed to be as simple as possible, and so doesn't
> require or encourage external compilers by default.
> 
> However, adding JSX support to your project isn't impossible: you
> simply need to
> change the "pragma" of JSX to `act.createElement` instead of
> `react.createElement`. This is different depending on your
> compiler, so you should check out their documentation.

### Nodes

Calls to createElement create a Node of some kind: typically,
when working with web applications, a node represents a HTML Element,
like a div, span or even h1 as seen in the example. A node is not
"literally" a HTML element, but it describes one if it were to exist.

createElement accepts three arguments, with only the first one being required: name, props, children.
This is similar to how the Node object looks interally as well.

#### Name

The "name" of the
node is the first argument.

#### Props

Nodes often have properties associated with them (shorthanded to "props"). A
HTML element for instance has "attributes" that can be set, like the **id**, which
is used to globally identity the element in the document. An object with the keys
represanting the property name, with the values set to the properties desired value
can optionally be provided as the second argument.

#### Children

The text 'Hello World' is passed in as the third argument in the example - this
represent the "children" of the Node, which can just be other nodes.

Passing a literal string here is a specical case - a string is shorthand for
the element:

```js
h('act:string', { value: ValueOfString })
```

where **ValueOfString** is the provided literal string. A similiar case exists with **null** too:
```js
h('act:null')
```
Though of course, null has no properties.

Additionally, arrays are also allowed where nodes are allowed, as long as their elements are all
also nodes (including more arrays!).

Putting all these node types together, here is a totally valid node:

```js
const node = [
  null,
  `Hello, ${myName}`,
  [
    [
      h('button', { onClick: () => console.log('Beep!') }, [
        'Click ',
        'Me!'
      ])
    ]
  ],
  displayPoints ? h(Points, { value: pointsScored }) : null,
];
```

## Hierarchies
When we design applications, we often consider breaking our app into smaller units,
each concentrated on a smaller task. When we assemble these units together,
we often have some kind of heirarchy about how they connect together.