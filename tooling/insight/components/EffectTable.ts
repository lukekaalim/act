import { Component, h } from "@lukekaalim/act"
import { DeltaReport, EffectReport } from "@lukekaalim/act-debug"
import { DebugCache } from "@lukekaalim/act-debug/cache"
import { getTextForElementType } from "../utils"
import { InsightController, InsightState } from "../lib/controller"
import { CommitPreview } from "../TreeViewer"

export type EffectTableProps = {
  state: InsightState
  controller: InsightController,
}

export const EffectTable: Component<EffectTableProps> = ({ state, controller }) => {
  return [
    h('h4', {}, "Live Cleanups"),
    h('p', {}, 'Effects that have a yet-to-run cleanup task'),
    h('table', {}, [
      h('thead', {}, [
        h('tr', {}, [
          h('th', {}, 'CommitID'),
          h('th', {}, 'EffectID'),
          h('th', {}, 'Component'),
          h('th', {}, 'Function Name (if applicable)'),
        ])
      ]),
      h('tbody', {}, state.cleanups.map(cleanup => {
        const commit = state.client.cache.getCommit(cleanup.commit);
        if (!commit)
          return h('tr', { row: 4 }, `Error: Missing commit (${cleanup.commit}) in cache`);

        const onClick = () => {
          controller.select({ type: 'commit', id: commit.id });
        }

        return h('tr', {}, [
          h('td', {}, cleanup.commit),
          h('td', {}, cleanup.id),
          h('td', {}, h(CommitPreview, { commit, onClick })),
          h('td', {}, cleanup.functionName || 'Anonymous'),
        ])
      }))
    ]),
    h('hr'),
    h('h4', {}, "Pending Effects"),
    h('p', {}, 'Effects from the current thread'),
    h('table', {}, [
      h('thead', {}, [
        h('tr', {}, [
          h('th', {}, 'CommitID'),
          h('th', {}, 'EffectID'),
          h('th', {}, 'Component'),
          h('th', {}, 'Function Name (if applicable)'),
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

        return h('tr', {}, [
          h('td', {}, effect.commit),
          h('td', {}, effect.id),
          h('td', {}, h(CommitPreview, { commit, onClick })),
          h('td', {}, effect.functionName || 'Anonymous'),
          h('td', {}, (!effect.effect).toString()),
        ])
      }))
    ]),
  ];
}