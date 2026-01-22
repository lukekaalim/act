import { Component, h, useEffect, useState } from '@lukekaalim/act';
import { ReconcilerDebugController, ReconcilerDebugEventBus, ScheduleController, ScheduleEventBus } from '@lukekaalim/act-debug';
import { InsightAppState } from './InsightApp';

export type ScheduleControlsProps = {
  controller: ScheduleController,
  bus: ScheduleEventBus,

  reconciler: ReconcilerDebugController,

  state: InsightAppState,
  onStateChange?: (newState: InsightAppState) => void,
};

export const ScheduleControls: Component<ScheduleControlsProps> = ({ controller, bus, reconciler, state, onStateChange = () => {} }) => {
  useEffect(() => {
    bus.onInterceptStart = () => {
      onStateChange({ ...state, paused: true });
      //onPauseChange(false)
    }
    bus.onInterceptEnd = () => {
      onStateChange({ ...state, paused: false });
      //onPauseChange(false)
    }
    bus.onAfterCallbackExecute = () => {
      //reconciler.getThread();
    }
  }, [bus, reconciler, state])


  const onStepClick = () => {
    controller.step();
  }
  const onResumeClick = () => {
    controller.cancelIntercept();
  }
  const onChangeBreakBeforeUpdate = (event: Event) => {
    onStateChange({ ...state, breakOnBeforeUpdate: (event.target as HTMLInputElement).checked });
  }
  const onChangeBreakAfterUpdate = (event: Event) => {
    onStateChange({ ...state, breakOnAfterUpdate: (event.target as HTMLInputElement).checked });
  }

  return h('div', { style: { background: state.paused ? 'red' : 'white', padding: '8px', display: 'flex', gap: '12px' }}, [
    h('div', { style: { display: 'flex', 'flex-direction': 'column' } }, [
      h('label', { style: { 'margin': 'auto 0' } }, [
        h('span', {}, `Break Before Update`),
        h('input', { type: 'checkbox', checked: state.breakOnBeforeUpdate, onChange: onChangeBreakBeforeUpdate }),
      ]),
      h('label', { style: { 'margin': 'auto 0' } }, [
        h('span', {}, `Break After Update`),
        h('input', { type: 'checkbox', checked: state.breakOnAfterUpdate, onChange: onChangeBreakAfterUpdate }),
      ]),
    ]),
    h('button', { onClick: onStepClick, disabled: !state.paused, style: { padding: '8px' } }, 'Step'),
    h('button', { onClick: onResumeClick, disabled: !state.paused, style: { padding: '8px' } }, 'Resume'),
    h('span', {
      style: { border: `2px solid ${state.paused ? 'orange' : 'black'}`, 'border-radius': '8px', padding: '8px' }
    }, state.paused ? `Paused` : `Ready`),
  ])
};