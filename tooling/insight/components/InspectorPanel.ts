import { Component, h } from '@lukekaalim/act';
import classes from './index.module.css';
import { Breakpoints, DebugClient } from '@lukekaalim/act-debug';
import { CommitPreview } from '../TreeViewer';
import { useSelection } from '../lib/selection';
import { CommitInspector } from './CommitInspector';
import { InsightController, InsightState } from '../lib/controller';

export type InspectorPanelProps = {
  client: DebugClient,
  breakpoints: Breakpoints,

  state: InsightState,
  controller: InsightController,
}

export const InspectorPanel: Component<InspectorPanelProps> = ({ client, breakpoints, state, controller }) => {
  const { target } = useSelection();

  return h('div', { className: classes.panel }, [
    h('h4', {}, 'Thread'),
    target.type === 'commit' && h(CommitInspector, {
      commit: client.cache.getCommitOrThrow(target.id),
      breakpoints,
      client,
      state,
      controller,
    })
  ]);
}