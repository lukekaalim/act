import { Element } from "@lukekaalim/act";
import { CommitRef3 } from "./commit3";
import { EffectRegistry } from "./effect";

declare type ComponentService2 = {
  render: (ref: CommitRef3, element: Element, effect: EffectRegistry) => ReadonlyArray<Element>,
  remove: (ref: CommitRef3, effect: EffectRegistry) => void,
}