import type { DiffSet, Diff3, Commit3, CommitID3 } from "@lukekaalim/act-reconciler";
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
  create: (type: string, props: Props, children: ReadonlyArray<Element>) => T,
  update: (node: T, set: DiffSet, next: Diff3) => void,
  attach: (node: T, set: DiffSet, next: Diff3, children: T[]) => void,
  remove: (node: T, set: DiffSet, next: Diff3, children: T[]) => void,
};

export type Renderer2<T> = {
  render: (diff: DiffSet, commitId: CommitID3) => T[],
  getNodes: (diff: DiffSet, commitId: CommitID3) => T[],
};

export declare function createNullRenderer2<A, B> (
  internalRenderer?: null | Renderer2<A> | (() => Renderer2<A>),
  skipTypes?: ElementType[]
): Renderer2<B>

export declare function createRenderer2 <T>(
  implementation: RendererImplementation<T>,
  nextRenderer?: Renderer2<T>,
): Renderer2<T>

export type PropDiff = {
  key: string,
  prev: unknown,
  next: unknown,
};
export type PropDiffRegistry = {
  map: Map<string, PropDiff>,
  prop: (name: string, fallback?: unknown) => PropDiff,
}