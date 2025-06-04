import { Element, ElementID } from "@lukekaalim/act";
import { Commit, CommitID, CommitRef, CommitVersion, ComponentState, DeltaSet, WorkReason, WorkThread } from "@lukekaalim/act-recon";
import { getElementName } from "./utils";

/**
 * "Reports" are serialized versions of their "native"
 * counterparts - ready for transport across process/context
 * boundaries.
 */

export type ValueReport =
  | { type: 'undefined' }
  | { type: 'primitive', value: string | number | boolean | null }
  | { type: 'complex', name: string }

export const createValueReport = (value: unknown): ValueReport => {
  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
      return { type: 'primitive', value };
    case 'bigint':
      return { type: 'complex', name: `bigint(${value.toString()})` }
    case 'object':
      if (!value)
        return { type: 'primitive', value };
      if (value.constructor)
        return { type: 'complex', name: value.constructor.name }
      return { type: 'complex', name: '???' }
    case 'function':
      return { type: 'complex', name: value.name };
    case 'symbol':
      return { type: 'complex', name: value.description || 'symbol' }
    case 'undefined':
      return { type: 'undefined' }
  }
};

export type ElementReport = {
  type: string
  id: ElementID;
}

export const createElementReport = (element: Element): ElementReport => {
  return {
    id: element.id,
    type: getElementName(element),
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

export type CommitStateReport = {
  props: { name: string, value: ValueReport }[],
  values: { id: number, value: ValueReport }[],
}

export const createCommitStateReport = (commit: Commit, state?: ComponentState): CommitStateReport => {
  return {
    props: Object
      .entries(commit.element.props)
      .map(([key, value]) => ({ name: key, value: createValueReport(value) })),
    values: !state ? [] : [...state.values.entries()]
      .map(([key, value]) => ({ id: key, value: createValueReport(value) })),
  }
};
