import * as act from '@lukekaalim/act';
import { createPrimitiveRegistry } from '@lukekaalim/act-backstage';
import { Object } from 'ts-toolbelt';

export interface ExtendedHTMLPrimitives {}
export interface ExtendedSVGPrimitives {}

type HTMLClasses = {
  div: HTMLDivElement,
  span: HTMLSpanElement,
  main: HTMLElement,
  article: HTMLElement,
  section: HTMLElement,
  p: HTMLParagraphElement,
  i: HTMLElement,
  strong: HTMLElement,
  title: HTMLTitleElement,

  body: HTMLBodyElement,
  head: HTMLHeadElement,
  meta: HTMLMetaElement,

  ol: HTMLOListElement,
  li: HTMLLIElement,
  ul: HTMLUListElement,
  menu: HTMLMenuElement,
  nav: HTMLOListElement,

  form: HTMLFormElement,
  input: HTMLInputElement,
  label: HTMLLabelElement,
  button: HTMLButtonElement,
  meter: HTMLMeterElement,
  select: HTMLSelectElement,
  option: HTMLOptionElement,
  progress: HTMLProgressElement,
  time: HTMLTimeElement,

  table: HTMLTableElement,
  tbody: HTMLTableSectionElement,
  thead: HTMLTableSectionElement,
  tfoot: HTMLTableSectionElement,
  tr: HTMLTableRowElement,
  th: HTMLTableCellElement,
  td: HTMLTableCellElement,

  a: HTMLAnchorElement,

  map: HTMLMapElement,

  audio: HTMLAudioElement,
  video: HTMLVideoElement,
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  iframe: HTMLIFrameElement,
  source: HTMLSourceElement,
};
type SVGClasses = {
  svg: SVGSVGElement,
  rect: SVGRectElement,
  line: SVGLineElement,
  path: SVGPathElement,
  text: SVGTextElement,
  g: SVGGElement,
}
type BuiltinHTMLPrimitives = { [Key in keyof HTMLClasses]: PropsFromClass<HTMLClasses[Key]> } & {
  [act.primitiveNodeTypes.string]: { value: string },
  [act.primitiveNodeTypes.number]: { value: number },
  [act.primitiveNodeTypes.boolean]: { value: boolean },
}
type BuiltinSVGPrimitives = { [Key in keyof SVGClasses]: PropsFromClass<SVGClasses[Key]> } & {

}

type AllHTMLPrimitives = BuiltinHTMLPrimitives & ExtendedHTMLPrimitives;
type AllSVGPrimitives = BuiltinSVGPrimitives & ExtendedSVGPrimitives;


type HTMLElementProps<T extends HTMLElement> = {
  style?: { [key in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[key] } & { [key in string]?: string },
  classList?: readonly (string | false | null | void)[],
  className?: string | false | null | void,
  attributes?: Record<string, string>,
};
type SVGElementProps<T extends SVGElement> = {
  style?: { [key in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[key] } & { [key in string]?: string },
  classList?: readonly (string | false | null | void)[],
  attributes?: Record<string, string>,
};

type WritableProps<T extends {}> = {
  [
    Key
      in Exclude<Object.WritableKeys<T>, 'style' | 'classList'>
      as (T[Key] extends string | number | boolean ? Key : never)
  ]?: T[Key]
};
type EventHandlers<T> = {
  [Key in keyof EventMap]?: (this: T, event: GlobalEventHandlersEventMap[EventMap[Key]] & { currentTarget: T }) => unknown
}


export type PropsFromClass<T extends HTMLElement | SVGElement | Text> = {
  ref?: act.WriteOnlyRef<T>,
}
  & (T extends HTMLElement ? HTMLElementProps<T> : {})
  & (T extends SVGElement ? SVGElementProps<T> : {})
  & WritableProps<T>
  & EventHandlers<T>

export const htmlRegistry = createPrimitiveRegistry<AllHTMLPrimitives, HTMLElement | Text>()
  .registerUnhandledPrimitives([
    'a', 'audio', 'article',
    'body', 'button',
    'canvas',
    'div', 'form',
    'head',
    'i', 'iframe', 'img',
    'label', 'li', 'main',
    'map', 'menu', 'meta', 'meter',
    'nav',
    'ol', 'option',
    'p', 'progress',
    'section', 'select', 'source', 'span', 'strong',
    'title', 'time', 'table', 'tbody', 'thead', 'tfoot', 'tr', 'th', 'td',
    'ul',
    'video',
  ]);

export const svgRegistry = createPrimitiveRegistry<AllSVGPrimitives, SVGElement>()
  .registerUnhandledPrimitives([
    'g', 'line', 'path', 'rect', 'svg', 'text'
  ]);

export const html = htmlRegistry.elements;
export const svg = svgRegistry.elements;

type EventMap = {
  onClick: "click",
  onContextMenu: "contextmenu"

  onMouseEnter: "mouseenter",
  onMouseMove: "mousemove",
  onMouseLeave: "mouseleave",

  onPointerEnter: "pointerenter",
  onPointerMove: "pointermove",
  onPointerLeave: "pointerleave",

  onKeyDown: "keydown",
  onKeyUp: "keyup",

  onFocus: "focus",
  onBlur: 'blur',

  onInput: "input",
  onChange: "change",
} & ExtendedEventNames;

export interface ExtendedEventNames {}
