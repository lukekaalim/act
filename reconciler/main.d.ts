import { Element } from '@lukekaalim/act';

declare type CommitID = string;
declare type CommitRef = {
  id: CommitID,
  path: CommitID[]
};
declare type CommitVersion = string;
declare type Commit = CommitRef & {
  version: CommitVersion,
  state: 'attached' | 'pruned' | 'suspended'
  children: CommitID[],
};

export type CommitChange = 
  | { type: 'create', element: Element, commit: CommitRef }
  | { type: 'remove', commit: Commit }
  | { type: 'update', targets: CommitRef[], commit: Commit, element: Element }

export type CommitChangeResult = {
  changes: CommitChange[],
  commit: Commit,
}
export type DiffSet = {
  
}

declare type Scheduler = {
  
}
declare function createScheduler2(
  requestCallback: (callback: (deadline: number) => unknown) => () => void,
): Scheduler;


declare type ContextService = {
  
}

declare type ComponentService = {
  
}

declare type CommitService = {

}

declare type DiffService = {
  submitChange: (change: CommitChange, prevSet: DiffSet) => Promise<DiffSet>,
  submitDiff: (set: DiffSet) => void,
  subscribeDiff: (subscriber: (diff: DiffSet) => unknown) => () => void,
}

declare type TreeService = {
  mount: (element: Element) => void,
  update: (commit: CommitRef) => void,
  unmount: () => void,
}

declare type Reconciler = {
  diff: DiffService,
  tree: TreeService,
};
declare function createReconciler(scheduler: Scheduler): Reconciler;