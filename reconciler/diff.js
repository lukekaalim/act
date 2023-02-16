// @flow strict

import { createSuspensionRegistry } from "./boundary.js";
import { createEffectRegistry } from "./effect.js";

/*::
import type {
  Commit3,
  CommitChange3,
  CommitChangeResult3,
  CommitID3,
  CommitMap,
  CommitRef3,
  CommitService2,
} from "./commit3";
import type { ComponentService2 } from "./component2";
import type { CommitID } from "./commit2";
import type { ContextService2 } from "./context2";
import type { EffectRegistry, EffectService } from "./effect";
import type { SuspensionRegistry } from "./boundary";
import type { Scheduler2 } from "./scheduler2";

export type DiffService = {
  submitChange: (
    change: CommitChange3,
    prevSet: DiffSet
  ) => Promise<DiffSet>,

  subscribeDiff: (subscriber: (diff: DiffSet) => mixed) => () => void,
  submitDiff: DiffSet => void,
};

export type DiffTask = {
  pending: CommitChange3[],
  prevSet: DiffSet,

  work: Generator<null, DiffSet, void>
};
export type DiffSet = {
  diffs: Map<CommitID3, Diff3>,

  prevs: CommitMap,
  nexts: CommitMap,
  root: CommitID3,

  registry: EffectRegistry,
  suspensions: SuspensionRegistry,
}

export type Diff3 = {
  commit: Commit3,
  change: CommitChange3,
  diffs: CommitID3[],
}
*/

const createDiff = (change/*: CommitChange3*/, result/*: CommitChangeResult3*/) => {
  return {
    commit: result.commit,
    change,
    diffs: result.changes.map(ch => ch.commit.id),
  }
}

/**
 * Returns null if the changes cant be merged,
 * or returns the result of both changed merged together.
 */
export const mergeChange = (
  existingChange/*: CommitChange3*/,
  targetChange/*: CommitChange3*/
)/*: null | CommitChange3*/ => {
  if (existingChange.type !== targetChange.type)
    return null;
  
  const commitPathIntersects = (
    targetChange.commit.id === existingChange.commit.id ||
    targetChange.commit.path.includes(existingChange.commit.id)
  );
  if (!commitPathIntersects)
    return null;

  // existing is "on the way" to target
  // We should add target targets to existing
  if (existingChange.type === 'update' && targetChange.type === 'update')
    return {
      ...existingChange,
      targets: [
        ...existingChange.targets,
        ...targetChange.targets
      ],
    };

  // If A is already encapsulated in B,
  // then it's already included in create and remove changes
  return existingChange;
}

export const createDiffService = (
  commitService/*: CommitService2*/,
  context/*: ContextService2*/,
  schedule/*: Scheduler2*/,
)/*: DiffService*/ => {
  let activeTask/*: null | { task: DiffTask, promise: Promise<DiffSet> }*/;

  const submitChange = (change, prevSet) => {
    if (!activeTask) {
      const newTask = startNewDiffTask(change, prevSet);
      const { promise } = schedule.requestWork(newTask.work)
      activeTask = {
        task: newTask,
        promise: promise.then((result) => {
          // Remove completed task
          activeTask = null;
          submitDiff(result);
          return result;
        })
      };
      return activeTask.promise;
    }
    const { task, promise: activeTaskPromise } = activeTask;

    let mergedChange = null;
    task.pending = task.pending.map(pendingChange => {
      if (mergedChange)
        return pendingChange;

      mergedChange = mergeChange(change, pendingChange);
      return mergedChange || pendingChange
    })

    if (mergedChange) {
      return activeTaskPromise;
    }

    return activeTaskPromise
      .then(prevSet => submitChange(change, prevSet))
  }

  const startNewDiffTask = (initialChange, prevSet)/*: DiffTask*/ => {
    const pending = [initialChange];
    const nexts = prevSet.nexts.clone();
    const prevs = prevSet.nexts;
    const root = initialChange.commit.id;

    function* work() {
      const diffs = new Map/*:: <CommitID3, Diff3>*/();

      const processCommit = (change, result) => {
        const { commit, changes } = result;
        switch (commit.element.type) {
          default:
            return result;
          case 'act:suspend':
            suspensions.addSuspensionValue(commit);
            return result;
          case 'act:context':
            const { targets: nextTargets } = context.updateCommit(commit);
            const processedChanges = changes
              .map(change => {
                switch (change.type) {
                  case 'update':
                    return { ...change, targets: [...change.targets, ...nextTargets] }
                  default:
                    return change
                }
              })
            return { commit, changes: processedChanges }
        }
      }

      const registry = prevSet.registry.clone();
      const suspensions = prevSet.suspensions.clone();
      const getElementTypeName = (type) => {
        if (typeof type === 'function')
          return type.name;
        return type;
      }
      while (pending.length > 0) {
        const change = pending.pop();

        const result = commitService.submit(change, prevs, registry);
        const processedResult = processCommit(change, result)
        nexts.append(processedResult.commit);
        pending.push(...processedResult.changes);
        diffs.set(processedResult.commit.id, createDiff(change, processedResult));

        yield null;
      }      
      return { diffs, nexts, prevs, root, registry, suspensions };
    }

    return { work: work(), pending, prevSet };
  };

  const submitDiff = (diffSet) => {
    performance.mark('act:schedule:renderstart');
    for (const {subscriber} of subscribers)
      subscriber(diffSet);
    performance.mark('act:schedule:renderend');
    performance.measure('act:schedule:render', 'act:schedule:renderstart', 'act:schedule:renderend');
  }
  const subscribers = new Set();
  const subscribeDiff = (subscriber) => {
    const subscription = { subscriber };
    subscribers.add(subscription)
    return () => {
      subscribers.delete(subscription);
    };
  }

  return { submitChange, submitDiff, subscribeDiff };
};