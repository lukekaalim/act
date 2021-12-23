// @flow strict
/*:: import type { Component, ElementNode as Node } from "@lukekaalim/act"; */
import { h } from '@lukekaalim/act';

import styles from './documentation.module.css';
import { FragmentAnchorHeading } from './headings';
import linkIconSrc from './icons8-link-30.png';

/*::
type FunctionTypeArgument = {
  name?: string,
  description?: Node,
  type: Type
}
export type FunctionType = {
  type: 'function',
  arguments: FunctionTypeArgument[],
  return: Type
}
export type ObjectType = {
  type: 'object'
}
export type Type =
  | string
  | ObjectType
  | FunctionType

export type TypeDescriptionProps = {
  type: Type,
  indent: number,
  fragment?: ?string,
};
export type FunctionTypeDescriptionProps = {
  type: FunctionType,
  indent: number,
  fragment?: ?string,
};

export type ExportDescriptionProps = {
  name: string,
  aliases?: Node[],
  type: Type,
  summary: Node,
  usage: Node,
}

export type FunctionExportProps = {
  name: string,
  aliases?: string[],
  importPath: string,
  functionType: FunctionType,
}
*/

export const TypeDescription/*: Component<TypeDescriptionProps>*/ = ({ type, indent, fragment }) => {
  if (typeof type === 'string')
    return h('i', {}, type);
  switch (type.type) {
    case 'function':
      return h(FunctionTypeDescription, { type, indent, fragment });
    default:
      return null;
  }
};

const FunctionTypeNamedArgumentDescription = ({ fragment = null, argument, indent }) => {
  const href = fragment && argument.name && `#${fragment}.${argument.name}`;
  return [
    h('strong', {},
      href ? h('a', { href }, argument.name) : argument.name
    ),
    ': ',
    h(TypeDescription, { type: argument.type, indent }),
  ];
}
const FunctionTypeArgumentDescription = ({ argument, indent, fragment }) => {
  const { type, name } = argument;
  if (!name)
    return h(TypeDescription, { indent, type });
  return h(FunctionTypeNamedArgumentDescription, { argument, indent, fragment });
}

const FunctionTypeArgumentListDescription = ({ args, indent, fragment }) => {
  if (args.length === 0)
    return null;
  if (args.length === 1) {
    const [argument] = args;
    return h(FunctionTypeArgumentDescription, { argument, indent, fragment });
  }

  return args
    .map((arg, i) => [
      h(NewLine, { indent }),
      h(FunctionTypeArgumentDescription, { argument: arg, indent, fragment }),
      i < args.length - 1 ? ',' : null,
    ])
};

const NewLine = ({ indent }) => {
  return [
    '\n',
    Array.from({ length: indent }, () => '\t')
  ];
}

export const FunctionTypeDescription/*: Component<FunctionTypeDescriptionProps>*/ = ({ type, indent, fragment }) => {
  const isMultiline = type.arguments.length > 1;
  const hasParenthesis = isMultiline || type.arguments.length === 0 || type.arguments[0].name;

  return [
    hasParenthesis ? '(' : null,
    h(FunctionTypeArgumentListDescription, { args: type.arguments, indent: indent + 1, fragment }),
    isMultiline ? h(NewLine, { indent }) : null,
    hasParenthesis ? ')' : null,
    ' => ',
    h(TypeDescription, { type: type.return, indent })
  ]
}

const FunctionTypeArgumentsDescriptionList = ({ name, type }) => {
  return h('dl', {}, [
    type.arguments.map(argument => {
      return argument.name ? [
        h('dt', { id: `${name}.${argument.name}`}, h('strong', {}, argument.name)),
        h('dd', {}, argument.description || null),
      ] : null;
    })
  ]);
}

const FunctionDescription = ({ name, type }) => {
  return [
    h('div', { className: styles.exportType },
      h('code', {},
        h('pre', {},
          h(TypeDescription, { type, indent: 0 })))),
    h(FunctionTypeArgumentsDescriptionList, { type, name }),
  ]
};

export const ExportDescription/*: Component<ExportDescriptionProps>*/ = ({ name, summary, type, aliases = [], usage }) => {
  return h('section', { className: styles.signature }, [
    h(FragmentAnchorHeading, { fragment: name }, name),
    aliases.length > 0 && h('span', { className: styles.aliases }, aliases),
    h('div', { className: styles.exportType }, h('code', {}, h('pre', {}, h(TypeDescription, { type, indent: 0, fragment: name })))),
    typeof type !== 'string' && type.type === 'function' && h(FunctionTypeArgumentsDescriptionList, { type, name }),
    h('hr'),
    summary,
    usage && h('h4', {}, 'Usage'),
    usage,
  ]);
};