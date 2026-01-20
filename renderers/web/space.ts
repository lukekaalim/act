import * as act from '@lukekaalim/act';

import { setProps } from './props.ts';
import { NodeBuilder } from '@lukekaalim/act-backstage';

export const HTML: act.Component = ({ children }) => act.h(act.renderNodeType, { type: 'web:html' }, children);
export const SVG: act.Component = ({ children }) => act.h(act.renderNodeType, { type: 'web:svg' }, children);

const defaultWindow = window;

export const createWebNodeBuilder = (
  root: HTMLElement,
  window: Window = defaultWindow
): NodeBuilder<HTMLElement | SVGElement | Text, 'web:html' | 'web:svg'> => ({
  roots: new Set(['web:html', 'web:svg'] as const),

  create(element, rootType) {
    const tag = element.type;
    
    switch (typeof tag) {
      case 'symbol': {
        switch (tag) {
          case act.primitiveNodeTypes.string:
          case act.primitiveNodeTypes.number:
            return window.document.createTextNode("<empty text>");
          default:
            return null;
        }
      }
      case 'string': {
        switch (rootType) {
          case 'web:html':
            return window.document.createElementNS('http://www.w3.org/1999/xhtml', tag);
          case 'web:svg':
            return window.document.createElementNS('http://www.w3.org/2000/svg', tag);
        }
      }
      default:
        return null;
    }
  },
  update(el, next, prev) {
    setProps(window, el, next, prev);
  },
  link(el, parent) {
    parent.appendChild(el);
  },
  linkRoot(child) {
    root.appendChild(child);
  },
  unlink(el, parent) {
    if (el.parentNode === parent)
      parent.removeChild(el);
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
    if (newChildren.length < 2)
      return;

    for (let i = 0; i < newChildren.length; i++)
      if (el.children[i] !== newChildren[i])
        el.insertBefore(newChildren[i], el.children[i])
  },
})