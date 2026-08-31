import * as act from '@lukekaalim/act';
import { createPrimitiveRegistry } from '@lukekaalim/act-backstage';
import * as Toolbelt from 'ts-toolbelt';
import { Instance } from 'ts-toolbelt/out/Class/Instance';

export interface ExtendedHTMLPrimitives {}
export interface ExtendedSVGPrimitives {}

const HTMLClasses = {
  div: HTMLDivElement,
  span: HTMLSpanElement,
  main: HTMLElement,
  article: HTMLElement,
  section: HTMLElement,
  p: HTMLParagraphElement,
  i: HTMLElement,
  strong: HTMLElement,
  title: HTMLTitleElement,

  h1: HTMLHeadingElement,
  h2: HTMLHeadingElement,
  h3: HTMLHeadingElement,
  h4: HTMLHeadingElement,
  h5: HTMLHeadingElement,
  h6: HTMLHeadingElement,

  body: HTMLBodyElement,
  head: HTMLHeadElement,
  meta: HTMLMetaElement,
  link: HTMLLinkElement,
  pre: HTMLPreElement,
  code: HTMLElement,
  area: HTMLAreaElement,

  ol: HTMLOListElement,
  li: HTMLLIElement,
  ul: HTMLUListElement,
  menu: HTMLMenuElement,
  nav: HTMLOListElement,
  br: HTMLBRElement,

  form: HTMLFormElement,
  input: HTMLInputElement,
  label: HTMLLabelElement,
  button: HTMLButtonElement,
  meter: HTMLMeterElement,
  select: HTMLSelectElement,
  option: HTMLOptionElement,
  progress: HTMLProgressElement,
  time: HTMLTimeElement,
  output: HTMLOutputElement,
  textarea: HTMLTextAreaElement,
  data: HTMLDataElement,
  datalist: HTMLDataListElement,
  dialog: HTMLDialogElement,

  table: HTMLTableElement,
  tbody: HTMLTableSectionElement,
  thead: HTMLTableSectionElement,
  tfoot: HTMLTableSectionElement,
  tr: HTMLTableRowElement,
  th: HTMLTableCellElement,
  td: HTMLTableCellElement,

  a: HTMLAnchorElement,
  legend: HTMLLegendElement,
  quote: HTMLQuoteElement,

  map: HTMLMapElement,

  audio: HTMLAudioElement,
  video: HTMLVideoElement,
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  iframe: HTMLIFrameElement,
  source: HTMLSourceElement,
  track: HTMLTrackElement,
  picture: HTMLPictureElement,
};
export type HTMLClasses = { [name in keyof typeof HTMLClasses]: Instance<(typeof HTMLClasses)[name]> };
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
      in Exclude<Toolbelt.Object.WritableKeys<T>, 'style' | 'classList'>
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
  .registerUnhandledPrimitives([...Object.keys(HTMLClasses) as (keyof HTMLClasses)[]]);

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
