// @flow strict
import { assert } from '@lukekaalim/test';

/*::
import type { DocTestAssertion } from ".";
import type { Assertion } from '@lukekaalim/test';
import type { TypeDocDeclarationStatement } from "../typedoc";
import type { DocBlock } from "./block";

type DocAssertNode = 
  | { type: 'assert', assertion: Assertion }

type DocTextualNode =
  | { type: 'text', text: string }
  | { type: 'markdown', text: string }

type DocInteractiveNode =
  | { type: 'param', key: string }

type DocDataNode =
  | { type: 'type-declaration', typeDeclaration: TypeDocDeclarationStatement }

type DocSubBlockNode =
  | { type: 'block', block: DocBlock<any> }

export type DocNode =
  | DocAssertNode
  | DocTextualNode
  | DocInteractiveNode
  | DocDataNode
  | DocSubBlockNode

  | { type: 'result' }
  | { type: 'output', key: string }

  | DocNode[]

export type TypeDocFunction = {
  assert: () => DocAssertNode,
  equals: ({ [string]: mixed }) => DocAssertNode,

  md: (text: string[], ...nodes: DocNode[]) => DocNode,
  block: <T: { [string]: mixed }>(parameterDefaults: T, parameterTypes: { [string]: string }, executeBlock: T => DocNode) => DocSubBlockNode,
};
*/

export const docIs/*: TypeDocFunction["is"]*/ = (description, pass) => ({
  type: 'assert',
  assertion: assert(description, Array.isArray(pass) ? pass.map(a => a.assertion) : pass)
});

export const docBlock/*: TypeDocFunction["block"]*/ = /*:: <T: { [string]: mixed }>*/(
  parameterDefaults,
  parameterTypes,
  executeBlock
)/*: DocSubBlockNode*/ => {
  const block = {
    parameterDefaults,
    parameterTypes,
    executeBlock
  }
  return { type: 'block', block }
}

export const doc/*: TypeDocFunction*/ = {
  is: docIs,
  block: docBlock,
};