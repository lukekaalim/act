// @flow strict
/*:: import type { Element } from '@lukekaalim/act'; */
/*:: import type { Change, CommitDiff, Commit, BranchState, CommitRef } from './commit2.js'; */
import { createId, h } from '@lukekaalim/act';
/*::
import type { CommitID } from "./commit2";
import type { Commit3, CommitID3, CommitMap } from "./commit3";
import type { DiffSet } from "./diff";
import * as diff from "./diff";
*/

/*::
export type BoundaryMap = {
  boundaries: Map<CommitID3, Commit3>,
  boundaryEdges: Map<CommitID3, CommitID3[]>,
};

export type BoundaryService = {
  calcBoundaryMap: (diffSet: DiffSet) => BoundaryMap,
  getRootBoundaryValue: (suspension: SuspensionRegistry, diffSet: DiffSet, boundaryMap: BoundaryMap) => mixed[],
};
*/

export const createBoundaryService = ()/*: BoundaryService*/ => {

  const calcBoundaryMap = (diffSet) => {
    const boundaries = new Map([...diffSet.nexts.map]
      .filter(([, commit]) => commit.element.type === 'act:boundary'));
    const boundaryEdges = new Map();

    for (const [,boundary] of boundaries) {
      const boundaryParentId = [...boundary.path]
        .reverse()
        .find(id => boundaries.get(id)) || diffSet.root;

      const edgeSet = boundaryEdges.get(boundaryParentId) || [];
      edgeSet.push(boundary.id);
      boundaryEdges.set(boundaryParentId, edgeSet);
    }

    return { boundaries, boundaryEdges }
  }

  const getRootBoundaryValue = (suspension, diffSet, boundaryMap) => {
    const directSuspendedBoundaryValues = new Map();

    for (const [suspendedCommitId, suspensionValue] of suspension.suspensionsByCommit) {
      const suspendedCommit = diffSet.nexts.get(suspendedCommitId);
      const closestBoundary = [...suspendedCommit.path]
        .reverse()
        .map(id => boundaryMap.boundaries.get(id))
        .find(Boolean) || diffSet.nexts.get(diffSet.root);
        
      const boundaryValues = directSuspendedBoundaryValues.get(closestBoundary.id) || [];
      const nextBoundaryValues = [...boundaryValues, suspensionValue];
      directSuspendedBoundaryValues.set(closestBoundary.id, nextBoundaryValues);
    }
    
    const getBoundaryValueForCommit = (commitId) => {
      const boundary = diffSet.nexts.get(commitId);
        
      const decendants = boundaryMap.boundaryEdges.get(commitId) || [];
      const directValues = directSuspendedBoundaryValues.get(commitId) || [];

      const descentantValues = decendants.map(getBoundaryValueForCommit).flat(1);

      const currentValues = [...directValues, ...descentantValues];
      const { handleBoundaryValue } = boundary.element.props
      if (typeof handleBoundaryValue === 'function')
        // $FlowFixMe
        return handleBoundaryValue(currentValues)
      return currentValues;
    }
    
    return getBoundaryValueForCommit(diffSet.root);
  }

  return {
    getRootBoundaryValue,
    calcBoundaryMap,
  };
};

/*::
export type SuspensionRegistry = {
  suspensionsByCommit: Map<CommitID3, mixed>,
  clone: () => SuspensionRegistry,
  addSuspensionValue: (commitId: Commit3) => void,
};
*/

export const createSuspensionRegistry = (
  suspensionsByCommit/*: Map<CommitID3, mixed>*/ = new Map()
)/*: SuspensionRegistry*/ => {

  const addSuspensionValue = (commit) => {
    switch (commit.state) {
      case 'attached':
      case 'suspended':
        return void suspensionsByCommit.set(commit.id, commit.element.props.value)
      case 'pruned':
        return void suspensionsByCommit.delete(commit.id)
      default:
    }
  };

  const clone = () => {
    return createSuspensionRegistry(new Map(suspensionsByCommit));
  };

  return { addSuspensionValue, suspensionsByCommit, clone }
}