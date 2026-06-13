import { Component, h } from "@lukekaalim/act"
import { DeltaReport, EffectReport } from "@lukekaalim/act-debug"
import { DebugCache } from "@lukekaalim/act-debug/cache"

export type EffectTableProps = {
  effects: EffectReport[],

  cache: DebugCache,
}

export const EffectTable: Component<EffectTableProps> = ({ effects, cache }) => {
  return h('table', {}, [
    h('thead', {}, [
      h('tr', {}, [
        h('th', {}, 'CommitID'),
        h('th', {}, 'EffectID'),
        h('th', {}, 'Component'),
        h('th', {}, 'Function Name (if applicable)'),
        h('th', {}, 'State'),
      ])
    ]),
    h('tbody', {}, effects.map(effect => {
      const commit = cache.getCommit(effect.commit);
      if (!commit)
        return h('tr', { row: 4 }, `Error: Missing commit (${effect.commit}) in cache`);

      return h('tr', {}, [
        h('td', {}, effect.commit),
        h('td', {}, effect.id),
        h('td', {}, commit.element.type),
        h('td', {}, effect.functionName),
        h('td', {}, effect.state),
      ])
    }))
  ])
}