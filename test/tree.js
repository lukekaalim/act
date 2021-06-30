// @flow strict
/*:: import type { Assertion } from '@lukekaalim/test'; */
import { assert } from '@lukekaalim/test';

import { createTree } from '@lukekaalim/act-reconciler';
import { createContext, h, useContext, useEffect, useState } from '@lukekaalim/act';

export const testTree = ()/*: Assertion*/ => {
  const createMockScheduleFunction = () => {
    let work = [];
    const scheduleWork = (c) => void work.push(c);
    const run = () => {
      const currentWork = [...work];
      work = [];
      for (const workload of currentWork)
        workload();
    }
    return {
      scheduleWork,
      run,
    }
  }
  const test = () => {
    const { run, scheduleWork } = createMockScheduleFunction();
    const greetingContext = createContext('welcome');
    const Greeter = () => {
      const greeting = useContext(greetingContext);
      return greeting;
    }
    let updateTarget = null;
    const RootComponent = () => {
      const [target, setTarget] = useState('world');
      useEffect(() => {
        updateTarget = () => setTarget('friends');
      }, []);
      return h(greetingContext.Provider, { value: 'hello' }, [
        h(Greeter),
        target
      ]);
    };
    const textRenderer = (c) => [
      c.element.props.content,
      ...c.children.map(c => textRenderer(c)),
    ].filter(Boolean).join(' ')
    let output = '';

    createTree(h(RootComponent), { onDiff: d => output = textRenderer(d.next), scheduleWork });

    const originalOutput = output;
    updateTarget && updateTarget();
    run();
    const updatedOutput = output;
    return assert('Components with effects, state and context', [
      assert('renders with output', originalOutput === 'hello world'),
      assert('updates cause renders with new output', updatedOutput === 'hello friends'),
    ]);
  };

  return assert('Tree', [test()]);
};
