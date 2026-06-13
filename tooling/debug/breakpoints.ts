import { CommitID, EffectID } from "@lukekaalim/act-recon"

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

  commits: new Set(),
  effects: new Set(),
}