// @flow strict
/*:: import type { Component, Props } from './component.js'; */
import { createId } from "./ids.js";
/*::
export type ElementNode =
  | string
  | number
  | false
  | null
  | $ReadOnlyArray<ElementNode>
  | Element

export type ElementType = string | Component<Props>;

export opaque type ElementID: string = string;
export type Element = {|
  +id: ElementID,
  +type: ElementType,
  +props: { +[string]: mixed },
  +children: $ReadOnlyArray<Element>,
|};
*/

const defaultProps = {};
const defaultChildren = [];

class MyElement {
  /*::
  +id: string;
  +type: Component<any>;
  +props: { +[string]: mixed };
  +children: ElementNode;
  */
 constructor(type/*: any*/, props/*: any*/, children/*: any*/) {
  this.id = createId();
  this.type = type;
  this.props = props;
  this.children = children;
 }
}

export const createElement = /*:: <T: {}>*/(
  type/*: Component<T>*/,
  props/*: T*/ = (defaultProps/*: any*/),
  children/*: ElementNode*/ = defaultChildren
)/*: Element*/ => {
  return {
    id: createId(),
    // $FlowFixMe
    type,
    props,
    children: normalizeElement(children)
  };
};
export {
  createElement as h,
};

export const normalizeElement = (element/*: ElementNode*/)/*: Element[]*/ => {
  if (Array.isArray(element))
    return element.map(normalizeElement).flat(1);
  if (!element && typeof element !== 'number')
    return [createElement('act:null')];
  switch (typeof element) {
    case 'number':
    case 'string':
      return [createElement('act:string', { content: element.toString() })];
    case 'object':
      return [element];
    default:
      (element/*: empty*/)
      throw new Error('Unexpected element');
  }
};
