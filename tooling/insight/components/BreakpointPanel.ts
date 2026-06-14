import { Component, h } from "@lukekaalim/act";
import { Breakpoints, DebugCache } from "@lukekaalim/act-debug";

import classes from './index.module.css';
import { CommitPreview } from "../TreeViewer";

export type BreakpointPanelProps = {
  cache: DebugCache,

  breakpoints: Readonly<Breakpoints>,
  paused: boolean,

  onBreakpointsChange(breakpoints: Breakpoints): void,
  onStepPressed(): void,
  onResumePressed(): void,
}

export const BreakpointPanel: Component<BreakpointPanelProps> = ({ breakpoints, paused, onBreakpointsChange, cache }) => {
  type Toggles = "threadStart" | "threadPass" | "effectsStart" | "threadSubmit"

  const setBreakpointToggle = (toggle: Toggles) => (event: InputEvent) => {
    const input = event.target as HTMLInputElement;
    const nextBreakpoints: Breakpoints = { ...breakpoints, [toggle]: input.checked }
    onBreakpointsChange(nextBreakpoints);
  }

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
    h('h4', {}, 'Commit Breakpoints'),
    h('ul', { className: classes.breakpointCommitList }, [...breakpoints.commits.values()].map((id) => {
      const commit = cache.getCommit(id);
      if (!commit)
        return null;
      return h('li', {}, h(CommitPreview, { commit }))
    })),
    h('h4', {}, 'Effect Breakpoints'),
  ])
}