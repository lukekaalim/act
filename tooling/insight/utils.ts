import { Element, errorBoundaryType, primitiveNodeTypes, providerNodeType, renderNodeType } from "@lukekaalim/act";
import { CommitPath, CommitRef } from "@lukekaalim/act-recon";

export const getElementName = (element: Element) => {
  if (typeof element.type === 'function')
    return `<component(${element.type.name})>`;
  if (typeof element.type === 'symbol')
    switch (element.type) {
      case primitiveNodeTypes.number:
        return `<number value={${element.props.value}}>`
      case primitiveNodeTypes.string:
        return `<string value="${element.props.value}">`
      case primitiveNodeTypes.boolean:
        return `<boolean value="${element.props.value}">`
      case primitiveNodeTypes.array:
        return `<array>`
      case primitiveNodeTypes.null:
        return `<null>`
      case renderNodeType:
        return `<render type="${element.props.type}">`;
      case providerNodeType:
        return `<context id="${element.props.id}">`;
      case errorBoundaryType:
        return `<boundary>`;
      default:
        return `<symbol>`
    }
  if (element.type)
    return `<${element.type}>`;
  return '<none>';
}


export const findCommonAncestor = (commitRefs: CommitRef[]) => {
  let commonAncestorPath: CommitPath | null = null;
  for (const ref of commitRefs) {
    if (!commonAncestorPath)
      commonAncestorPath = ref.path
    else {
      for (const id of [...ref.path].reverse()) {
        const index = commonAncestorPath.indexOf(id);
        if (index !== -1) {
          commonAncestorPath = commonAncestorPath.slice(0, index + 1)
          break;
        }
      }
    }
  };
  if (commonAncestorPath)
    return CommitRef.from(commonAncestorPath);
  return null;
}