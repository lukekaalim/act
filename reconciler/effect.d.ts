import { CleanupFunc, Effect } from "@lukekaalim/act";
import { SchedulePriority2, Scheduler2 } from "./scheduler2";

export type EffectID = string;
export type RegisteredEffect = {
  id: EffectID,
  runEffect: Effect,
  cleanup: null | CleanupFunc,
  priority: SchedulePriority2
}
export type EffectRegistry = {
  effectMap: Map<EffectID, RegisteredEffect>,

  pending: {
    registered: Map<EffectID, Effect>,
    updated: Map<EffectID, Effect>,
    removed: Set<EffectID>,
  },

  registerEffect: (runEffect: () => void | (() => unknown), priority?: 'normal') => EffectID,
  updateEffect: (id: EffectID, runEffect: () => void | (() => mixed), priority?: 'normal') => void,
  teardownEffect: (id: EffectID) => void,

  clone: () => EffectRegistry,
}
export type EffectService = {
  runEffectRegistry: (registry: EffectRegistry) => EffectRegistry,
};

declare export function createEffectService(
  scheduler: Scheduler2
): EffectService