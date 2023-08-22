
import { Component, Props } from '@lukekaalim/act';
import type { Root, RootContent, RootContentMap } from 'mdast'
import type { Directives } from "mdast-util-directive";


export function parseMarkdown(text: string): Root;

export type MarkdownDirectiveComponentProps = {
  node: Directives,
}

export type ComponentMap<TProps extends Props> = {
  [nodeType: string]: Component<TProps>
};

export type MarkdownRendererProps = {
  markdownText: string,
  directiveComponents?: ComponentMap<MarkdownDirectiveComponentProps>,
  externalComponents?: ComponentMap<{ node: RootContentMap[keyof RootContentMap] }>,
};

export const MarkdownRenderer: Component<MarkdownRendererProps>;

export type MarkdownASTRendererProps = {
  root: Root,
  directiveComponents?: ComponentMap<MarkdownDirectiveComponentProps>,
  externalComponents?: ComponentMap<{ node: RootContentMap[keyof RootContentMap] }>,
};

export const MarkdownASTRenderer: Component<MarkdownASTRendererProps>;

export type MarkdownNodeProps = {
  node: RootContentMap[keyof RootContentMap],
  spread?: boolean
}

export const MarkdownNode: Component<MarkdownNodeProps>;