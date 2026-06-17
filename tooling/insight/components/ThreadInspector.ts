import { Component, h } from "@lukekaalim/act"
import { CommitReport, ThreadReport } from "@lukekaalim/act-debug"

import classes from './index.module.css';

export type ThreadInspectorProps = {
  thread: ThreadReport,
  commit: CommitReport,
}

export const ThreadInspector: Component<ThreadInspectorProps> = ({ thread, commit }) => {
  const task = thread.pendingTasks.find(t => t.id === commit.id)

  return h('div', { className: classes.threadInspector }, [
    h('div', {}, `Thread#${thread.id}`),
    !!task && h('div', {}, `Schedule for work.`),
    thread.visited.includes(commit.id) && h('div', {}, `Was visited in this Pass`),
    thread.mustRender.includes(commit.id) && h('div', {}, `Is a Render Target`),
    thread.mustVisit.includes(commit.id) && h('div', {}, `Is a Visit Target`),
    thread.missed.includes(commit.id) && h('div', {}, `Is missed on the current Pass`),
  ])
}