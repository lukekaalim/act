import {
  Element,
  specialNodeTypes,
  primitiveNodeTypes,
} from "@lukekaalim/act";

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
      case specialNodeTypes.fallback:
        return `<fallback>`;
      case specialNodeTypes.suspend:
        return `<suspend>`;
      case specialNodeTypes.render:
        return `<render type="${element.props.type}">`;
      case specialNodeTypes.provider:
        return `<context id="${element.props.id}">`;
      case specialNodeTypes.boundary:
        return `<boundary>`;
      default:
        return `<symbol>`
    }
  if (element.type)
    return `<${element.type}>`;
  return '<none>';
}
