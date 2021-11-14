// @flow strict
/*:: import type { Page } from '@lukekaalim/act-rehersal'; */
import { h } from '@lukekaalim/act';
import { Document } from '@lukekaalim/act-rehersal';

const text = `
# @lukekaalim/act-rehersal.

A component library for building documentation websites.

## Install
${'```'}js
npm install @lukekaalim/act-rehersal
${'```'}
`;

export const rehersalPage/*: Page*/ = {
  link: { href: '/libraries/rehersal', name: '@lukekaalim/act-rehersal', children: [] },
  content: h(() => {
    return h(Document, { text })
  })
}