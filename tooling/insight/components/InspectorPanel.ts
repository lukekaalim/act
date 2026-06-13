import { Component, h } from '@lukekaalim/act';
import classes from './index.module.css';
import { Breakpoints, DebugClient } from '@lukekaalim/act-debug';
import { CommitPreview } from '../TreeViewer';
import { useSelection } from '../lib/selection';

export type InspectorPanelProps = {
  client: DebugClient,
  breakpoints: Breakpoints
}

export const InspectorPanel: Component<InspectorPanelProps> = ({ client, breakpoints }) => {
  const { target } = useSelection();

  return h('div', { className: classes.panel }, [
    h('h4', {}, 'Inspector'),
    target.type === 'commit' && [
      h(CommitPreview, { commit: client.cache.getCommitOrThrow(target.id) }),
      h('button', {
        onClick() {
          const newBreakpoints = { ...client.breakpoints };
          newBreakpoints.commits = new Set(client.breakpoints.commits)
          if (breakpoints.commits.has(target.id)) {
            newBreakpoints.commits.delete(target.id)
          } else {
            newBreakpoints.commits.add(target.id)
          }
          client.setBreakpoints(newBreakpoints)
        }
      }, breakpoints.commits.has(target.id) ? 'Remove Breakpoint' : 'Add Breakpoint')
    ],

  ]);
}