// @flow strict

import { h } from "@lukekaalim/act";
import styles from './index.module.css';

/*::
import type { Component } from "../../library/component";

export type TypeDocProgram =
  | { type: 'program', declarations: TypeDocStatement[] }

export type TypeDocDeclarationStatement = {
  type: 'declaration',
  id: string,
  value: TypeDocNode,
  exported: boolean,
  generic: null | TypeDocGenericAnnotation
}

export type TypeDocStatement =
  | TypeDocDeclarationStatement

export type TypeDocGenericParameter =
  | { type: 'param', key: string, constraint: TypeDocNode }
export type TypeDocGenericArgument =
  | { type: 'argument', value: TypeDocNode }
export type TypeDocGenericAnnotation =
  | { type: 'generic', generic: TypeDocGenericParameter[] }

export type TypeDocObjectPropertyKey =
  | { type: 'literal', value: string | number }
  | { type: 'index', index: TypeDocNode }

export type TypeDocObjectProperty =
  | { type: 'prop', key: TypeDocObjectPropertyKey, value: TypeDocNode }

export type TypeDocArgument =
  | { type: 'arg', name: string, value: TypeDocNode }


export type TypeDocNode =
  | { type: 'union', options: TypeDocNode[] }
  | { type: 'reference', id: string }
  | { type: 'interface' }
  | { type: 'class' }
  | { type: 'object', properties: TypeDocObjectProperty[] }
  | { type: 'array', elements: TypeDocNode }
  | { type: 'tuple', elements: TypeDocNode[] }
  | { type: 'function', arguments: TypeDocArgument[], returns: TypeDocNode, throws: TypeDocNode }
  | { type: 'null' }
  | { type: 'undefined' }
  | { type: 'unknown' }
  | { type: 'any' }
  | { type: 'string' }
  | { type: 'number' }
  | { type: 'boolean' }
  | { type: 'literal', literal: number | string | boolean }
*/

/*::
export type RenderTypeDocNodeProps = {
  node: TypeDocNode,
  depth?: number,
};
export type RenderTypeDocObjectPropertyProps = {
  prop: TypeDocObjectProperty,
  depth?: number,
};
export type RenderTypeDocObjectPropertyKeyProps = {
  key: TypeDocObjectPropertyKey,
  depth?: number,
};
*/

export const isMultiLineNode = (node/*: TypeDocNode*/)/*: boolean*/ => {
  switch (node.type) {
    case 'object':
      return node.properties.length > 1 || true;
    case 'array':
      return isMultiLineNode(node.elements);
    case 'function':
    default:
      return false;
  }
}

export const RenderTypeDocObjectPropertyKey /*: Component<RenderTypeDocObjectPropertyKeyProps>*/= ({
  key, depth = 0
}) => {
  switch (key.type) {
    case 'literal':
      return h('span', { class: styles.identifier }, [
        key.value.toString()
      ])
    case 'index':
      return h('span', { style: { color: '#f79e8f' } }, [
        '[',
        h('span', {}, [
          h(RenderTypeDocNode, { node: key.index, depth: depth + 2 }),
        ]),
        ']',
      ])
  }
}

export const RenderTypeDocObjectProperty/*: Component<RenderTypeDocObjectPropertyProps>*/  = ({
  prop, depth = 0
}) => {
  return h('span', {}, [
    h(RenderTypeDocObjectPropertyKey, { key: prop.key, depth: depth + 2 }),
    h('span', { class: styles.keyColon }, ': '),
    h('span', {}, h(RenderTypeDocNode, { node: prop.value, depth: depth + 2 }))
  ])
}

export const RenderTypeDocNode/*: Component<RenderTypeDocNodeProps>*/ = ({
  node,
  depth = 0
}) => {
  switch (node.type) {
    case 'object':
      return h('span', {}, [
        h('span', { class: styles.objectBraces }, '{'),
        node.properties.length > 0 && h('div', { class: styles.objectPropertyList },
          node.properties.map(prop =>
            h('div', {}, [
              h(RenderTypeDocObjectProperty, { prop, depth: depth + 2 }),
              h('span', { class: styles.propertyComma }, ',')
            ]))),
        h('span', { class: styles.objectBraces }, '}'),
      ]);
    case 'function':
      return h('span', {}, [
        h('span', { class: styles.functionParenthesis }, '('),
        node.arguments.length > 0 && h('div', { class: styles.argumentList }, [
          node.arguments.length === 1 && node.arguments.map(arg => [
            h('span', {  class: styles.argumentId  }, arg.name),
            h('span', { class: styles.parameterComma }, ': '),
            h(RenderTypeDocNode, { node: arg.value, depth: depth + 2 }),
            h('span', { class: styles.parameterComma })
          ]),
          node.arguments.length > 1 && node.arguments.map(arg => [
            h('div', {}, [
              h('span', { class: styles.argumentId }, arg.name),
              h('span', { class: styles.parameterComma }, ': '),
              h(RenderTypeDocNode, { node: arg.value, depth: depth + 2 }),
              h('span', { class: styles.parameterComma }, ',')
            ])
          ])
        ]),
        h('span', { class: styles.functionParenthesis }, ') => '),
        h('span', {}, h(RenderTypeDocNode, { node: node.returns, depth: depth + 2 }))
      ])
    case 'string':
    case 'boolean':
    case 'number':
    case 'null':
      return h('span', { class: styles.typeId }, node.type);
    case 'undefined':
      return h('span', { class: styles.typeId }, 'void');
    case 'literal':
      return h('span', { style: { color: 'yellow' }}, node.literal.toString());
    case 'reference':
      return h('a', { class: styles.typeId, href: `#${node.id}` }, node.id)
    default:
      return 'Unsupported type'
  }
};

export * from './flow.js';
export * from './typescript.js';