// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { Page } from '../entry.js'; */
import { h } from '@lukekaalim/act';
import { Document, ExportDescription, Markdown, SyntaxCode } from '@lukekaalim/act-rehersal';

import conceptsText from './concepts.md?raw';

const CreateElementAPI = ({ attributes, children }) => {
  return [
    h(ExportDescription, {
      name: 'createElement',
      aliases: ['h'],
      source: '@lukekaalim/act',
      type: { type: 'function', arguments: [
        {
          name: 'type',
          description: [
            h('p', {}, `
              A special string that tells the renderer what this element represents.
              The set of valid values depends on your renderer.
              Values like \'img\' or \'div\' are valid for the web renderer, which passes
              the value to document.createElementNS() when creating the element.
            `),
            h('p', {}, `
              Can also be a Component instead of a string, causing the renderer to
              create that component, passing in the props and children as arguments.
            `),
          ],
          type: 'string | Component'
         },
         {
           name: 'props',
           optional: true,
           description: [
             h('p', {}, `
              This second argument is an object - which will be passed to the
              Component function as it's argument if the 'type' argument is a Component.
              It is optional - it will default to "{}" if not provided.
             `),
             h('p', {}, `
              If the 'type' argument is a string, then each key/value pair of this object represents an
              attribute or property that will be set on the resulting element.
              We call each key/value pair a "prop", and often just refer to the entire object as an element's "props".
            `),
            h('p', {}, `
              For the web renderer,
              you can attach event listeners like "onClick" or "onChange" to listen to inputs or buttons, set styles
              by including a "styles" prop, or set things like a link's destination with "href".
             `)
           ],
           type: 'Object'
         },
         {
           name: 'children',
           optional: true,
           description: [
             h('p', {}, `
              The final argument is the children argument: this is an element (or an array of elements)
              that the element may have as it's descendants. Once again, this property changes if the "type"
              is a string or a Component.
             `),
             h('p', {}, [
              `If the "type" is a Component, then the provided node here will be merged with the props object as
              the special prop "children". The children argument will `,
              h('strong', {}, 'always'),
              ' override any prop named "children" passed into the element.'
             ]),
             h('p', {}, [
              `Otherwise, if the "type" is a string, then the renderer gets to decide what children represent: in the
              case of the Web Renderer, children are Child Elements in the DOM hierarchy.
              `
             ]),
           ],
           type: 'Element'
         }
      ], return: 'Element' },
    })
  ];
}

export const conceptsPage/*: Page*/ = {
  link: {
    name: 'Concepts',
    href: '/concepts',
    children: [],
  },
  content: h(Document, {}, [
    h(Markdown, { text: conceptsText, directives: { 'create_element_api': CreateElementAPI } })
  ]),
};

export const conceptsPages = [
  conceptsPage
];
