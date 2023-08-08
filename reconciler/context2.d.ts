import { ContextID } from "@lukekaalim/act"
import { Commit3, CommitID3, CommitRef3 } from "./commit3"

export type ContextProvider = {
  value: unknown,
  getCurrentTargets: () => CommitRef3[],
  attach: (ref: CommitRef3) => ({ detach: () => void }),
}

declare type ContextService2 = {
  getProviderForPath: (contextId: ContextID, path: CommitID3[], defaultValue: unknown) => ContextProvider,

 
  updateCommit: (commit: Commit3) => { targets: CommitRef3[] },
}
declare export function createContextService2(): ContextService2