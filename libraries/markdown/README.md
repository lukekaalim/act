# @lukekaalim/act-markdown

[![npm (scoped)](https://img.shields.io/npm/v/@lukekaalim/act-markdown)](https://www.npmjs.com/package/@lukekaalim/act-markdown)
![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@lukekaalim/act-markdown)

A component library that parses markdown syntax via [remark](https://github.com/remarkjs/remark)
and renders it to html elements in [@lukekaalim/act](https://act.luke.kaal.im).

> ## ⚠️ Security
> 
> While obviously theres no intentional way to execute code from markdown, this
> library is not equipped to handle arbitrary, malformed or (in general) user-generated
> markdown. It's intended to be fed known and developer-written strings.
>
> This library performs no sanitisation. Use at your own risk.

## Install
```bash
npm install @lukekaalim/act-markdown
```

## Features
**@lukekaalim/act-markdown** supports the following markdown features:
  - [ ] Most CommonMark things
  - [X] Some [Github Flavored Markdown (GFM)](https://github.github.com/gfm) featues
  - [ ] [Directives proposal](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444)

It does not support:
  - Embedded HTML elements

## Usage

::::api{name=MarkdownRenderer source=@lukekaalim/act-markdown}

:::type
```
{
  type: "opaque",
  name: "Component",
  referenceURL: "/concepts#Component",
  genericArguments: [
    { type: "object", entries: [
      { key: "markdownText", value: { type: "opaque", name: "string" } },
      { key: "directiveComponents", optional: true, value: { type: "object", entries: [
        { key: "[directiveKey: string]", value: { type: "opaque", name: "Component", referenceURL: "/concepts#Component", genericArguments: [
          { type: "object", entries: [
            { key: "node", value: { type: "opaque", name: "MarkdownASTNode", referenceURL: "https://github.com/syntax-tree/mdast", } }
          ] }
        ] } }
      ] } }
    ] }
  ]
}
```
:::

```ts
import { MarkdownRenderer } from '@lukekaalim/act-markdown';

const markdownText = `
# Heading

This is my first paragraph! Lorum Ipsum or whatever.

![MyCoolPicture](http://example.com/image.jpg)
`

const ExampleComponent = () => {
  return h(MarkdownRenderer, { markdownText })
};
```

::::