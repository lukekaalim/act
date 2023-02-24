// @flow strict
/*::
import type { TypeDocArgument, TypeDocNode } from ".";
*/
/*::
export type FlowProgram =
  | { type: 'Program', body: FlowStatement[] }

export type FlowTypeAliasStatement =
  | { type: 'TypeAlias', id: FlowIdentifier, right: FlowAnnotation }
export type VariableDeclaration =
  | { type: 'VariableDeclaration', kind: 'const' }
export type FlowExportNamedDeclarationStatement =
  | { type: 'ExportNamedDeclaration', declaration: FlowTypeAliasStatement, exportKind: 'type' }
  | { type: 'ExportNamedDeclaration', declarations: VariableDeclaration, exportKind: 'value' }

export type FlowStatement =
  | FlowTypeAliasStatement
  | FlowExportNamedDeclarationStatement
  | VariableDeclaration
  | { type: 'VariableDeclaration' }

export type FlowIdentifier =
  | { type: 'Identifier', name: string, optional: boolean, right: FlowAnnotation }

export type FlowFunctionParam =
  | { type: 'FunctionTypeParam', name: FlowIdentifier, optional: boolean, typeAnnotation: FlowAnnotation }

export type FlowAnnotation =
  | { type: 'ObjectTypeAnnotation', properties: FlowObjectProperty[] }
  | { type: 'VoidTypeAnnotation' }
  | { type: 'NumberTypeAnnotation' }
  | { type: 'StringTypeAnnotation' }
  | { type: 'BooleanTypeAnnotation' }
  | { type: 'BooleanLiteralTypeAnnotation', value: boolean }
  | { type: 'FunctionTypeAnnotation', params: FlowFunctionParam[], returnType: FlowAnnotation }

export type FlowObjectProperty =
  | { type: 'ObjectTypeProperty', key: FlowIdentifier, value: FlowAnnotation }
*/

export const createFlowFunctionParamTypeDocParameter = (argument/*: FlowFunctionParam*/)/*: TypeDocArgument*/ => {
  return {
    type: 'arg',
    name: argument.name.name,
    value: createFlowAnnotationTypeDocNode(argument.typeAnnotation)
  }
}

export const createFlowAnnotationTypeDocNode = (annotation/*: FlowAnnotation*/)/*: TypeDocNode*/ => {
  console.log(annotation, annotation.type)
  switch (annotation.type) {
    case 'VoidTypeAnnotation':
      return { type: 'undefined' };
    case 'NumberTypeAnnotation':
      return { type: 'number' }
    case 'FunctionTypeAnnotation':
      return {
        type: 'function',
        arguments: annotation.params.map(argument =>
          createFlowFunctionParamTypeDocParameter(argument)),
        returns: createFlowAnnotationTypeDocNode(annotation.returnType),
        throws: { type: 'undefined' }
      };
    case 'ObjectTypeAnnotation':
      return {
        type: 'object',
        properties: annotation.properties.map(({ key, value }) => ({
          type: 'prop',
          key: { type: 'literal', value: key.name },
          value: createFlowAnnotationTypeDocNode(value)
        }))
      }
    case 'StringTypeAnnotation':
      return { type: 'string' }
    case 'BooleanTypeAnnotation':
      return { type: 'boolean' };
    case 'BooleanLiteralTypeAnnotation':
      return { type: 'literal', literal: annotation.value }
    default:
      throw new Error(annotation.type);
  }
}