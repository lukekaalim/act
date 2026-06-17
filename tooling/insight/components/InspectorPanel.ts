import { Component, h } from '@lukekaalim/act';
import classes from './index.module.css';
import { Breakpoints, DebugClient } from '@lukekaalim/act-debug';
import { CommitPreview } from '../TreeViewer';
import { useSelection } from '../lib/selection';
import { CommitInspector } from './CommitInspector';
import { InsightController, InsightState } from '../lib/controller';
import { ThreadInspector } from './ThreadInspector';

export type InspectorPanelProps = {
  client: DebugClient,
  breakpoints: Breakpoints,

  state: InsightState,
  controller: InsightController,
}

export const InspectorPanel: Component<InspectorPanelProps> = ({ client, breakpoints, state, controller }) => {
  const { target } = useSelection();

  const commit = target.type === 'commit' && client.cache.getCommit(target.id)

  return h('div', { className: classes.panel }, [
    commit && state.thread && h(ThreadInspector, { thread: state.thread, commit }),
    commit && h(CommitInspector, {
      commit,
      breakpoints,
      client,
      state,
      controller,
    })
  ]);
}