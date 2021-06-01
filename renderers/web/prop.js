// @flow strict
/*:: import type { PropDiff, CommitDiff, UpdateDiff, CreateDiff } from '@lukekaalim/act-reconciler'; */
import { calculatePropsDiff } from '@lukekaalim/act-reconciler'

const propBlacklist = new Set(['ref', 'key', 'children']);

export const setStylesProp = (
  element/*: HTMLElement | SVGElement*/,
  { prev, next }/*: PropDiff*/
) => {
  const style = element.style;
  const prevRules = typeof prev === 'object' && prev || {};
  const nextRules = typeof next === 'object' && next || {};

  const diff = calculatePropsDiff(prevRules, nextRules);

  for (const [rule, { next }] of diff.entries()) {
    const nextRuleValue = (typeof next === 'string' || typeof next === 'number') ? next : null;
    (style/*: Object*/)[rule] = nextRuleValue;
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
  if (next === null && typeof prev === 'string')
    element.removeAttribute(key);
  else if (typeof next === 'string')
    element.setAttribute(key, next);
};

export const setHTMLProp = (
  element/*: HTMLElement | SVGElement*/,
  prop/*: PropDiff*/
) => {
  if (prop.key.startsWith('on'))
    setEventListenerProp(element, prop);
  else if (prop.key === 'style')
    setStylesProp(element, prop);
  else if (prop.key in element && !propBlacklist.has(prop.key) && element instanceof HTMLElement)
    // literal property set
    (element/*: Object*/)[prop.key] = prop.next;
  else
    setAttributeProp(element, prop);
}

export const setHTMLProps = (
  element/*: HTMLElement | SVGElement*/,
  diff/*: UpdateDiff | CreateDiff*/
) => {
  const propDiffs = calculatePropsDiff(diff.prev ? diff.prev.element.props : {}, diff.next.element.props)
  for (const [_, propDiff] of propDiffs)
    setHTMLProp(element, propDiff);
};

export const setTextProps = (
  element/*: Text*/,
  diff/*: UpdateDiff | CreateDiff*/
) => {
  const { content } = diff.next.element.props;
  element.textContent = typeof content === 'string' ? content : '';
};

export const setProps = (
  element/*: ?Node*/,
  diff/*: UpdateDiff | CreateDiff*/
) => {
  if (element instanceof HTMLElement || element instanceof SVGElement)
    setHTMLProps(element, diff);
  if (element instanceof Text)
    setTextProps(element, diff);
};