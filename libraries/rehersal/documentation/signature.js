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
  optional?: boolean,
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
export type OpaqueType = {
  type: 'opaque',
  name: string,
}
export type Type =
  | string
  | ObjectType
  | FunctionType
  | OpaqueType

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
  source: string,
  aliases?: string[],
  type?: Type,
  summary?: Node,
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
    argument.optional ? '?: ' : ': ',
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
  return h('dl', { className: styles.functionTypeArgumentsDescriptionList }, [
    type.arguments.map(argument => {
      return argument.name ? [
        h('dt', { id: `${name}.${argument.name}`}, argument.name),
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

const AliasDescription = ({ name, aliases = [], source = 'module' }) => {
  return [
    h('p', {}, [
      `Import as `,
      h('strong', {}, `"${name}"`),
      aliases.length > 0 ? [
        ` or as alias `,
        h('strong', {}, aliases.map(alias =>`"${alias}"`).join(', ')),
      ] : null,
      `.`
    ]),
  ]
};

export const ExportDescription/*: Component<ExportDescriptionProps>*/ = ({ name, source, summary = null, type = null, aliases = [] }) => {
  return h('section', { className: styles.signature }, [
    h(FragmentAnchorHeading, { fragment: name }, name),
    h(AliasDescription, { name, source, aliases }),
    type && typeof type === 'object' && type.type === 'function' && [
      h('div', { className: styles.exportType },
        h('code', {},
          h('pre', {}, [
            `export ${name} = `,
            h(TypeDescription, { type, indent: 0, fragment: name })
          ]))),
      h(FunctionTypeArgumentsDescriptionList, { type, name })
    ],
    summary && h('hr'),
    summary,
  ]);
};