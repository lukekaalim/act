import { h, s } from 'hastscript';
import { Element, Nodes as HNode, Root } from 'hast';
import { NodeBuilder, RenderSpace2, setPropObject } from "@lukekaalim/act-backstage";
import { Node, primitiveNodeTypes, createElement } from '@lukekaalim/act';
import { CommitID, CommitTree2, Reconciler2, Scheduler } from '@lukekaalim/act-recon';
import { createDOMScheduler } from './scheduler';
import { recon } from '../three/deps';
import { HTML } from './space';

export const createHASTBuilder = (root: Root): NodeBuilder<HNode, 'web:html' | 'web:svg'> => ({
  roots: new Set(['web:html', 'web:svg']),

  create(element, root): HNode | null {
    switch (element.type) {
      case primitiveNodeTypes.string:
      case primitiveNodeTypes.string:
      case primitiveNodeTypes.number:
        return { type: 'text', value: '' };
      default: {
        switch (typeof element.type) {
          case 'string':
            switch (root) {
              case 'web:html':
                return h(element.type);
              case 'web:svg':
                return s(element.type);
            }
          default:
            return null;
        }
      }
    }
  },
  link(child, parent) {
    switch (child.type) {
      case 'element':
      case 'comment':
      case 'text':
        switch (parent.type) {
          case 'element':
          case 'root':
            parent.children.push(child);
        }
        return;
      case 'doctype':
        switch (parent.type) {
          case 'root':
            parent.children.push(child);
        }
        return;
      default:
    }
  },
  linkRoot(child) {
    switch (child.type) {
      case 'doctype':
      case 'element':
      case 'comment':
      case 'text':
        root.children.push(child);
    }
  },
  update(el, next, prev, ref) {
    switch (el.type) {
      case 'text':
        el.value = (next.props.value as number | string | boolean).toString()
        return;
      case 'element':
        el.properties['data-commit-id'] = ref.id;
        setPropObject(el.properties, next.props, prev?.props || {}, (prop, next, prev) => {
          // event handlers not supported
          if (prop.startsWith('on'))
            return true;

          switch (prop) {
            case 'style':
              const style = Object.entries(next as {}).map(([key, value]) => `${key}: ${value};`).join(' ');
              el.properties['style'] = style;
              return true;
            default:
              // complex objects not supported
              switch (typeof next) {
                case 'object':
                case 'function':
                case 'undefined':
                case 'symbol':
                  return true;
              }
              el.properties[prop as string] = next as string;
              return true;
          }
        })
        return;
    }
  },
  unlink(child, parent) {
    if ("children" in parent) {
      parent.children = parent.children.filter(c => c !== child);
    }
  },
  sort(el, children) {
    if ("children" in el) {
      el.children = children as Element[];
    }
  },
})
