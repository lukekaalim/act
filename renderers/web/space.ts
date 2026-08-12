import * as act from '@lukekaalim/act';

import { setProps } from './props.ts';
import { NodeBuilder } from '@lukekaalim/act-backstage';
import { htmlRegistry, svgRegistry } from './element.ts';

const GLOBAL_WINDOW = window;

export const HTML: act.Component<{
  window?: typeof window,
  attach?: Element
}> = ({ children, window = GLOBAL_WINDOW, attach = null }) => {
  return act.h(act.renderNodeType, { type: 'web:html', window, attach }, children);
}
export const SVG: act.Component<{
  window?: typeof window,
  attach?: Element,
}> = ({ children, window = GLOBAL_WINDOW, attach = null }) => {
  return act.h(act.renderNodeType, { type: 'web:svg', window, attach }, children);
}

export type WebRootProps = { type: 'web:html' | 'web:svg', window: Window, attach: null | Element };
export type WebNode = HTMLElement | SVGElement | Text;

export const createWebNodeBuilder = (): NodeBuilder<WebNode, WebRootProps> => ({
  roots: new Set(['web:html', 'web:svg'] as const),

  create(element, { type: rootType, window: { document } }) {
    const tag = element.type;
    
    switch (typeof tag) {
      case 'symbol': {
        switch (tag) {
          case act.primitiveNodeTypes.string:
          case act.primitiveNodeTypes.number:
            return document.createTextNode((element.props.value as any).toString());
          default:
            return null;
        }
      }
      case 'string': {
        switch (rootType) {
          case 'web:html': {
            const prim = htmlRegistry.create(element);
            if (prim)
              return prim;
            return document.createElementNS('http://www.w3.org/1999/xhtml', tag);
          }
          case 'web:svg': {
            const prim = svgRegistry.create(element);
            if (prim)
              return prim;
            return document.createElementNS('http://www.w3.org/2000/svg', tag);
          }
        }
      }
      default:
        return null;
    }
  },
  update(el, next, prev, _, { window }) {
    setProps(window, el, next, prev);
  },
  isRootLinkable(root) {
    return !!root.attach;
  },
  link(el, parent) {
    parent.appendChild(el);
  },
  linkRoot(child, root) {
    root.attach!.appendChild(child);
  },
  unlink(el, parent) {
    if (el.parentNode === parent)
      parent.removeChild(el);
  },
  destroy(el) {
    if (el.parentNode)
      el.parentNode.removeChild(el)
  },
  suspend(el, parent) {
    if (el instanceof HTMLElement)
      el.style.opacity = 0.5.toString();
  },
  unsuspend(el, parent) {
    if (el instanceof HTMLElement)
      el.style.opacity = (1).toString();
  },
  sort(el, newChildren) {
    if (el instanceof Text)
      return;

    for (const child of el.childNodes)
      if (!newChildren.includes(child as HTMLElement))

    if (newChildren.length < 2)
      return;

    for (let i = 0; i < newChildren.length; i++)
      if (el.children[i] !== newChildren[i])
        el.insertBefore(newChildren[i], el.children[i])
  },
})