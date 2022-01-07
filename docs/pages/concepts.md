# Concepts

> @lukekaalim/act behaves very similarly to [facebook's React](https://reactjs.org/) -
> if you are familiar with React, then all these concepts
> should be familiar to you.
>
> This guide assumes that you don't have such knowlege,
> and starts from the beginning.

## Basics
At it's core, **[@lukekaalim/act](/)** (or just **act**) helps you break apart your applications into units called **Components**.
A Component is a function that you write which, given some inputs (which can generally be broken into **Props** and **State**), can generate set of Elements that can represent various things, like DOM nodes. You can attach event listeners, set attributes and properties, and create parent-child relationships with them.

The elements you create can also be other components - so your application often looks like a **Tree** of components, with a root component (often the "Application") defining a number of child components - which themselves may create more components, or more concrete elements. With your State being isolated in each component, often you can seperate logical parts of your application into independant units - making it easier to maintain and test (at least, that's the goal).

What your elements represent is decided by which **Renderer** you use. A renderer to get started with (and what we'll use in most examples) is the **[@lukekaalim/act-web](/web)** renderer, which uses the element's type to decide which DOM node to create.

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

::create_element_api
