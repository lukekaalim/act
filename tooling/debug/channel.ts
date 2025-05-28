import { WorkThread, EventEmitter, createEventEmitter } from "@lukekaalim/act-recon"

type UnionToMap<T extends { type: string }> = { [K in T["type"]]: Omit<Extract<T, { type: K }>, "type"> };

export type TargetID = string;

export type MessageType<T extends string, Fields extends Record<string, unknown> = {}> = {
  readonly type: T,
} & Fields;

export type DebugOptions = {
  stepWork: boolean,
};

export type DebuggerMessage =
  | MessageType<'work:perform'> // Advance the thread by a single "work" cycle
  | MessageType<'debug:options', { options: DebugOptions }>

export type TargetMessage =
  | MessageType<'debug:ready'>
  | MessageType<'thread:start', { thread: WorkThread }>
  | MessageType<'thread:update', { thread: WorkThread }>
  | MessageType<'thread:finish', { thread: WorkThread }>
  | MessageType<'work:request'>

export type TargetClient = {
  performWork(): void,
}

export type DebuggerClient = {
  startThread(thread: WorkThread): void,
  updateThread(thread: WorkThread): void,
  finishThread(thread: WorkThread): void,

  requestWork(): void,
  ready(): void,

  on: EventEmitter<UnionToMap<DebuggerMessage>>['on']
}
export const createDebuggerClient = (): DebuggerClient => {
  const recieveMessage = createEventEmitter();
  const sendMessage = (payload: TargetMessage) => {
    window.postMessage({
      key: '@lukekaalim/act-debug',
      payload,
    })
  }


  window.addEventListener('message', (message) => {
    message.data
    console.log('GOT MESSAGE in DEBUGGER CLIENT', message);
  });

  return {
    startThread(thread) {
      sendMessage()
    },
    updateThread(thread) {
      
    },
    finishThread(thread) {
      
    },
  }
};