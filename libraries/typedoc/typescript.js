// @flow strict
import { FunctionDeclaration } from 'browser-typescript-parser';

/*::
import type { TypeDocNode } from ".";

export type TypescriptFile = {
  declarations: TypescriptDeclaration[]
};

export type TypescriptDeclaration =
  | TypescriptFunctionDeclaration

export type TypescriptFunctionDeclaration = {
  name: string,
  type: string,
  parameters: TypescriptParameterDeclaration[]
}

export type TypescriptParameterDeclaration = {
  name: string,
  type: string,
}
*/

export const createTypescriptDeclarationTypeDocNode = (declaration/*: TypescriptDeclaration*/)/*: TypeDocNode*/ => {
  if (declaration instanceof FunctionDeclaration) {
    console.log(declaration);
    return {
      type: 'function',
      arguments: declaration.parameters.map(param => ({
        type: 'arg',
        name: param.name,
        value: { type: 'reference', id: param.type }
      })),
      returns: { type: 'reference', id: declaration.type },
      throws: { type: 'any' },
    }
  }
  return { type: 'any' }
}

export const createTypescriptFileTypeDocNode = (file/*: TypescriptFile*/)/*: TypeDocNode*/ => {
  const firstDeclaration = file.declarations.find(Boolean);
  if (!firstDeclaration)
    throw new Error();

  return createTypescriptDeclarationTypeDocNode(firstDeclaration);
}