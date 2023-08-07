
import { Component } from '@lukekaalim/act';
import type { Root, Content } from 'mdast'

export function parseMarkdown(text: string): Root;

export type ComponentMap = {
  [nodeType: string]: Component<{ node: Content }>
};

export type MarkdownRendererProps = {
  markdownText: string,
  directiveComponents?: ComponentMap,
  externalComponents?: ComponentMap,
};

export const MarkdownRenderer: Component<MarkdownRendererProps>;

export type MarkdownASTRendererProps = {
  root: Root,
  directiveComponents?: ComponentMap,
  externalComponents?: ComponentMap,
};

export const MarkdownASTRenderer: Component<MarkdownASTRendererProps>;

export type MarkdownNodeProps = {
  node: Content,
  spread?: boolean
}

export const MarkdownNode: Component<MarkdownNodeProps>;