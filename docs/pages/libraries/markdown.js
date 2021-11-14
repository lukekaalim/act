// @flow strict
/*:: import type { Page } from '@lukekaalim/act-rehersal'; */
import { h, useEffect, useState } from '@lukekaalim/act';
import { Document, GridBench, TabbedToolbox, Workspace } from '@lukekaalim/act-rehersal';
import { MarkdownRenderer } from '@lukekaalim/act-markdown';

const usageText = `
## Usage

Import the renderer components, and provide it the markdown text as a prop.
The component will render the elements internally.

${'```'}
import { MarkdownRenderer } from '@lukekaalim/act-markdown';

const markdownText = \`# My Title\\n\\nMy Text\`

const MyComponent = () => {
  return h(MarkdownRenderer, { markdownText });
};
${'```'}

## Limitations
Only a selection of markdown syntax is supported. This list is:
 - Headings
 - Code/Inline Code
 - Lists
 - Hyperlinks
 - Images
 - Horizontal Lines
`;

const Content = ({ text, setText }) => {
  return h('textarea', { value: text, onChange: e => setText(e.target.value) })
}

export const markdownRendererPage/*: Page*/ = {
  link: { href: '/libraries/markdown/renderer', name: '<MarkdownRenderer />', children: [] },
  content: h(() => {
    const [text, setText] = useState(
`# Title
This is some example markdown
      
And here is more markdown.
      
![Mountain](https://live.staticflickr.com/389/31833779864_7ec0b63ffc_h.jpg "Cool mountain")
`)

    return h(Workspace, {
      bench: [h('div', { style: { overflow: 'auto', height: '100%' }}, h(MarkdownRenderer, { markdownText: text }))],
      tools: [h(TabbedToolbox, { tabs: {
        'usage': h(Document, { text: usageText }),
        'content': h(Content, { text, setText })
      }})],
    });
  })
};

const text = `
# @lukekaalim/act-markdown.

A component library that parses markdown syntax via \`mdast-util-from-markdown\`
and renders it to html elements in act.

## Install
${'```'}js
npm install @lukekaalim/act-markdown
${'```'}

${usageText}
`;

export const markdownPage/*: Page*/ = {
  link: { href: '/libraries/markdown', name: '@lukekaalim/act-markdown', children: [{ name: 'exports', children: [markdownRendererPage.link] }] },
  content: h(Document, { text })
}