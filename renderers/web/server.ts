import { h, s } from 'hastscript';
import { Element, Nodes as HNode, Root } from 'hast';
import { NodeBuilder, RenderSpace2 } from "@lukekaalim/act-backstage";
import { primitiveNodeTypes } from '@lukekaalim/act';
import { CommitTree2 } from '@lukekaalim/act-recon';

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
  update(el, next, prev) {
    switch (el.type) {
      case 'text':
        el.value = (next.props.value as number | string | boolean).toString()
        return;
      case 'element':

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

type DehydratedRender = {
  
}

export const dehydrate = (tree: CommitTree2, renderer: RenderSpace2<HNode, string | symbol>) => {

}

export const rehydrate = () => {

}
