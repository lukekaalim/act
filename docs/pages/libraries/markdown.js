// @flow strict
/*:: import type { Page } from '@lukekaalim/act-rehersal'; */
import { h, useEffect, useState } from '@lukekaalim/act';
import { Document, GridBench, Markdown, TabbedToolbox, Workspace } from '@lukekaalim/act-rehersal';
import { MarkdownRenderer } from '@lukekaalim/act-markdown';
import readme from '@lukekaalim/act-markdown/README.md?raw';

const usageText = `
## Usage

Import the renderer components, and provide it the markdown text as a prop.
The component will render the elements internally.

${'```'}ts
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
      
![River](https://images.unsplash.com/photo-1558386619-d39547b31c83?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1470&q=80 "Cool river")
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

export const markdownPage/*: Page*/ = {
  link: { href: '/libraries/markdown', name: 'Markdown', children: [{ name: 'exports', children: [markdownRendererPage.link] }] },
  content: [
    h(Document, {}, [
      h(Markdown, { text: readme }),
    ]),
  ]
}

export const markdownPages/*: Page[]*/ = [
  markdownPage,
];