import { Component, h } from "@lukekaalim/act"
import { InsightController, InsightState } from "../lib/controller"
import { CommitPreview } from "../TreeViewer"
import { BreakpointToggle } from "./BreakpointToggle"
import { toggleCommitBreakpoint, toggleEffectBreakpoint } from "@lukekaalim/act-debug"

import classes from './index.module.css';
import { CommitButton, EffectButton, HookButton } from "./Button"

export type EffectTableProps = {
  state: InsightState
  controller: InsightController,
}

export const EffectTable: Component<EffectTableProps> = ({ state, controller }) => {
  return [
    h('h4', { className: classes.effectCleanupHeading }, "Live Cleanups"),
    h('table', { className: classes.effectCleanupTable }, [
      h('thead', {}, [
        h('tr', {}, [
          h('th', {}, ''),
          h('th', {}, 'EffectID'),
          h('th', {}, 'Component'),
          h('th', {}, 'Hook'),
          h('th', {}, 'Name'),
        ])
      ]),
      h('tbody', {}, state.cleanups.map(cleanup => {
        const commit = state.client.cache.getCommit(cleanup.commit);
        if (!commit)
          return h('tr', { row: 4 }, `Error: Missing commit (${cleanup.commit}) in cache`);

        const details = state.client.getDetails(commit.id);
        const hookIndex = details && details.component && details.component.effects.findIndex(e => e.effect === cleanup.id);

        const onClick = () => {
          controller.select({ type: 'commit', id: commit.id });
        }

        return h('tr', {}, [
          h('td', {}, [
            h(BreakpointToggle, { toggled: state.breakpoints.effects.has(cleanup.id), onToggle() {
              state.client.setBreakpoints(toggleEffectBreakpoint(state.breakpoints, cleanup.id))
            }, }),
          ]),
          h('td', {}, [
            h('div', {}, [
              h(EffectButton, { onClick() {}, effectId: cleanup.id })
            ])
          ]),
          h('td', {}, h(CommitButton, { commitId: commit.id, onClick })),
          h('td', {}, (hookIndex !== null) && h(HookButton, { onClick() {}, hookIndex })),
          h('td', {}, cleanup.functionName || 'Anonymous'),
        ])
      }))
    ]),
    h('div', { style: { height: '24px' } }, ''),
    state.effects.length > 0 && [
      h('h4', { className: classes.effectCleanupHeading }, "Pending Effects"),
      h('table', { className: classes.effectCleanupTable }, [
        h('thead', {}, [
          h('tr', {}, [
            h('th', {}, 'EffectID'),
            h('th', {}, 'Cleanup'),
            h('th', {}, 'Run'),
            h('th', {}, 'Component'),
            h('th', {}, 'Name'),
            h('th', {}, 'Teardown?'),
          ])
        ]),
        h('tbody', {}, state.effects.map(effect => {
          const commit = state.client.cache.getCommit(effect.commit);
          if (!commit)
            return h('tr', { row: 4 }, `Error: Missing commit (${effect.commit}) in cache`);

          if (!effect.effect) {
            // lets see if we can find the original cleanup task
            const cleanup = state.cleanups.find(c => c.id === effect.id)
            if (cleanup)
              effect.functionName = cleanup.functionName;
          }
          const onClick = () => {
            controller.select({ type: 'commit', id: commit.id });
          }

          if (state.thread) {
          }

          const renderCleanupAndRun = () => {
            if (!state.thread) {
              return [
                h('td'),
                h('td'),
              ]
            }
            const { tasks, taskIndex } = state.thread.effects;
            const cleanupIndex = tasks.findIndex(e => e.type === 'cleanup' && e.id === effect.id)
            const runIndex = tasks.findIndex(e => e.type === 'constructor' && e.id === effect.id)

            return [
              h('td', { style: { background: taskIndex === cleanupIndex ? '#ce4545' : '' } },
                cleanupIndex !== -1 && h('input', { type: 'checkbox', checked: taskIndex > cleanupIndex, disabled: true })),
              h('td', { style: { background: taskIndex === runIndex ? '#ce4545' : '' } },
                runIndex !== -1 && h('input', { type: 'checkbox', checked: taskIndex > runIndex, disabled: true })),
            ]
          }

          return h('tr', {}, [
            h('td', {}, h(EffectButton, { effectId: effect.id, onClick() {} })),
            renderCleanupAndRun(),
            h('td', {}, h(CommitButton, { onClick() {}, commitId: commit.id })),
            h('td', {}, effect.functionName || 'Anonymous'),
            h('td', {}, (!effect.effect).toString()),
          ])
        }))
      ]),
    ]
  ];
}