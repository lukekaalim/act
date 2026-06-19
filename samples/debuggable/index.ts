import { h, useEffect, useState } from '@lukekaalim/act';
import { DebugReconciler } from '@lukekaalim/act-debug';
import { createDebugPopup } from '@lukekaalim/act-insight';
import { render } from '@lukekaalim/act-web';

const App = () => {
  const [clicks, setClicks] = useState(0);
  const [sideEffect, setSideEffect] = useState(true);

  useEffect(function MyOneShotSideEffect() {
    if (clicks < 1)
      return;

    console.log('BOOM! one shot')
  }, [Math.floor(clicks / 10)])

  useEffect(function clock () {
    console.log(clicks % 2 === 0 ? `Tick` : `Tock`)
  }, [clicks])

  return h('div', {}, [
    h('h1', {}, 'Hello'),
    sideEffect && h(SideEffectComponent, { clicks }),
    h('p', { style: { display: 'flex', 'flex-direction': 'column' } }, [
      'world!',
      h('button', { onClick: () => setClicks(c => c + 1)}, 'Click me!'),
      h('strong', {}, `Clicked ${clicks} times`),
      h('label', {}, [
        h('div', {}, 'Toggle Side Effect'),
        h('input', { type: 'checkbox', checked: sideEffect, onInput: () => setSideEffect(!sideEffect) })
      ])
    ])
  ])
};

const SideEffectComponent = ({ clicks }: { clicks: number }) => {

  useEffect(function MyCoolAssSideEffect() {
    console.log("SIDE EFFECT");

    return function MyCoolAssCleanup() {
      console.log("SIDE EFFECT CLEANUP")
    }
  }, [Math.floor(clicks / 3)])

  return null;
}

const out = render(h('div', {}, h(App)), document.body, { Reconciler: DebugReconciler });

createDebugPopup(out.reconciler as DebugReconciler);
