// @flow strict
/*:: import type { Component, ElementNode, Context } from '@lukekaalim/act'; */
import { h, useEffect, useState, useMemo, createContext, useContext } from '@lukekaalim/act';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkHeading from 'remark-heading-id';
import remarkHeadings from '@vcarl/remark-headings';
import remarkDirective from 'remark-directive';

/*::
export type MarkdownASTNode = {
  [string]: any,
};

export type MarkdownComponent<T = MarkdownASTNode> = Component<{ node: T }>
export type SpreadableMarkdownComponent<T = MarkdownASTNode> = Component<{ node: T, spread?: boolean }>

export type MarkdownDirectiveASTNode = {
  type: 'containerDirective' | 'leafDirective' | 'inlineDirective',
  attributes: { [string]: mixed },
  children: MarkdownASTNode[],
};
*/

const MarkdownRoot = ({ node }) => {
  return h(MarkdownChildren, { node });
}
export const MarkdownParagraph/*: SpreadableMarkdownComponent<>*/ = ({ node, spread = true }) => {
  if (!spread)
    return h(MarkdownChildren, { node });
  return h('p', {}, h(MarkdownChildren, { node }));
}
export const MarkdownText/*: MarkdownComponent<>*/ = ({ node }) => {
  return node.value;
}
export const MarkdownEmphasis/*: MarkdownComponent<>*/ = ({ node }) => {
  return h('i', {}, h(MarkdownChildren, { node }));
}
export const MarkdownStrong/*: MarkdownComponent<>*/ = ({ node }) => {
  return h('strong', { }, h(MarkdownChildren, { node }))
}
export const getHeadingElementType = (node/*: MarkdownASTNode*/)/*: string*/ => {
  switch (true) {
    case node.depth === 1:
      return 'h1';
    case node.depth === 2:
      return 'h2';
    case node.depth === 3:
      return 'h3';
    default:
    case node.depth >= 4:
      return 'h4';
  }
}
export const MarkdownHeading/*: MarkdownComponent<>*/ = ({ node }) => {
  const elementType = getHeadingElementType(node);
  const id = node.data && node.data.id;
  return h(elementType, { id }, h(MarkdownChildren, { node }));
}
const getListElementType = (node) => {
  switch (node.ordered) {
    case true:
      return 'ol';
    default:
    case false:
      return 'ul';
  }
}
export const MarkdownList/*: MarkdownComponent<>*/ = ({ node }) => {
  const elementType = getListElementType(node);
  return h(elementType, {}, h(MarkdownChildren, { node }));
};
export const MarkdownListItem/*: MarkdownComponent<>*/ = ({ node }) => {
  return h('li', {}, [
    node.checked !== null && [
      h('input', { type: 'checkbox', disabled: true, checked: node.checked }),
    ],
    h(MarkdownChildren, { node, spread: node.spread })
  ]);
};
export const MarkdownLink/*: MarkdownComponent<>*/ = ({ node }) => {
  return h('a', { href: node.url, title: node.title || node.url }, h(MarkdownChildren, { node }));
};
export const MarkdownCode/*: MarkdownComponent<>*/ = ({ node }) => {
  return h('code', { className: 'block' }, h('pre', {}, node.value));
}
export const MarkdownInlineCode/*: MarkdownComponent<>*/ = ({ node }) => {
  return h('pre', { className: 'inline', style: { display: 'inline' }}, node.value);
}

export const MarkdownThematicBreak/*: MarkdownComponent<>*/ = ({ node }) => {
  return h('hr', {});
}
export const MarkdownImage/*: MarkdownComponent<>*/ = ({ node }) => {
  return h('img', { src: node.url, alt: node.alt, title: node.title });
}
export const MarkdownBlockquote/*: MarkdownComponent<>*/ = ({ node }) => {
  return h('blockquote', { }, h(MarkdownChildren, { node }))
}
export const MarkdownDirective/*: MarkdownComponent<>*/ = ({ node }) => {
  const { directiveComponents } = useContext(markdownContext);

  const component = directiveComponents[node.name];
  if (!component) {
    console.warn(`Directive component "${node.name}" not found in map!`);
    return null;
  }

  return h(component, { node }, h(MarkdownChildren, { node }))
}
export const MarkdownTable/*: MarkdownComponent<>*/ = ({ node }) => {
  return h('table', {}, [
    h(MarkdownChildren, { node })
  ])
}
export const MarkdownTableRow/*: MarkdownComponent<>*/ = ({ node }) => {
  return h('tr', {}, [
    h(MarkdownChildren, { node })
  ])
}
export const MarkdownTableCell/*: MarkdownComponent<>*/ = ({ node }) => {
  return h('td', {}, [
    h(MarkdownChildren, { node })
  ])
}

export const MarkdownChildren/*: Component<{ node: MarkdownASTNode, spread?: boolean }>*/ = ({ node, spread }) => {
  return node.children.map(node => h(MarkdownNode, { node, spread }));
}
export const MarkdownNode/*: Component<{ node: MarkdownASTNode, spread?: boolean }>*/ = ({ node, spread }) => {
  const { externalComponents } = useContext(markdownContext);
  const externalComponent = externalComponents[node.type];

  if (externalComponent)
    return h(externalComponent, { node });
  
  switch (node.type) {
    case 'root':
      return h(MarkdownRoot, { node });
    case 'paragraph':
      return h(MarkdownParagraph, { node, spread });
    case 'text':
      return h(MarkdownText, { node });
    case 'heading':
      return h(MarkdownHeading, { node });
    case 'emphasis':
      return h(MarkdownEmphasis, { node });
    case 'list':
      return h(MarkdownList, { node })
    case 'listItem':
      return h(MarkdownListItem, { node })
    case 'link':
      return h(MarkdownLink, { node })
    case 'code':
      return h(MarkdownCode, { node })
    case 'inlineCode':
      return h(MarkdownInlineCode, { node })
    case 'thematicBreak':
      return h(MarkdownThematicBreak);
    case 'image':
      return h(MarkdownImage, { node })
    case 'blockquote':
      return h(MarkdownBlockquote, { node });
    case 'strong':
      return h(MarkdownStrong, { node });
    case 'leafDirective':
    case 'textDirective':
    case 'containerDirective':
      return h(MarkdownDirective, { node });
    case 'table':
      return h(MarkdownTable, { node });
    case 'tableRow':
      return h(MarkdownTableRow, { node });
    case 'tableCell':
      return h(MarkdownTableCell, { node })
    default:
      console.warn(`Unsupported markdown node type`);
      console.warn(node);
      return null;
  }
};

/*::
export type ComponentMap = {
  [string]: Component<{ node: MarkdownASTNode }>
};

export type MarkdownContext = {
  directiveComponents: ComponentMap,
  externalComponents: ComponentMap,
};
*/

export const markdownContext/*: Context<MarkdownContext>*/ = createContext({
  directiveComponents: {},
  externalComponents: {} ,
});

/*::
export type MarkdownRendererProps = {
  markdownText: string,
  directiveComponents?: ComponentMap,
  externalComponents?: ComponentMap,
};
*/

const parser = unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(remarkGfm)
  .use(remarkHeading, { defaults: true })
  .use(remarkHeadings)

export const parseMarkdown = (text/*: string*/)/*: MarkdownASTNode*/ => {
  const ast = parser.parse(text);
  return parser.runSync(ast, text);
}

export const useMarkdownAST = (text/*: string*/)/*: MarkdownASTNode*/ => {
  return useMemo(() => parseMarkdown(text), [text]);
}

export const MarkdownRenderer/*: Component<MarkdownRendererProps>*/ = ({
  markdownText,
  directiveComponents = {},
  externalComponents = {}
}) => {
  const root = useMarkdownAST(markdownText)

  return h(MarkdownASTRenderer, { root, directiveComponents, externalComponents });
};

/*::
type MarkdownASTRendererProps = {
  root: MarkdownASTNode,
  directiveComponents?: ComponentMap,
  externalComponents?: ComponentMap,
};
*/
export const MarkdownASTRenderer/*: Component<MarkdownASTRendererProps>*/ = ({
  root, directiveComponents = {}, externalComponents = {}
}) => {
  return [
    h(markdownContext.Provider, { value: { directiveComponents, externalComponents } },
      h(MarkdownNode, { node: root })
    ),
  ];
}

export * from './text.js';