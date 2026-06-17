import { Component, h, useState } from "@lukekaalim/act";
import { Breakpoints, DebugCache } from "@lukekaalim/act-debug";

import classes from './index.module.css';
import { CommitPreview } from "../TreeViewer";
import { IconButton } from "./Button";
import { InsightController } from "../lib/controller";
import { icons } from "../assets/icons";

export type BreakpointPanelProps = {
  controller: InsightController,
  cache: DebugCache,

  breakpoints: Readonly<Breakpoints>,
  paused: boolean,

  onBreakpointsChange(breakpoints: Breakpoints): void,
  onStepPressed(): void,
  onResumePressed(): void,
}

export const BreakpointPanel: Component<BreakpointPanelProps> = ({ breakpoints, paused, onBreakpointsChange, cache, controller }) => {
  type Toggles = "threadStart" | "threadPass" | "effectsStart" | "threadSubmit"

  const setBreakpointToggle = (toggle: Toggles) => (event: InputEvent) => {
    const input = event.target as HTMLInputElement;
    const nextBreakpoints: Breakpoints = { ...breakpoints, [toggle]: input.checked }
    onBreakpointsChange(nextBreakpoints);
  }

  const commitBreakpoints = [...breakpoints.commits.values()];

  const [width, setWidth] = useState(300);
  const [dragging, setDragging] = useState(false);
  const onPointerDown = (event: PointerEvent) => {
    setDragging(true);
    (event.target as HTMLButtonElement).setPointerCapture(event.pointerId);
  }
  const onPointerMove = (event: PointerEvent) => {
    if (dragging) {
      setWidth(w => w + event.movementX)
      // do something about moving it
    }
  }
  const onPointerUp = (event: PointerEvent) => {
    setDragging(false);
    (event.target as HTMLButtonElement).releasePointerCapture(event.pointerId);
  }

  return h('div', { className: classes.panelContainer, style: { width: `${width}px` } }, [
    h('button', { classList: [classes.grabHandle, classes.right], onPointerDown, onPointerMove, onPointerUp }, h('img', { src: icons.vertical_grab_handle })),
    h('div', { classList: [classes.panel] }, [
      h('h4', {}, 'Breakpoint Controls'),
      h('div', { className: classes.namedBreakpointList }, [
        h('label', {}, [
          h('input', { type: 'checkbox', checked: breakpoints.threadStart, onInput: setBreakpointToggle('threadStart') }),
          h('span', {}, 'Before Thread'),
        ]),
        h('label', {}, [
          h('input', { type: 'checkbox', checked: breakpoints.threadPass, onInput: setBreakpointToggle('threadPass') }),
          h('span', {}, 'On Pass'),
        ]),
        h('label', {}, [
          h('input', { type: 'checkbox', checked: breakpoints.effectsStart, onInput: setBreakpointToggle('effectsStart') }),
          h('span', {}, 'On Effects'),
        ]),
        h('label', {}, [
          h('input', { type: 'checkbox', checked: breakpoints.threadSubmit, onInput: setBreakpointToggle('threadSubmit') }),
          h('span', {}, 'After Thread'),
        ]),
      ]),
      commitBreakpoints.length > 0 && [
        h('h4', {}, 'Collapsed Commits'),
        h('ul', { className: classes.commitList }, commitBreakpoints.map(commitId => {
          const commit = cache.getCommit(commitId);
          if (!commit)
            return null;
          return h('li', {}, [h(IconButton, { icon: 'breakpoint', title: 'Clear Breakpoint', onClick() {}, className: classes.commitRowBreakpointToggle }), h(CommitPreview, { commit, onClick: () => {
            controller.select({ type: 'commit', id: commitId })
          } })])
        }))
      ],
      h('h4', {}, 'Effect Breakpoints'),
    ])
  ]);
}