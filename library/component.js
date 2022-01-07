// @flow strict
/*:: import type { ElementNode, Element } from './element.js'; */
/*::
export type Props = { +[string]: mixed };

export type FunctionComponent<T> = (props: { ...T, children: $ReadOnlyArray<Element> }) => ElementNode;
export type Component<T = {}> = string | (props: { ...T, children: $ReadOnlyArray<Element> }) => ElementNode;
*/
export const Boundary/*: Component<{ fallback: Element | Component<{ value: mixed }> }>*/ = 'act:boundary';