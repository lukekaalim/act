import { Element, ElementID } from "@lukekaalim/act";
import { Commit, CommitID, CommitRef, CommitVersion, DeltaSet, WorkReason, WorkThread } from "@lukekaalim/act-recon";
import { getElementName } from "./utils";

/**
 * "Reports" are serialized versions of their "native"
 * counterparts - ready for transport across process/context
 * boundaries.
 */

export type PropReport =
  | { type: 'simple-value', name: string }

export type ElementReport = {
  type: string
  id: ElementID;
  props: Record<string, PropReport>;
}

export const createElementReport = (element: Element): ElementReport => {
  return {
    id: element.id,
    type: getElementName(element),
    props: {},
  }
}

export type CommitReport = CommitRef & {
  version: CommitVersion;
  element: ElementReport;
  children: CommitRef[];
}

export const createCommitReport = (commit: Commit): CommitReport => {
  return {
    id: commit.id,
    path: commit.path,
    element: createElementReport(commit.element),
    version: commit.version,
    children: commit.children.map(child => ({ id: child.id, path: child.path }))
  }
}

export type DeltaReport = {
  type: 'create' | 'update' | 'remove' | 'skip' | 'move'
  prev: CommitReport | null,
  next: CommitReport | null 
}
export const createDeltaReports = (deltaSet: DeltaSet): DeltaReport[] => {
  const reports: DeltaReport[] = [];
  console.time('generating delta reports')
  for (const create of deltaSet.created)
    reports.push({
      type: 'create',
      prev: null,
      next: createCommitReport(create.next)
    });
  for (const update of deltaSet.updated)
    reports.push({
      type: update.moved ? 'move' : 'update',
      prev: createCommitReport(update.prev),
      next: createCommitReport(update.next)
    });
  for (const remove of deltaSet.removed)
    reports.push({
      type: 'remove',
      prev: createCommitReport(remove.prev),
      next: null,
    });

  console.timeEnd('generating delta reports')
  return reports;
}

export type ThreadReport = {
  //reasons: WorkReason[],
  deltas: DeltaReport[],
  visited: CommitRef[],
};


export const createThreadReport = (thread: WorkThread): ThreadReport => {
  return {
    //reasons: [...thread.reasons.values()],
    deltas: createDeltaReports(thread.deltas),
    visited: [...thread.visited.values()].map(v => ({ id: v.id, path: v.path })),
  }
}

export type TreeReport = {
  commits: Map<CommitID, CommitReport>,
  roots: CommitRef[],
}

export const updateTreeReport = (tree: TreeReport, thread: ThreadReport): TreeReport => {
  console.log(`Transforming ${thread.deltas.length} deltas`);
  for (const delta of thread.deltas) {
    const next = delta.next as CommitReport;
    const prev = delta.prev as CommitReport;
    switch (delta.type) {
      case 'create':
      case 'move':
      case 'update':
        tree.commits.set(next.id, next);
        break;
      case 'remove':
        tree.commits.delete(prev.id);
        break;
      case 'skip':
        break;
    }
  }
  return { ...tree };
}
