// @flow strict
/*::
import type { Commit3 } from "../../reconciler/commit3";
import type { Diff3, DiffSet } from "../../reconciler/diff";
import type { CommitDiff } from '@lukekaalim/act-reconciler';
import type { PropDiff, PropDiffRegistry } from '@lukekaalim/act-renderer-core';
*/
import { calculatePropsDiff } from '@lukekaalim/act-renderer-core'

const propBlacklist = new Set(['ref', 'key', 'children']);

export const setStylesProp = (
  element/*: HTMLElement | SVGElement*/,
  { prev, next }/*: PropDiff*/
) => {
  const style = element.style;
  const prevRules = typeof prev === 'object' && prev || {};
  const nextRules = typeof next === 'object' && next || {};

  const reg = calculatePropsDiff(prevRules, nextRules);

  for (const [rule, { next }] of reg.map) {
    const nextRuleValue = (typeof next === 'string' || typeof next === 'number') ? next : null;
    if (typeof (style/*: any*/)[rule] !== 'undefined')
      (style/*: any*/)[rule] = nextRuleValue;
    else
      if (nextRuleValue === null)
        style.removeProperty(rule);
      else
        style.setProperty(rule, nextRuleValue.toString());
  }
};

export const setEventListenerProp = (
  element/*: Element*/,
  { key, prev, next }/*: PropDiff*/
) => {
  const event = key.slice(2).toLowerCase();

  if (typeof prev === 'function')
    element.removeEventListener(event, ((prev/*: any*/)/*: EventListener*/));
  if (typeof next === 'function')
    element.addEventListener(event, ((next/*: any*/)/*: EventListener*/));
};

export const setAttributeProp = (
  element/*: Element*/,
  { key, prev, next }/*: PropDiff*/
) => {
  if (next === null && prev !== null)
    element.removeAttribute(key);
  else if (next !== null)
    switch (typeof next) {
      case 'string':
        element.setAttribute(key, next);
      case 'number':
      case 'boolean':
        element.setAttribute(key, next.toString());
      default:
    }
};

export const setDOMTokenList = (
  list/*: DOMTokenList*/,
  prop/*: PropDiff*/
)/*: void*/ => {
  const next = prop.next;
  if (typeof prop.next === 'string')
    // $FlowFixMe
    return list.value = prop.next;
  else if (Array.isArray(next)) {
    const removed = [...list].filter(e => !next.includes(e));
    for (const item of removed)
      list.remove(item);
    for (const item of next)
      typeof item === 'string' && list.add(item);
  }
}

export const setHTMLProp = (
  element/*: HTMLElement | SVGElement*/,
  prop/*: PropDiff*/
) => {
  if (prop.key.startsWith('on'))
    setEventListenerProp(element, prop);
  else if (prop.key === 'style')
    setStylesProp(element, prop);
  else if (prop.key in element && !propBlacklist.has(prop.key) && element instanceof HTMLElement) {
    const htmlElement = (element/*: Object*/);
    if (htmlElement[prop.key] instanceof DOMTokenList)
      setDOMTokenList(htmlElement[prop.key], prop);
    else
      htmlElement[prop.key] = prop.next;
  }
  else
    setAttributeProp(element, prop);
}

export const setHTMLProps = (
  element/*: HTMLElement | SVGElement*/,
  registry/*: PropDiffRegistry*/
) => {
  for (const [_, propDiff] of registry.map)
    setHTMLProp(element, propDiff);
};

export const setTextProps = (
  element/*: Text*/,
  registry/*: PropDiffRegistry*/
) => {
  const content = registry.prop('content', '').next;
  if (content !== element.textContent)
    element.textContent = typeof content === 'string' ? content : '';
};

export const setProps = (
  element/*: ?Node*/,
  diff/*: CommitDiff*/
) => {
  const propDiff = calculatePropsDiff(diff.prev.element.props, diff.next.element.props);
  if (element instanceof HTMLElement || element instanceof SVGElement)
    setHTMLProps(element, propDiff);
  if (element instanceof Text)
    setTextProps(element, propDiff);
};

export const setWebProps2 = (
  element/*: Node*/,
  set/*: DiffSet*/,
  diff/*: Diff3*/,
) => {
  const prev = set.prevs.map.get(diff.commit.id);
  const propDiff = calculatePropsDiff(prev ? prev.element.props : {}, diff.commit.element.props);
  if (element instanceof HTMLElement || element instanceof SVGElement)
    setHTMLProps(element, propDiff);
  if (element instanceof Text)
    setTextProps(element, propDiff);
}

export const setRef = (
  node/*: ?Node*/,
  diff/*: CommitDiff*/
) => {;
  const ref/*: any*/ = diff.next.element.props['ref'];
  if (typeof ref === 'function') {
    if (diff.prev.pruned)
      (ref/*: Function*/)(node);
    else if (diff.next.pruned)
      (ref/*: Function*/)(null);
  } else if (ref && typeof ref === 'object') {
    if (diff.prev.pruned)
      ref['current'] = node;
    else if (diff.next.pruned)
      ref['current'] = null;
  }
};
