import { h, Node, primitiveNodeTypes, specialNodeTypes } from "@lukekaalim/act";
import { NodeBuilder, RenderSpace2 } from "@lukekaalim/act-backstage";
import { Reconciler2 } from "@lukekaalim/act-recon";
import { createDOMScheduler } from "@lukekaalim/act-web";

export type JSON =
  | JSON[]
  | { [key in string]: JSON }
  | string
  | number
  | boolean
  | null

// Slightly more complex object
// model to handle the XML like structure of
// the tree to JSON

type JSONValueSegment =
  | JSONObjectSegment
  | JSONArraySegment
  | { type: 'value', value: string | number | boolean | null }

type JSONObjectSegment = { type: 'object', properties: JSONPropertySegment[], ref: { [key in string]: JSON } }
type JSONArraySegment = { type: 'array', elements: JSONIndexSegment[], ref: JSON[] };

type JSONPropertySegment = { type: 'property', parent: null | JSONObjectSegment, name: string, value: null | JSONValueSegment }
type JSONIndexSegment = { type: 'index', parent: null | JSONArraySegment, index: number, value: null | JSONValueSegment }

type JSONSegment =
  | JSONValueSegment
  | JSONPropertySegment
  | JSONIndexSegment

export const createJSONNodeBuilder = (root: JSON[]): NodeBuilder<JSONSegment, 'json'> => ({
  roots: new Set(["json"]),

  create(element) {
    switch (element.type) {
      case 'object':
        return { type: 'object', properties: [], ref: {} }
      case 'array':
        return { type: 'array', elements: [], ref: [] }
      case 'property':
        return { type: 'property', name: '', value: null, parent: null }
      case 'index':
        return { type: 'index', index: 0, value: null, parent: null };

      case primitiveNodeTypes.string:
      case primitiveNodeTypes.number:
      case primitiveNodeTypes.boolean:
        return { type: 'value', value: element.props.value as string | number | boolean  }
      case primitiveNodeTypes.null:
        return { type: 'value', value: null }

      default:
        return null;
    }
  },
  update(el, next, prev) {
    switch (el.type) {
      case 'value':
        el.value = next.props.value as string | number | boolean;
        return;
      case 'index':
        el.index = next.props.index as number;
        return;
      case 'property':
        el.name = next.props.name as string;
        return;
      default:
        return;
    }
  },
  link(child, parent) {
    if (child.type === 'value') {
      switch (parent.type) {
        case 'property':
          const property = parent;
          property.value = child;
          return;
        case 'index':
          const index = parent;
          index.value = child;
          return;
        default:
          throw new Error();
      }
    }
    if (child.type === 'property') {
      if (parent.type !== 'object')
        throw new Error();
      parent.properties.push(child);
      child.parent = parent;
    }
    if (child.type === 'index') {
      if (parent.type !== 'array')
        throw new Error();
      parent.elements.push(child);
      child.parent = parent;
    }
  },
  sort(el, children) {
    switch (el.type) {
      case 'array':
        el.ref.length = 0;
        for (const index of el.elements) {
          if (!index.value)
            continue;
          switch (index.value.type) {
            case 'value':
              el.ref[index.index] = index.value.value;
              break;
            case 'object':
            case 'array':
              el.ref[index.index] = index.value.ref;
              break;
          }
        }
        return;
      case 'object':
        for (const property of el.properties) {
          if (!property.value)
            continue;
          switch (property.value.type) {
            case 'value':
              el.ref[property.name] = property.value.value;
              break;
            case 'object':
            case 'array':
              el.ref[property.name] = property.value.ref;
              break;
          }
        }
    }
  },
  linkRoot(child) {
    switch (child.type) {
      case 'value':
        root.push(child.value)
        break;
      case 'object':
      case 'array':
        root.push(child.ref);
        break;
    }
  },
  destroy: function (el: JSON): unknown {
    throw new Error("Function not implemented.");
  }
})

export const render = (node: Node, root: JSON[]) => {
  const scheduler = createDOMScheduler();
  const reconciler = new Reconciler2(scheduler);
  const space = new RenderSpace2(reconciler.tree, createJSONNodeBuilder(root))

  reconciler.bus = {
    render(delta) {
      space.create(delta);
      space.update(delta);
    },
  }
  reconciler.mount(node);
}
