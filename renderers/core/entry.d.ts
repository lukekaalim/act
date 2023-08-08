import type { Commit, DiffSet, CommitID, Diff3 } from "@lukekaalim/act-reconciler";
import type { Element, ElementType, Props } from "@lukekaalim/act";

export type RendereredNode<T> =
  | { type: 'empty' }
  | { type: 'skip' }
  | { type: 'node', node: T }

export type RenderResult2<T> = {
  node: T,
  commit: Commit3,
};

export type RendererImplementation<T> = {
  create: (type: string, props: Props, children: $ReadOnlyArray<Element>) => T,
  update: (node: T, set: DiffSet, next: Diff3) => void,
  attach: (node: T, set: DiffSet, next: Diff3, children: T[]) => void,
  remove: (node: T, set: DiffSet, next: Diff3, children: T[]) => void,
};

export type Renderer2<T> = {
  render: (diff: DiffSet, commitId: CommitID3) => T[],
  getNodes: (diff: DiffSet, commitId: CommitID3) => T[],
};

declare export function createNullRenderer2<A, B> (
  internalRenderer?: null | Renderer2<A> | (() => Renderer2<A>),
  skipTypes?: ElementType[]
): Renderer2<B>