import { Component, h, useState } from '@lukekaalim/act';
import classes from './index.module.css';
import { Breakpoints, DebugClient } from '@lukekaalim/act-debug';
import { CommitPreview } from '../TreeViewer';
import { useSelection } from '../lib/selection';
import { CommitInspector } from './CommitInspector';
import { InsightController, InsightState } from '../lib/controller';
import { ThreadInspector } from './ThreadInspector';
import { icons } from '../assets/icons';

export type InspectorPanelProps = {
  client: DebugClient,
  breakpoints: Breakpoints,

  state: InsightState,
  controller: InsightController,
}

export const InspectorPanel: Component<InspectorPanelProps> = ({ client, breakpoints, state, controller }) => {
  const { target } = useSelection();

  const commit = target.type === 'commit' && client.cache.getCommit(target.id)

  const [width, setWidth] = useState(300);
  const [dragging, setDragging] = useState(false);
  const onPointerDown = (event: PointerEvent) => {
    setDragging(true);
    (event.target as HTMLButtonElement).setPointerCapture(event.pointerId);
  }
  const onPointerMove = (event: PointerEvent) => {
    if (dragging) {
      setWidth(w => w - event.movementX)
      // do something about moving it
    }
  }
  const onPointerUp = (event: PointerEvent) => {
    setDragging(false);
    (event.target as HTMLButtonElement).releasePointerCapture(event.pointerId);
  }

  return h('div', { className: classes.panelContainer, style: { width: `${width}px` } }, [
    h('button', { classList: [classes.grabHandle, classes.left], onPointerDown, onPointerMove, onPointerUp }, h('img', { src: icons.vertical_grab_handle })),
    h('div', { className: classes.panel }, [
      commit && state.thread && h(ThreadInspector, { thread: state.thread, commit }),
      commit && h(CommitInspector, {
        commit,
        breakpoints,
        client,
        state,
        controller,
      })
    ])
  ]);
}