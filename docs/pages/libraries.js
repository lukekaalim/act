// @flow strict
/*::
import type { RehersalPage } from "@lukekaalim/act-rehersal";
*/

import { h } from "@lukekaalim/act";
import { MarkdownBlock } from "@lukekaalim/act-rehersal";
import text from './libraries.md?raw';

export const libraryPage/*: RehersalPage*/ = {
  id: 'libraries',
  path: '/lib',
  children: [],
  content: h(MarkdownBlock, { input: { type: 'text', text }}),
  subsections: [],
  title: "Libraries"
}