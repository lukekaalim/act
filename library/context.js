// @flow strict
/*:: import type { Component } from './component.js'; */
import { h } from './element.js';
import { createId } from './ids.js';
/*::
export opaque type ContextID: string = string;

export type Context<T> = {|
  contextId: ContextID,
  defaultValue: T,
  Provider: Component<{| value: T |}>
|};

export type ContextProviderProps = {
  value: mixed,
  contextId: ContextID,
}
*/

export const Provider/*: Component<ContextProviderProps>*/ = 'act:context';

export const createContext = /*:: <T>*/(defaultValue/*: T*/)/*: Context<T>*/ => {
  const contextId = createId();
  const Provider = ({ value, children }) =>
    h('act:context', { value, contextId }, children);

  return {
    defaultValue,
    contextId,
    Provider,
  };
};
