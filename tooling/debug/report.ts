import { ContextID, Element, ElementID, ElementType, OpaqueID, primitiveNodeTypes, refSymbol, specialNodeTypes } from "@lukekaalim/act";
import {
  Commit2, CommitID, CommitTree2, CommitVersion,
  Delta, EffectCleanupState, EffectID,
  EffectTask2, WorkReason, WorkTask, WorkThread2
} from "@lukekaalim/act-recon";
import { EffectWorker } from "./reconciler";

/**
 * "Reports" are serialized versions of their "native"
 * counterparts - ready for transport across process/context
 * boundaries.
 */

export type ValueReport =
  | { type: 'undefined' }
  | { type: 'primitive', value: string | number | boolean | null }
  | { type: 'complex', name: string }
  | { type: 'function', name: string }
  | { type: 'array', length: number }
  | { type: 'ref', current: ValueReport }
  | { type: 'object', keys: string[] }

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
      if (refSymbol in value && "current" in value) {
        return { type: "ref", current: createValueReport(value.current) };
      }
      if (Array.isArray(value))
        return { type: 'array', length: value.length }
      if (value.constructor) {
        if (value.constructor.name === "Object") {
          return { type: 'object', keys: Object.keys(value) }
        }
        return { type: 'complex', name: value.constructor.name }
      }
      
      return { type: 'complex', name: '???' }
    case 'function':
      return { type: 'function', name: value.name };
    case 'symbol':
      return { type: 'complex', name: value.description ? `symbol(${value.description})` : 'symbol' }
    case 'undefined':
      return { type: 'undefined' }
  }
};

export type ComponentStateReport = {
  stateValues: { hookIndex: number, value: ValueReport }[],
  deps: { hookIndex: number, deps: null | ValueReport[] }[],
  subscriptions: { hookIndex: number, context: ContextID, provider: CommitID }[],
  effects: { hookIndex: number, effect: EffectID }[],
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
    })),
    deps: [...componentState.deps.entries()].map(([hookIndex, deps]) => ({
      hookIndex,
      deps: deps && deps.map(createValueReport)
    })),
    subscriptions: [...componentState.providers.entries()].map(([hookIndex, provider]) => ({
      hookIndex,
      context: provider?.contextId || '??',
      provider: provider?.id || '??'
    })),
    effects: [...componentState.effects.entries()].map(([hookIndex, effect]) => ({
      hookIndex,
      effect
    })),
  } as ComponentStateReport || null;

  return {
    commit: createCommitReport(commit),
    props,
    component,
  }
}

export type ElementTypeReport =
  | { type: 'primitive', value: string | number | boolean | null }
  | { type: 'array' }
  | { type: 'render', render: string }
  | { type: 'special', special: 'boundary' | 'provider' | 'fallback' | 'suspend' | 'placeholder' }
  | { type: 'symbol', name: string | null }
  | { type: 'string', name: string }
  | { type: 'component', name: string | null }

export const createElementTypeReport = (elementType: ElementType, element: Element): ElementTypeReport => {
  switch (elementType) {
    case primitiveNodeTypes.string:
      return { type: 'primitive', value: element.props.value as string };
    case primitiveNodeTypes.number:
      return { type: 'primitive', value: element.props.value as number };
    case primitiveNodeTypes.boolean:
      return { type: 'primitive', value: element.props.value as boolean };
    case primitiveNodeTypes.null:
      return { type: 'primitive', value: null };
    case primitiveNodeTypes.array:
      return { type: 'array' };
    case specialNodeTypes.boundary:
      return { type: 'special', special: 'boundary' };
    case specialNodeTypes.render:
      return { type: 'render', render: element.props.type as string };
    case specialNodeTypes.provider:
      return { type: 'special', special: 'provider' };
    case specialNodeTypes.fallback:
      return { type: 'special', special: 'fallback' };
    case specialNodeTypes.suspend:
      return { type: 'special', special: 'suspend' };
    case specialNodeTypes.placeholder:
      return { type: 'special', special: 'placeholder' };
    default: {
      switch (typeof elementType) {
        case 'string':
          return { type: 'string', name: elementType };
        case 'function':
          return { type: 'component', name: elementType.name };
        case 'symbol':
          return { type: 'symbol', name: elementType.description || null };
        default:
          throw new Error();
      }
    }
  }
}

export type ElementReport = {
  type: ElementTypeReport,
  //props: Record<string, ValueReport>,
  id: ElementID;
}

export const createElementReport = (element: Element): ElementReport => {
  return {
    id: element.id,
    //props: Object.entries(element.props).map(([name, value]) => [name, createValueReport(value)])
    type: createElementTypeReport(element.type, element),
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
  updated: CommitReport[],

  effects: EffectReport[],
}
export const createDeltaReport = (delta: Delta): DeltaReport => {
  const report: DeltaReport = {
    created: [],
    removed: [],
    updated: [],
    effects: [],
  }
  for (const commit of delta.fresh.values())
    report.created.push(createCommitReport(commit));
  for (const { next } of delta.changed.values())
    report.updated.push(createCommitReport(next));
  for (const commit of delta.removed.values())
    report.removed.push(createCommitReport(commit));

  for (const effect of delta.effects.values())
    report.effects.push(createEffectTaskReport(effect))

  return report;
}

export type WorkTaskReport = {
  element: null | ElementReport,
  prev: null | CommitReport,
  moved: boolean,

  parent: null | CommitID,
  id: CommitID,
  distance: number,
}
export const createWorkTaskReport = (task: WorkTask): WorkTaskReport => {
  return {
    element: task.next && createElementReport(task.next),
    prev: task.prev && createCommitReport(task.prev),
    moved: task.moved,

    parent: task.ref.parent && task.ref.parent.id,
    distance: task.ref.length,
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
  started: boolean,
  submitted: boolean,
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
    started: thread.started,
    submitted: thread.submitted,
  }
}

export type TreeReport = {
  commits: CommitReport[],
  roots: CommitID[],
  cleanups: EffectCleanupReport[]
}

export const createTreeReport = (tree: CommitTree2) => {
  const report: TreeReport = { commits: [], roots: [], cleanups: [] };

  for (const commit of tree.commits.values()) {
    report.commits.push(createCommitReport(commit));
  }
  for (const root of tree.roots) {
    report.roots.push(root);
  }
  for (const [id, cleanup] of tree.cleanups) {
    report.cleanups.push({ id, functionName: cleanup.func.name || null, commit: cleanup.ref.id })
  }

  return report;
}

export type EffectCleanupReport = {
  id: EffectID,
  commit: CommitID,
  functionName: string | null,
}

export const createEffectCleanupReport = (cleanup: EffectCleanupState): EffectCleanupReport => {
  return {
    id: cleanup.id,
    commit: cleanup.ref.id,
    functionName: cleanup.func && cleanup.func.name || null,
  }
}


export type EffectReport = {
  id: EffectID,
  commit: CommitID,

  effect: boolean,
  functionName: string | null,
};

export const createEffectTaskReport = (task: EffectTask2): EffectReport => {
  return {
    id: task.id,
    commit: task.ref.id,
    effect: !!task.effect,
    functionName: task.effect && task.effect.name,
  }
}

export type SubmissionReport = {
  thread: ThreadReport,
  delta: DeltaReport
}

export const createSubmissionReport = (thread: WorkThread2) => {
  return {
    thread: createThreadReport(thread),
    delta: createDeltaReport(thread.delta)
  }
}

export type EffectWorkerReport = {
  completedCleanups: EffectID[],
  completedEffects: EffectID[],

  newCleanups: EffectCleanupReport[],
}

export const createEffectWorkerReport = (effectWorker: EffectWorker): EffectWorkerReport => {
  return {
    completedCleanups: [...effectWorker.completedCleanups],
    completedEffects: [...effectWorker.completedEffects],
    newCleanups: [...effectWorker.newCleanups.values()].map(createEffectCleanupReport)
  }
}