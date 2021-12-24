// @flow strict
/*:: import type { Component, ElementNode } from '@lukekaalim/act'; */
import { fromMarkdown } from 'mdast-util-from-markdown';
import { directive } from 'micromark-extension-directive'
import { h, useEffect, useState, useMemo, createContext, useContext } from '@lukekaalim/act';
import { directiveFromMarkdown } from 'mdast-util-directive';

const MarkdownRoot = ({ node }) => {
  return h(MarkdownChildren, { node });
}
const MarkdownParagraph = ({ node }) => {
  return h('p', {}, h(MarkdownChildren, { node }));
}
const MarkdownText = ({ node }) => {
  return node.value;
}
const MarkdownEmphasis = ({ node }) => {
  return h('i', {}, h(MarkdownChildren, { node }));
}
const MarkdownStrong = ({ node }) => {
  return h('strong', { }, h(MarkdownChildren, { node }))
}
const getHeadingElementType = (node) => {
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
const MarkdownHeading = ({ node }) => {
  const elementType = getHeadingElementType(node);
  return h(elementType, {}, h(MarkdownChildren, { node }));
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
const MarkdownList = ({ node }) => {
  const elementType = getListElementType(node);
  return h(elementType, {}, h(MarkdownChildren, { node }));
};
const MarkdownListItem = ({ node }) => {
  return h('li', {}, h(MarkdownChildren, { node }));
};
const MarkdownLink = ({ node }) => {
  return h('a', { href: node.url, title: node.title || node.url }, h(MarkdownChildren, { node }));
};
const MarkdownChildren = ({ node }) => {
  return node.children.map(node => h(MarkdownNode, { node }));
}
const MarkdownCode = ({ node }) => {
  return h('pre', { className: 'block' }, node.value);
}
const MarkdownInlineCode = ({ node }) => {
  return h('pre', { className: 'inline', style: { display: 'inline' }}, node.value);
}

const MarkdownThematicBreak = ({ node }) => {
  return h('hr', {});
}
const MarkdownImage = ({ node }) => {
  return h('img', { src: node.url, alt: node.alt, title: node.title });
}
const MarkdownBlockquote = ({ node }) => {
  return h('blockquote', { }, h(MarkdownChildren, { node }))
}
const MarkdownLeafDirective = ({ node }) => {
  const { directiveComponents } = useContext(markdownContext);

  const { name, attributes } = node;

  const component = directiveComponents[name];
  if (!component) {
    console.warn(`Directive component "${name}" not found in map!`);
    return null;
  }

  return h(component, { attributes }, h(MarkdownChildren, { node }))
}

const MarkdownNode = ({ node }) => {
  switch (node.type) {
    case 'root':
      return h(MarkdownRoot, { node });
    case 'paragraph':
      return h(MarkdownParagraph, { node });
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
      return h(MarkdownLeafDirective, { node });
    default:
      console.warn(`Unsupported markdown node type`);
      console.warn(node);
      return null;
  }
};

const extensions = [
  directive()
];
const mdastExtensions = [
  directiveFromMarkdown
];

/*::
export type DirectiveComponentMap = {
  [string]: Component<{ attributes: { [string]: string } }>
};

export type MarkdownContext = {
  directiveComponents: DirectiveComponentMap
};
*/

const markdownContext = createContext/*:: <MarkdownContext>*/({ directiveComponents: {} });

/*::
export type MarkdownRendererProps = {
  markdownText: string,
  directiveComponents?: DirectiveComponentMap
};
*/

export const MarkdownRenderer/*: Component<MarkdownRendererProps>*/ = ({
  markdownText,
  directiveComponents = {}
}) => {
  const root = fromMarkdown(markdownText, { extensions, mdastExtensions });

  return [
    h(markdownContext.Provider, { value: { directiveComponents } },
      h(MarkdownNode, { node: root })
    ),
  ];
};

export const AsyncMarkdownRenderer/*: Component<{ getMarkdownText: () => Promise<string> }>*/ = ({ getMarkdownText }) => {
  const [markdownText, setMarkdownText] = useState(null);
  useEffect(() => {
    getMarkdownText()
      .then(markdownText => setMarkdownText(markdownText))
  }, [getMarkdownText]);

  return markdownText && h(MarkdownRenderer, { markdownText });
}

export const RemoteMarkdownRenderer/*: Component<{ markdownURL: string }>*/ = ({ markdownURL }) => {
  const getMarkdownText = useMemo(() => {
    return async () => {
      const response = await fetch(markdownURL);
      const text = await response.text();
      return text;
    };
  }, [markdownURL])

  return h(AsyncMarkdownRenderer, { getMarkdownText });
}