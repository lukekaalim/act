import { Element } from "@lukekaalim/act";
import { CommitRef3 } from "./commit3.js";
import { EffectRegistry } from "./effect.js";
import { ContextService2 } from "./context2.js";

declare type ComponentService2 = {
  render: (ref: CommitRef3, element: Element, effect: EffectRegistry) => ReadonlyArray<Element>,
  remove: (ref: CommitRef3, effect: EffectRegistry) => void,
}

export declare function createComponentService(
  context: ContextService2,
  updateCommit: (ref: CommitRef3) => unknown,
): ComponentService2