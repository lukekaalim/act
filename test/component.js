// @flow strict
/*:: import type { Assertion } from '@lukekaalim/test'; */

import { assert, assertStruct } from "@lukekaalim/test";

import { createComponentService  } from "@lukekaalim/act-reconciler/component.js";
import { h, useEffect, useState } from "@lukekaalim/act";

export const testComponentService = ()/*: Assertion*/ => {

  const createMockScheduler = () => {
    const effects = new Map();
    const changes = new Map();
    const scheduleEffect = e => void effects.set(e.id, e);
    const run = () => {
      const executedEffects = [...effects];
      const executedChanges = [...changes];
      for (const [i, e] of [...effects])
        e.run();
      effects.clear();
      changes.clear();
      return { executedEffects, executedChanges };
    }
    const flushSync = () => void run();
    const scheduleChange = c => void changes.set(c.id, c)
    return {
      run,
      effects,
      changes,
      flushSync,
      scheduleEffect,
      scheduleChange,
    };
  };

  const createMockComponent = () => {
    const scheduler = createMockScheduler();
    const component = createComponentService(scheduler);
    return {
      scheduler,
      component,
    };
  };

  const testComponentValues = () => {
    const { scheduler, component } = createMockComponent();

    const Incrementor = () => {
      const [value, setValue] = useState/*:: <number>*/(0);
      return h('test', { increment: (valueToAdd) => setValue(v => v + valueToAdd), value });
    };
    const element = h(Incrementor);
    const ref = { id: 'A', path: [] };
    const branch = { path: [], context: new Map() };

    const createChange = { prev: null, element };
    const createResult = component.traverse(ref, createChange, branch);

    const initialValue = (createResult.children[0].props.value/*: any*/);
    const increment = (createResult.children[0].props.increment/*: any*/);
    
    for (const i of [10, 30])
      increment(i)
  
    const prev = { ...ref, children: [], element, pruned: false, version: '0' };
    const updateChange = { prev, ref };
    const updateResult = component.traverse(ref, updateChange, branch);
    const updatedValue = (updateResult.children[0].props.value/*: any*/);

    const { executedChanges: [[_, scheduledRef]] } = scheduler.run();

    return assert('Value changes as component calls setValue', [
      assertStruct({ initialValue, '0': 0 }),
      assertStruct({ updatedValue, '40': 40 }),
      assert('Extra render calls', [
        assert('scheduled the current ref', [
          assertStruct({ scheduledRef, ref })
        ]),
      ]),
    ]);
  };

  const testComponentEffects = () => {
    const { scheduler, component } = createMockComponent();

    const subscription = {
      added: new Set(),
      removed: new Set(),
    };

    const Subscriber = ({ id }) => {
      useEffect(() => {
        subscription.added.add(id);
        return () => subscription.removed.add(id);
      }, [id])
      return null;
    };

    const element = h(Subscriber, { id: 100 });
    const ref = { id: 'A', path: [] };
    const branch = { path: [], context: new Map() };
    const prev = { ...ref, children: [], element, pruned: false, version: '0' };

    const createChange = { prev, ref };
    component.traverse(ref, createChange, branch);
    scheduler.run();

    component.traverse(ref, { prev: { ...prev, element: h(Subscriber, { id: 150 }) }, ref }, branch);
    component.traverse(ref, { prev: { ...prev, element: h(Subscriber, { id: 200 }) }, ref }, branch);

    scheduler.run();

    return assert('testComponentEffects', [
      assertStruct({ added: [...subscription.added], expected: [100, 200] }),
      assertStruct({ removed: [...subscription.removed], expected: [100] }),
    ]);
  };

  return assert('testComponentService', [
    testComponentValues(),
    testComponentEffects(),
  ]);
};

