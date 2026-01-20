import { Component, h, useEffect, useState } from '@lukekaalim/act';
import { ReconcilerDebugController, ReconcilerDebugEventBus, ScheduleController, ScheduleEventBus } from '@lukekaalim/act-debug';

export type ScheduleControlsProps = {
  controller: ScheduleController,
  bus: ScheduleEventBus,

  reconciler: ReconcilerDebugController,

  onPauseChange?: (paused: boolean) => void,
};

export const ScheduleControls: Component<ScheduleControlsProps> = ({ controller, bus, onPauseChange, reconciler }) => {
  const [intercept, setIntercept] = useState(false);
  const [paused, setPaused] = useState(false);

  const [breakOnUpdate, setBreakOnUpdate] = useState(false);

  useEffect(() => {
    bus.onInterceptStart = () => {
      setPaused(true);
      //onPauseChange(false)
    }
    bus.onInterceptEnd = () => {
      setPaused(false);
      //onPauseChange(false)
    }
    bus.onAfterCallbackExecute = () => {
      reconciler.getThread();
    }
  }, [bus, reconciler])

  useEffect(() => {
    controller.intercept = breakOnUpdate;
    if (!breakOnUpdate) {
      setPaused(false);
      //onPauseChange(false)
    }

  }, [controller, breakOnUpdate])

  const onStepClick = () => {
    controller.step();
  }
  const onResumeClick = () => {
    controller.cancelIntercept();
  }
  const onChangeBreakOnUpdate = (event: Event) => {
    setBreakOnUpdate((event.target as HTMLInputElement).checked)
  }

  return h('div', { style: { background: paused ? 'red' : 'white', padding: '8px', display: 'flex', gap: '12px' }}, [
    h('label', { style: { 'margin': 'auto 0' } }, [
      h('span', {}, `Break on Update`),
      h('input', { type: 'checkbox', checked: breakOnUpdate, onChange: onChangeBreakOnUpdate }),
    ]),
    h('button', { onClick: onStepClick, disabled: !paused, style: { padding: '8px' } }, 'Step'),
    h('button', { onClick: onResumeClick, disabled: !paused, style: { padding: '8px' } }, 'Resume'),
    h('span', {
      style: { border: `2px solid ${paused ? 'orange' : 'black'}`, 'border-radius': '8px', padding: '8px' }
    }, paused ? `Paused` : `Ready`),
  ])
};