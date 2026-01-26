import { Element, ElementID, OpaqueID } from "@lukekaalim/act";
import { Commit2, CommitID, CommitTree2, CommitVersion, ComponentState, Delta, WorkReason, WorkTask, WorkThread2 } from "@lukekaalim/act-recon";
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
      return { type: 'complex', name: `function(${value.name})` };
    case 'symbol':
      return { type: 'complex', name: value.description ? `symbol(${value.description})` : 'symbol' }
    case 'undefined':
      return { type: 'undefined' }
  }
};

export type ComponentStateReport = {
  stateValues: { hookIndex: number, value: ValueReport }[]
}

export type CommitDetailsReport = {
  commit: CommitReport,
  props: Record<string, ValueReport>,

  component: null | ComponentStateReport,
}

export const createCommitDetailsReport = (commit: Commit2, tree: CommitTree2): CommitDetailsReport => {
  const props: Record<string, ValueReport> = {};

  for (const key in commit.element.props) {
    props[key] = createValueReport(commit.element.props[key]);
  }
  const componentState = tree.components.get(commit.ref.id);

  const component = componentState && {
    stateValues: [...componentState.values.entries()].map(([hookIndex, value]) => ({
      hookIndex,
      value: createValueReport(value),
    }))
  } || null;

  return {
    commit: createCommitReport(commit),
    props,
    component,
  }
}



export type ElementReport = {
  type: string,
  //props: Record<string, ValueReport>,
  id: ElementID;
}

export const createElementReport = (element: Element): ElementReport => {
  return {
    id: element.id,
    //props: Object.entries(element.props).map(([name, value]) => [name, createValueReport(value)])
    type: getElementName(element),
  }
}

export type CommitReport = {
  id: CommitID,
  parent: CommitID | null,
  distance: number,

  version: CommitVersion;
  element: ElementReport;
  children: CommitID[];
}

export const createCommitReport = (commit: Commit2): CommitReport => {
  return {
    id: commit.ref.id,
    parent: commit.ref.parent ? commit.ref.parent.id : null,
    distance: commit.ref.length,

    element: createElementReport(commit.element),
    version: commit.version,
    children: commit.children.map(child => child.id)
  }
}


export type DeltaReport = {
  created: CommitReport[],
  removed: CommitReport[],
  updated: CommitReport[]
}
export const createDeltaReport = (delta: Delta): DeltaReport => {
  const report: DeltaReport = {
    created: [],
    removed: [],
    updated: [],
  }
  for (const commit of delta.fresh.values())
    report.created.push(createCommitReport(commit));
  for (const { next } of delta.changed.values())
    report.updated.push(createCommitReport(next));
  for (const commit of delta.removed.values())
    report.removed.push(createCommitReport(commit));

  return report;
}

export type WorkTaskReport = {
  element: null | ElementReport,
  prev: null | CommitReport,
  moved: boolean,

  parent: null | CommitID,
  id: CommitID,
}
export const createWorkTaskReport = (task: WorkTask): WorkTaskReport => {
  return {
    element: task.next && createElementReport(task.next),
    prev: task.prev && createCommitReport(task.prev),
    moved: task.moved,

    parent: task.ref.parent && task.ref.parent.id,
    id: task.ref.id,
  }
}

export type ThreadReport = {
  missed: CommitID[],
  visited: CommitID[],
  mustVisit: CommitID[],
  mustRender: CommitID[],

  pendingTasks: WorkTaskReport[],
  reasons: WorkReasonReport[],

  id: OpaqueID<"ThreadID">,
  passes: number,
  done: boolean,
};

export type WorkReasonReport = { target: CommitID, element: ElementReport | null };
export const createWorkReasonReport = (reason: WorkReason): WorkReasonReport => {
  if (reason.type === 'mount')
    return { target: reason.ref.id, element: createElementReport(reason.element) }
  return { target: reason.ref.id, element: null }
}

export const createThreadReport = (thread: WorkThread2): ThreadReport => {
  return {
    visited: [...thread.visited],
    mustVisit: [...thread.mustVisit],
    mustRender: [...thread.mustRender],
    missed: [...thread.missed],

    pendingTasks: thread.pendingTasks.map(createWorkTaskReport),
    reasons: thread.reasons.map(createWorkReasonReport),
    id: thread.id,
    passes: thread.passes,
    done: thread.done,
  }
}

export type TreeReport = {
  commits: CommitReport[],
  roots: CommitID[]
}

export const createTreeReport = (tree: CommitTree2) => {
  const report: TreeReport = { commits: [], roots: [] };

  for (const commit of tree.commits.values()) {
    report.commits.push(createCommitReport(commit));
  }
  for (const root of tree.roots) {
    report.roots.push(root);
  }

  return report;
}

export const updateTreeReport = (tree: TreeReport, delta: DeltaReport) => {
  const commits = new Map(tree.commits.map(c => [c.id, c]));
  const roots = new Set(tree.roots);

  for (const commit of delta.created.values()) {
    commits.set(commit.id, commit);
    if (commit.parent === null)
      roots.add(commit.id);
  }
  for (const commit of delta.updated.values()) {
    commits.set(commit.id, commit);
  }
  for (const commit of delta.removed.values()) {
    commits.delete(commit.id);
    if (commit.parent === null)
      roots.delete(commit.id);
  }

  tree.roots = [...roots];
  tree.commits = [...commits.values()]
}

