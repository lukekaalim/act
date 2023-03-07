// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { Page } from '../entry.js'; */
import { h } from '@lukekaalim/act';

const text = `
# Writing Components

Components are the core of act.
A component is a function that accepts and object returns a node
(where a node can be an array, null, string, number, boolean, or an element).

You write a component like:

${'```'}
import { h } from '@lukekaalim/act';

const MyComponent = ({ name }) => {
  return h('span', {}, \`Hello, \${name}\`);
};
${'```'}


You can then use that component as a "type" of element,
specficially for the 'createElement' or 'h' function.

${'```'}
h(MyComponent, { name: 'luke' });
${'```'}

Components recive the object from 'createElement' as their argument.
The 'children' property in the argument is also populated by the children provided to the element.
`;

export const componentPage/*: Page*/ = {
  link: {
    name: 'Components',
    href: '/components',
    children: [],
  },
  content: h(Document, { text }),
};