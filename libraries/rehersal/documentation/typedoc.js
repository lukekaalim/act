// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import { h } from '@lukekaalim/act';
import styles from './documentation.module.css';

/*::
export type OpaqueTypeExpression = {
  type: 'opaque',
  name: string,

  referenceURL?: URL,
};

export type ObjectTypeExpression = {
  type: 'object',

  entries: {
    key: string,
    value: TypeExpression,
    referenceURL?: URL,
  }[],
};

export type FunctionTypeExpression = {
  type: 'function',

  returns: TypeExpression,
  arguments: {
    name: string,
    value: TypeExpression,
    referenceURL?: URL,
  }[]
}

export type UnionTypeExpression = {
  type: 'union',

  values: TypeExpression[],
};

export type ArrayTypeExpression = {
  type: 'array',

  element: TypeExpression,
}

export type TypeExpression =
  | OpaqueTypeExpression
  | ObjectTypeExpression
  | FunctionTypeExpression
  | UnionTypeExpression
  | ArrayTypeExpression
*/

const NewLine = ({ indentationLevel }) => {
  return [
    '\n',
    Array.from({ length: indentationLevel }, () => '\t')
  ];
}

const LinkWrapper = ({ href, children }) => {
  if (href)
    return h('a', { href }, children);
  return children;
}

const TypeExpressionRenderer = ({ indentationLevel, expression }) => {
  switch (expression.type) {
    case 'opaque':
      return h(LinkWrapper, { href: expression.referenceURL },
        h('span', { className: styles.identifier }, expression.name));
    case 'union':
      return expression.values.map((value, index) =>
        index === 0 ?
          h(TypeExpressionRenderer, { indentationLevel, expression: value })
          :
          [' | ', h(TypeExpressionRenderer, { indentationLevel, expression: value })]
        )
      case 'object':
        return [
          '{',
          h(NewLine, { indentationLevel }),
          expression.entries.map(entry => [
            h(LinkWrapper, { href: entry.referenceURL },
              h('span', { className: styles.name }, entry.key)),
            ': ',
            h(TypeExpressionRenderer, { indentationLevel: indentationLevel + 1, expression: entry.value }),
            ',',
            h(NewLine, { indentationLevel }),
          ]),
          '}',
        ]
      case 'function':
        const singleLineFunction = expression.arguments.length <= 1;
        return [
          '(',
          expression.arguments.map(argument => [
            singleLineFunction ? null : h(NewLine, { indentationLevel: indentationLevel + 1 }),
            h(LinkWrapper, { href: argument.referenceURL },
              h('span', { className: styles.name }, argument.name)),
            ': ',
            h(TypeExpressionRenderer, { indentationLevel: indentationLevel + 1, expression: argument.value }),
            singleLineFunction ? null : ',',
          ]),
          singleLineFunction ? null : h(NewLine, { indentationLevel }),
          ') => ',
          h(TypeExpressionRenderer, { indentationLevel, expression: expression.returns })
        ]
      case 'array':
        return [
          h(TypeExpressionRenderer, { indentationLevel, expression: expression.element }),
          '[]',
        ]
      default:
        throw new Error(`Unknown Type Expression`)
  }
}

export const TypeDocumentation/*: Component<{ expression: TypeExpression }>*/ = ({ expression }) => {
  return h('code', { className: styles.documentation }, h('pre', {}, [
    h(TypeExpressionRenderer, { indentationLevel: 0, expression })
  ]));
}