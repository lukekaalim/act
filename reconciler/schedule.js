// @flow strict
/*:: import type { CommitID, CommitRef } from './commit2.js'; */

/*::
export type EffectID = string;
export type EffectPriority =
  | 'sync'
  | 'render'
  | 'idle'
export type Effect = {
  id: EffectID,
  priority: EffectPriority,
  run: () => void,
};

export type ScheduleFunction<TCancelToken> = (callback: () => mixed) => TCancelToken;
export type CancelFunction<TCancelToken> = (token: TCancelToken) => mixed;

export type Scheduler = {
  scheduleEffect: (effect: Effect) => void,
  scheduleChange: (ref: CommitRef) => void,
  flushSync: () => void,
  scheduleFlush: () => void,
};
*/

export const createScheduler = /*:: <T>*/(
  render/*: (targets: CommitRef[]) => void*/,
  schedule/*: ScheduleFunction<T>*/,
  cancel/*: CancelFunction<T>*/,
)/*: Scheduler*/ => {
  let token = null;

  const pendingChanges = new Map();
  const pendingEffects = new Map();

  const scheduleChange = (ref) => {
    pendingChanges.set(ref.id, ref);
  };
  const scheduleEffect = (effect) => {
    pendingEffects.set(effect.id, effect);
  };

  const scheduleFlush = () => {
    if (token === null) {
      token = schedule(flushSync);
    }
  }

  const flushSync = () => {
    if (token)
      cancel(token);
    token = null;
    
    const changes = [...pendingChanges.values()];
    pendingChanges.clear();
    render(changes);

    const effects = [...pendingEffects.values()];
    pendingEffects.clear();
    for (const effect of effects)
      effect.run();
  };

  return {
    scheduleChange,
    scheduleEffect,
    scheduleFlush,
    flushSync,
  };
};