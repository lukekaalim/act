// @flow strict
/*:: import type { Page } from '@lukekaalim/act-rehersal'; */
import { h } from '@lukekaalim/act';
import { Document, Markdown } from '@lukekaalim/act-rehersal';

import curveHooksText from './curve/hooks.md?raw';
import curveMainText from './curve.md?raw';

import { AnimatedListDemo } from '../../examples/animatedList.js';
import { AnimatedNumberDemo } from '../../examples/animatedValue.js';
import { DemosContainer } from '../../examples/demos.js';

export const hooksPage/*: Page*/ = {
  link: { href: '/libraries/curve/hooks', name: 'Hooks', children: [] },
  content: h(Document, {}, h(Markdown, { text: curveHooksText, directives: {} })),
}
export const animatorsPage/*: Page*/ = {
  link: { href: '/libraries/curve/animators', name: 'Animators', children: [] },
  content: h(Document, {}, [
    h('h1', {}, 'Hello'),
    h(AnimatedListDemo)
  ])
}
export const componentsPage/*: Page*/ = {
  link: { href: '/libraries/curve/components', name: 'Components', children: [] },
  content: []
}
export const advancedHooksPage/*: Page*/ = {
  link: { href: '/libraries/curve/advanced-hooks', name: 'Advanced Hooks', children: [] },
  content: []
}
export const playersPage/*: Page*/ = {
  link: { href: '/libraries/curve/players', name: 'Players', children: [] },
  content: []
}

export const curvePage/*: Page*/ = {
  link: {
    href: '/libraries/curve',
    name: 'Curve',
    children: [hooksPage.link, animatorsPage.link, componentsPage.link, playersPage.link, advancedHooksPage.link]
  },
  content:  h(Document, {},
    h(Markdown, { text: curveMainText, directives: {
      curve_demos: DemosContainer,
      hook_demo: AnimatedNumberDemo,
      transition_demo: AnimatedListDemo
    } }))
}

export const curvePages = [
  curvePage,
  animatorsPage,
  componentsPage,
  advancedHooksPage,
  playersPage,
  hooksPage,
];
