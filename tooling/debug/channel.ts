import { WorkThread } from "@lukekaalim/act-recon"
import { EventEmitter } from "@lukekaalim/act-recon"

type UnionToMap<T extends { type: string }> = { [K in T["type"]]: Omit<Extract<T, { type: K }>, "type"> };

export type DebugOptions = {
  stepWork: boolean,
};

export type DebuggerEvent =
  | { type: 'work:perform' } // Advance the thread by a single "work" cycle
  | { type: 'debug:options', options: DebugOptions }

export type TargetEvent =
  | { type: 'debug:ready' }
  | { type: 'thread:start', thread: WorkThread }
  | { type: 'thread:update', thread: WorkThread }
  | { type: 'thread:finish', thread: WorkThread }
  | { type: 'work:request' }

export type TargetClient = {
  performWork(): void,
}

export type DebuggerClient = {
  startThread(thread: WorkThread): void,
  updateThread(thread: WorkThread): void,
  finishThread(thread: WorkThread): void,

  requestWork(): void,
  ready(): void,

  on: EventEmitter<UnionToMap<DebuggerEvent>>['on']
}

export const LUKEKAALIM_ACT_DEBUGGER_KEY = 'LUKEKAALIM_ACT_DEBUGGER_KEY';

declare global {
  var LUKEKAALIM_ACT_DEBUGGER_KEY: DebuggerClient;
};

export const setDebuggerClient = (client: DebuggerClient) => {
  globalThis[LUKEKAALIM_ACT_DEBUGGER_KEY] = client;
}

export const getDebuggerClient = async () => {
  return globalThis[LUKEKAALIM_ACT_DEBUGGER_KEY];
}
