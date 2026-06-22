import { Component, h, useState } from "@lukekaalim/act";
import { Breakpoints, DebugCache, toggleEffectBreakpoint } from "@lukekaalim/act-debug";

import classes from './index.module.css';
import { CommitPreview } from "../TreeViewer";
import { EffectButton, HookButton, IconButton } from "./Button";
import { InsightController, InsightState } from "../lib/controller";
import { icons } from "../assets/icons";
import { BreakpointToggle } from "./BreakpointToggle";

export type BreakpointPanelProps = {
  state: InsightState,
  controller: InsightController,
  cache: DebugCache,

  breakpoints: Readonly<Breakpoints>,

  onBreakpointsChange(breakpoints: Breakpoints): void,
  onStepPressed(): void,
  onResumePressed(): void,
}

export const BreakpointPanel: Component<BreakpointPanelProps> = ({ breakpoints, state, onBreakpointsChange, cache, controller }) => {
  type Toggles = "threadStart" | "threadPass" | "effectsStart" | "threadSubmit" | 'effectsEnd'

  const setBreakpointToggle = (toggle: Toggles) => (event: InputEvent) => {
    const input = event.target as HTMLInputElement;
    const nextBreakpoints: Breakpoints = { ...breakpoints, [toggle]: input.checked }
    onBreakpointsChange(nextBreakpoints);
  }

  const commitBreakpoints = [...breakpoints.commits.values()];
  const effectBreakpoints = [...breakpoints.effects.values()];

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
  // 'before-first-commit' | 'before-pass' | 'before-submit' | 'before-first-effect' | 'before-last-effect' 

  const start = state.thread && state.paused && !state.thread.started;
  const submit = state.thread && state.paused && !state.thread.submitted && state.thread.pendingTasks.length === 0 && state.thread.missed.length === 0;
  const pass = state.thread && state.paused && !state.thread.submitted && state.thread.pendingTasks.length === 0 && state.thread.missed.length !== 0;

  return h('div', { className: classes.panelContainer, style: { width: `${width}px` } }, [
    h('button', { classList: [classes.grabHandle, classes.right], onPointerDown, onPointerMove, onPointerUp }, h('img', { src: icons.vertical_grab_handle })),
    h('div', { classList: [classes.panel] }, [
      h('h4', {}, 'Breakpoint Controls'),
      h('div', { className: classes.namedBreakpointList }, [
        h('label', { className: start ? classes.hit : '' }, [
          h('input', { type: 'checkbox', checked: breakpoints.threadStart, onInput: setBreakpointToggle('threadStart') }),
          h('span', {}, 'Before First Commit'),
        ]),
        h('label', { className: pass ? classes.hit : '' }, [
          h('input', { type: 'checkbox', checked: breakpoints.threadPass, onInput: setBreakpointToggle('threadPass') }),
          h('span', {}, 'On Before New Thread Pass'),
        ]),
        h('label', { className: submit ? classes.hit : '' }, [
          h('input', { type: 'checkbox', checked: breakpoints.threadSubmit, onInput: setBreakpointToggle('threadSubmit') }),
          h('span', {}, 'On Submit to Renderer'),
        ]),
        h('label', {}, [
          h('input', { type: 'checkbox', checked: breakpoints.effectsStart, onInput: setBreakpointToggle('effectsStart') }),
          h('span', {}, 'On First Effect'),
        ]),
        h('label', {}, [
          h('input', { type: 'checkbox', checked: breakpoints.effectsEnd, onInput: setBreakpointToggle('effectsEnd') }),
          h('span', {}, 'On Last Effect'),
        ]),
      ]),
      commitBreakpoints.length > 0 && [
        h('h4', {}, 'Commits Breakpoints'),
        h('ul', { className: classes.commitList }, commitBreakpoints.map(commitId => {
          const commit = cache.getCommit(commitId);
          if (!commit)
            return null;
          return h('li', {}, [
            h(IconButton, { icon: 'breakpoint', title: 'Clear Breakpoint', onClick() {}, className: classes.commitRowBreakpointToggle }),
            h(CommitPreview, { commit, onClick: () => {
              controller.select({ type: 'commit', id: commitId })
            } })
          ])
        }))
      ],
      effectBreakpoints.length > 0 && [
        h('h4', {}, 'Effect Breakpoints'),
        h('ul', { className: classes.effectList }, effectBreakpoints.map(effectId => {
          return h('li', {}, [
            h(BreakpointToggle, { toggled: true, onToggle(toggled) {
              onBreakpointsChange(toggleEffectBreakpoint(breakpoints, effectId))
            }, }),
            h(EffectButton, { onClick() {}, effectId }),
          ])
        }))
      ],
    ])
  ]);
}