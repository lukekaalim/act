import { Component, h } from "@lukekaalim/act";
import { Breakpoints, DebugCache } from "@lukekaalim/act-debug";

import classes from './index.module.css';
import { CommitPreview } from "../TreeViewer";
import { IconButton } from "./Button";
import { InsightController } from "../lib/controller";

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

  return h('div', { classList: [classes.panel] }, [
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
}