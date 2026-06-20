import { CommitID, EffectID, WorkThread2 } from "@lukekaalim/act-recon"
import { DebugThread } from "./thread";

export type Breakpoints = {
  /**
   * Break when the first change is requested for a thread.
   */
  threadStart: boolean,
  /**
   * Break when a thread starts a second (or more)
   * pass. The first pass is captured by "threadStart"
   */
  threadPass: boolean,

  /**
   * Break before the thread is submitted to the renderer
   */
  threadSubmit: boolean,

  /**
   * Break right before we process the first side effect (includes cleanups)
   */
  effectsStart: boolean,

  /**
   * Break right before we process the last side effect (includes cleanups)
   */
  effectsEnd: boolean,

  /**
   * Break when this commit is the subject of the thread.
   */
  commits: Set<CommitID>,
  /**
   * Break when this effect runs or is cleaned up
   */
  effects: Set<EffectID>,
}

export const DEFAULT_BREAKPOINTS: Breakpoints = {
  threadStart: false,
  threadPass: false,
  threadSubmit: false,
  effectsStart: false,
  effectsEnd: false,

  commits: new Set(),
  effects: new Set(),
}

export const toggleCommitBreakpoint = (breakpoints: Breakpoints, commitId: CommitID): Breakpoints => {
  const nextBreakpoints = { ...breakpoints, commits: new Set(breakpoints.commits) };
  if (nextBreakpoints.commits.has(commitId)) {
    nextBreakpoints.commits.delete(commitId)
  } else {
    nextBreakpoints.commits.add(commitId)
  }
  return nextBreakpoints;
}

export type BreakPosition =
  | { type: 'named', name: 'before-first-commit' | 'before-pass' | 'before-submit' | 'before-first-effect' | 'before-last-effect' }
  | { type: 'effect', effect: EffectID, isCleanup: boolean }
  | { type: 'commit', commit: CommitID }

export const evaluateBreakpoints = (breakpoints: Breakpoints, thread: DebugThread): BreakPosition[] => {
  const positions: BreakPosition[] = [];

  switch (thread.state) {
    case 'commit':
      if (!thread.started && breakpoints.threadStart) {
        positions.push({ type: 'named', name: 'before-first-commit' })
      }
      const task = thread.pendingTasks[thread.pendingTasks.length - 1];
      if (task && breakpoints.commits.has(task.ref.id)) {
        positions.push({ type: 'commit', commit: task.ref.id })
      }
      break;
    case 'commit-pass':
      if (breakpoints.threadPass) {
        positions.push({ type: 'named', name: 'before-pass' })
      }
      break;
    case 'effect':
      if (thread.effects.taskIndex === 0 && breakpoints.effectsStart) {
        positions.push({ type: 'named', name: 'before-first-effect' })
      }
      if (thread.effects.taskIndex === thread.effects.tasks.length - 1 && breakpoints.effectsEnd) {
        positions.push({ type: 'named', name: 'before-last-effect' })
      }
      if (thread.effects.task && breakpoints.effects.has(thread.effects.task.id)) {
        positions.push({ type: 'effect', effect: thread.effects.task.id, isCleanup: thread.effects.task.type === 'cleanup' })
      }
      break;
    case 'submit':
      if (breakpoints.threadSubmit) {
        positions.push({ type: 'named', name: 'before-submit' })
      }
      break;
    case 'idle':
      break;
  }

  return positions;
}
