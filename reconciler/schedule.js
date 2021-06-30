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

export type ScheduleFunction = (callback: () => mixed) => mixed

export type Scheduler = {
  scheduleEffect: (effect: Effect) => void,
  scheduleChange: (ref: CommitRef) => void,
  flushSync: () => void,
};
*/

export const createScheduler = (
  render/*: CommitRef => void*/,
  schedule/*: ScheduleFunction*/
)/*: Scheduler*/ => {
  let state/*: 'idle' | 'working' | 'pending'*/ = 'idle';

  const pendingChanges = new Map();
  const scheduleChange = (ref) => {
    pendingChanges.set(ref.id, ref);
    if (state === 'pending')
      return;
    schedule(flushSync);
    if (state === 'idle')
      state = 'pending';
  };
  const pendingEffects = new Map();
  const scheduleEffect = (effect) => {
    pendingEffects.set(effect.id, effect);
    if (state === 'idle') {
      state = 'pending';
      schedule(flushSync);
    }
  };

  const flushSync = () => {
    state = 'working';
    
    const changes = [...pendingChanges];
    pendingChanges.clear();
    for (const [id, ref] of changes)
      render(ref)
      
    const effects = [...pendingEffects];
    pendingEffects.clear();
    for (const [id, effect] of effects)
      effect.run();
    state = 'idle';
  };

  return {
    scheduleChange,
    scheduleEffect,
    flushSync,
  };
};