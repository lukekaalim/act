// @flow strict
/*:: import type { Assertion } from '@lukekaalim/test'; */
import { assert, assertStruct } from '@lukekaalim/test';

import { createScheduler } from '@lukekaalim/act-reconciler/schedule.js';
import { createElement } from '@lukekaalim/act';

export const testSchedule = ()/*: Assertion*/ => {
  const createMockTimeout = () => {
    let pendingTimeouts = [];
    const setTimeout = (callback, interval) => pendingTimeouts.push({ callback, interval });
    const run = () => {
      for (const timeout of pendingTimeouts)
        timeout.callback();
      pendingTimeouts = [];
    }
    return { setTimeout, run };
  };

  const testRenderOrder = () => {
    const effects = [];
    const renderA = () => {
      const run = () => {
        effects.push('A')
      };
      scheduler.scheduleEffect({ id: 'A', run, priority: 'sync' })
    };
    const timeout = createMockTimeout();

    const scheduler = createScheduler(renderA, timeout.setTimeout);
    scheduler.scheduleChange({ id: 'A', path: [] });

    timeout.run();

    return assert('performs renders in order, executing effects from render afterward', [
      assertStruct({ effects, expected: ['A'] })
    ]);
  };

  return assert('Scheduler', [
    testRenderOrder(),
  ]);
};