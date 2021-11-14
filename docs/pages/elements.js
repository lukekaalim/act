// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { Page } from '../entry.js'; */
import { h } from '@lukekaalim/act';
import { Document } from '@lukekaalim/act-rehersal';

const text = `
# Creating Elements

An element is the smallest unit of display for act.
An element has a _type_, some _props_ and maybe some _children_.

You can create an element by calling \`createElement\` (or \`h\` as it's often aliased to):

${'```'}
import { h } from '@lukekaalim/act';

const myElement = h('span');
${'```'}

Elements are often returned by components
`;

export const elementsPage/*: Page*/ = {
  link: {
    name: 'Elements',
    href: '/elements',
    children: [],
  },
  content: h(Document, { text }),
};