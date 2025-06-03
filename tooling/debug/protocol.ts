import { CommitID, CommitRef, EventEmitter, WorkThread } from "@lukekaalim/act-recon";
import { ChannelClient } from "./channel";
import { ComponentStateReport, ThreadReport } from "./report";

export type DebugOptions = {
  stepWork: boolean,
};

export type DebuggerMessage =
  | { type: 'server:ready' }
  | { type: 'server:accept' }
  | { type: 'work:perform' }
  | { type: 'component-state:request', commitId: CommitID }
  | { type: 'debug:options', options: DebugOptions }

export type TargetMessage =
  | { type: 'target:ready' }
  | { type: 'thread:start', thread: ThreadReport }
  | { type: 'thread:update', thread: ThreadReport }
  | { type: 'thread:finish', thread: ThreadReport }
  | { type: 'tree:root-update', roots: CommitRef[], }
  | { type: 'component-state:response', report: ComponentStateReport }
  | { type: 'work:request' }

export type TargetClient = {
  performWork(): void,
}

export type DebuggerClient = {
  startThread(thread: ThreadReport): void,
  updateThread(thread: ThreadReport): void,
  finishThread(thread: ThreadReport): void,

  rootUpdate(roots: CommitRef[]): void,
  requestWork(): void,
  ready(): void,

  componentState(state: ComponentStateReport): void,

  subscribe: EventEmitter<DebuggerMessage>["subscribe"],
}
export type DebuggerServer = {
  ready(): void,
  work(): void,
  accept(): void,
  setOptions(options: DebugOptions): void,
  componentState(commitId: CommitID): void,
  subscribe: EventEmitter<TargetMessage>["subscribe"],
}

export const createDebuggerClient = (
  channelClient: ChannelClient<DebuggerMessage, TargetMessage>
): DebuggerClient => {
  return {
    startThread(thread) {
      channelClient.send({ type: 'thread:start', thread });
    },
    updateThread(thread) {
      channelClient.send({ type: 'thread:update', thread });
    },
    finishThread(thread) {
      channelClient.send({ type: 'thread:finish', thread });
    },
    rootUpdate(roots) {
      channelClient.send({ type: 'tree:root-update', roots });
    },
    requestWork() {
      channelClient.send({ type: 'work:request' });
    },
    componentState(report) {
      channelClient.send({ type: 'component-state:response', report });
    },
    ready() {
      channelClient.send({ type: 'target:ready' });
    },
    subscribe: channelClient.subscribe,
  }
};


export const createDebuggerServer = (
  channelClient: ChannelClient<TargetMessage, DebuggerMessage>
): DebuggerServer => {
  return {
    work() {
      channelClient.send({ type: 'work:perform' });
    },
    setOptions(options: DebugOptions) {
      channelClient.send({ type: 'debug:options', options })
    },
    ready() {
      channelClient.send({ type: 'server:ready' })
    },
    accept() {
      channelClient.send({ type: 'server:accept' })
    },
    componentState(commitId) {
      channelClient.send({ type: 'component-state:request', commitId })
    },
    subscribe: channelClient.subscribe,
  }
};
