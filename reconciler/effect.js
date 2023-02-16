// @flow strict

import { createId } from "@lukekaalim/act";

/*::
import type { Effect, CleanupFunc } from "@lukekaalim/act";
import type {
  SchedulePriority2,
  ScheduledTask,
  Scheduler2,
} from "./scheduler2";

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

  registerEffect: (runEffect: () => ?(() => mixed), priority?: 'normal') => EffectID,
  updateEffect: (id: EffectID, runEffect: () => ?(() => mixed), priority?: 'normal') => void,
  teardownEffect: (id: EffectID) => void,

  clone: () => EffectRegistry,
}
export type EffectService = {
  runEffectRegistry: (registry: EffectRegistry) => EffectRegistry,
};
*/

export const createEffectRegistry = (effectMap/*: Map<EffectID, RegisteredEffect>*/ = new Map())/*: EffectRegistry*/ => {
  const registered = new Map();
  const updated = new Map();
  const removed = new Set();

  const pending = {
    registered,
    updated,
    removed,
  }

  const registerEffect = (runEffect, priority = 'normal') => {
    const id = createId();
    registered.set(id, runEffect);
    return id;
  };
  const teardownEffect = (id) => {
    removed.add(id)
  };
  const updateEffect = (id, runEffect) => {
    updated.set(id, runEffect);
  };

  const clone = () => {
    return createEffectRegistry(new Map(effectMap));
  }

  return {
    registerEffect,
    teardownEffect,
    updateEffect,

    pending,

    effectMap,
    clone,
  };
}

export const createEffectService = (
  scheduler/*: Scheduler2*/
)/*: EffectService*/ => {
  const runEffectRegistry = (registry) => {
    for (const [id, runEffect] of registry.pending.registered) {
      performance.mark(`act:effects:${id}:start`)
      try {
        const cleanup = runEffect() || null;
        registry.effectMap.set(id, {
          id,
          runEffect,
          cleanup,
          priority: 'normal',
        });
      } catch {}
      performance.mark(`act:effects:${id}:end`)
      performance.measure(`act:effects:${id}`, `act:effects:${id}:start`, `act:effects:${id}:end`)
    }
    for (const [id, nextRunEffect] of registry.pending.updated) {
      performance.mark(`act:effects:${id}:start`)
      const prevRegisteredEffect = registry.effectMap.get(id);
      if (!prevRegisteredEffect)
        continue;
      if (prevRegisteredEffect.cleanup) {
        try {
          prevRegisteredEffect.cleanup();
        } catch {}
      }
      try {
        const nextCleanup = nextRunEffect() || null;
        prevRegisteredEffect.runEffect = nextRunEffect;
        prevRegisteredEffect.cleanup = nextCleanup || null;
      } catch {}
      performance.mark(`act:effects:${id}:end`)
      performance.measure(`act:effects:${id}`, `act:effects:${id}:start`, `act:effects:${id}:end`)
    }
    for (const [id] of registry.pending.removed) {
      const prevRegisteredEffect = registry.effectMap.get(id);
      if (!prevRegisteredEffect)
        continue;
      if (prevRegisteredEffect.cleanup) {
        try {
          prevRegisteredEffect.cleanup();
        } catch {}
      }
      registry.effectMap.delete(id);
    }
    return registry;
  };

  return { runEffectRegistry }
};