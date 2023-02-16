// @flow strict
/*::
import type { Assertion } from "@lukekaalim/test/src/assert";
*/

import { h, useState, Boundary } from "@lukekaalim/act";
import { createTreeService2, createSchedule2, createEffectService } from "@lukekaalim/act-reconciler";
import { createBoundaryService } from "@lukekaalim/act-reconciler";
import { assert } from "@lukekaalim/test";

export const assertTree = ()/*: Assertion*/ => {

  return assert('nope', false)

  const callbacks = new Set()
  const scheduler = createSchedule2(c => (callbacks.add(c), () => void callbacks.delete(c)));
  const tree = createTreeService2(scheduler);

  const Component = ({ depth = 0 }) => {
    if (depth > 2)
      return h('end');
    return Array.from({ length: Math.floor(Math.random() * 5) + 1 })
      .map((_, i) => h(Component, { depth: depth + 1 }))
  }

  const BadBoy = () => {
    throw 'Yeaaa!'
  }

  const App = () => {
    const [error, setError] = useState(null)
    console.log('App Renderer', error)
    
    return h(Boundary, { key: 'outer', handleBoundaryValue: (e) => (setError(e[0]), []) }, [
      !error && h(BadBoy),
      h(Boundary, { key: 'inner', handleBoundaryValue: (e) => (console.log('inner', e), e) }, [
        !error && h('act:suspend', { value: 'Hello!' }),
        !error && h(BadBoy)
      ]),
      !error && h('error', { error })
    ])
  }

  tree.mount(h(App));
  const suspension = createBoundaryService();

  tree.diff.subscribeDiff(diff => {
    console.log('RUNNING SUSPENSIONS', diff.suspensions)
    const rootSuspension = suspension.getBoundaryValue(diff.suspensions, diff.root, diff.nexts);
    console.log(rootSuspension)
    if (rootSuspension.length > 0) {
      for (const suspension of rootSuspension)
        console.error(suspension);
      debugger;
      tree.unmount();
    }
  })
  console.log('RUNNING COMPONENT')
  scheduler.run(-1);
  
  return assert('true', true);
};