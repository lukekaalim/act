// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import { h } from '@lukekaalim/act';
import styles from './documentation.module.css';

/*::
export type OpaqueTypeExpression = {
  type: 'opaque',
  name: string,

  referenceURL?: URL,
  genericArguments?: TypeExpression[],
};

export type ObjectTypeExpression = {
  type: 'object',

  entries: {
    key: string,
    optional?: boolean,
    value: TypeExpression,
    referenceURL?: URL,
  }[],
};

export type FunctionTypeExpression = {
  type: 'function',
  genericArguments?: {
    name: string,
    restriction?: TypeExpression,
    fallback?: TypeExpression,
    referenceURL?: URL,
  }[],

  returns: TypeExpression,
  arguments: {
    name: string,
    optional?: boolean,
    value: TypeExpression,
    referenceURL?: URL,
  }[]
}

export type FunctionDeclarationStatement = {
  ...FunctionTypeExpression,
  name: string,
};
export type ExpressionDeclarationStatement = {
  type: 'expression',
  expression: TypeExpression
};
export type AssignmentStatement = {
  type: 'assignment',
  name: string,
  value: TypeExpression,
};

export type UnionTypeExpression = {
  type: 'union',

  values: TypeExpression[],
};

export type ArrayTypeExpression = {
  type: 'array',

  element: TypeExpression,
}
export type TupleTypeExpression = {
  type: 'tuple',
  elements: TypeExpression[],
}

export type TypeExpression =
  | OpaqueTypeExpression
  | ObjectTypeExpression
  | FunctionTypeExpression
  | UnionTypeExpression
  | ArrayTypeExpression
  | TupleTypeExpression

export type TypeStatement =
  | FunctionDeclarationStatement
  | ExpressionDeclarationStatement
  | AssignmentStatement
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
      const { genericArguments = null } = expression;
      return [
        h(LinkWrapper, { href: expression.referenceURL },
          h('span', { className: ['hljs-built_in'].join(' ') }, expression.name)),
        genericArguments && [
          '<',
          genericArguments.map((genericArgument, index) => [
            h(TypeExpressionRenderer, { indentationLevel, expression: genericArgument }),
            index === genericArguments .length - 1 ? null : ', ',
          ])
          ,
          '>'
        ]
      ];
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
          expression.entries.map(entry => [
            h(NewLine, { indentationLevel: indentationLevel + 1 }),
            h(LinkWrapper, { href: entry.referenceURL },
              h('span', { className: [].join('') }, entry.key)),
            entry.optional ? '?: ' : ': ',
            h(TypeExpressionRenderer, { indentationLevel: indentationLevel + 1, expression: entry.value }),
            ',',
          ]),
          h(NewLine, { indentationLevel }),
          '}',
        ]
      case 'function':
        const singleLineFunction = expression.arguments.length === 0;
        return [
          expression.genericArguments && expression.genericArguments.length > 0 && ([
            '<',
            expression.genericArguments.map((generic, index) => [
              h(LinkWrapper, { href: generic.referenceURL },
                h('span', { className: [].join() }, generic.name)),
              generic.restriction ?
                [
                  ': ',
                  h(TypeExpressionRenderer, { indentationLevel: indentationLevel + 1, expression: generic.restriction })
                ] : null,
              index === (expression.genericArguments || []).length - 1 ? null : ', ',
            ]),
            '>'
          ]) || null,
          '(',
          expression.arguments.map(argument => [
            singleLineFunction ? null : h(NewLine, { indentationLevel: indentationLevel + 1 }),
            h(LinkWrapper, { href: argument.referenceURL },
              h('span', { className: [].join(' ') }, argument.name)),
            argument.optional ? '?: ' : ': ',
            h(TypeExpressionRenderer, { indentationLevel: indentationLevel + 1, expression: argument.value }),
            singleLineFunction ? null : ',',
          ]),
          singleLineFunction ? null : h(NewLine, { indentationLevel }),
          ') => ',
          h(TypeExpressionRenderer, { indentationLevel, expression: expression.returns })
        ]
      case 'tuple':
        return [
          '[',
            expression.elements.map((element, index) => [
              h(TypeExpressionRenderer, { indentationLevel, expression: element }),
              index === expression.elements.length - 1 ? null : ', ',
            ]),
          ']'
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

const TypeStatementRenderer = ({ indentationLevel, statement }) => {
  switch (statement.type) {
    case 'function':
      const singleLineFunction = statement.arguments.length === 0;
      return [
        h('span', { className: 'hljs-keyword' }, 'function'),
        ' ',
        h('span', { className: 'hljs-title function' }, statement.name),
        statement.genericArguments && statement.genericArguments.length > 0 && ([
          '<',
          statement.genericArguments.map((generic, index) => [
            h(LinkWrapper, { href: generic.referenceURL },
              h('span', { className: [].join() }, generic.name)),
            generic.restriction ?
              [
                ': ',
                h(TypeExpressionRenderer, { indentationLevel: indentationLevel + 1, expression: generic.restriction })
              ] : null,
            index === (statement.genericArguments || []).length - 1 ? null : ', ',
          ]),
          '>'
        ]) || null,
        '(',
        statement.arguments.map(argument => [
          singleLineFunction ? null : h(NewLine, { indentationLevel: indentationLevel + 1 }),
          h(LinkWrapper, { href: argument.referenceURL },
            h('span', { className: [].join(' ') }, argument.name)),
          argument.optional ? '?: ' : ': ',
          h(TypeExpressionRenderer, { indentationLevel: indentationLevel + 1, expression: argument.value }),
          singleLineFunction ? null : ',',
        ]),
        singleLineFunction ? null : h(NewLine, { indentationLevel }),
        '): ',
        h(TypeExpressionRenderer, { indentationLevel, expression: statement.returns })
      ]
    case 'expression':
      return h(TypeExpressionRenderer, { indentationLevel, expression: statement.expression })
    case 'assignment':
      return [
        h('span', { className: 'hljs-keyword' }, 'type'),
        ' ',
        h('span', { className: 'hljs-title class_' }, statement.name),
        ' = ',
        h(TypeExpressionRenderer, { indentationLevel, expression: statement.value })
      ]
  }
}

export const TypeDocumentation/*: Component<{ statement: TypeStatement }>*/ = ({ statement }) => {
  return h('code', { className: styles.documentation }, h('pre', { className: 'hljs' }, [
    h(TypeStatementRenderer, { indentationLevel: 0, statement })
  ]));
}