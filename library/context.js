// @flow strict
/*:: import type { Component } from './component.js'; */
import { createElement } from './element.js';
import { createId } from './ids.js';
/*::
export opaque type ContextID: string = string;

export type Context<T> = {|
  contextId: ContextID,
  defaultValue: T,
  Provider: Component<{| value: T |}>
|};
*/

export const createContext = /*:: <T>*/(defaultValue/*: T*/)/*: Context<T>*/ => {
  const contextId = createId();
  const Provider = ({ value, children }) =>
    createElement('act:context', { value, contextId }, children);

  return {
    defaultValue,
    contextId,
    Provider,
  };
};
