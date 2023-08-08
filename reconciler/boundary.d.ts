import { Commit3, CommitID3 } from "./commit3";

export type BoundaryMap = {
  boundaries: Map<CommitID3, Commit3>,
  boundaryEdges: Map<CommitID3, CommitID3[]>,
};

export type BoundaryService = {
  calcBoundaryMap: (diffSet: DiffSet) => BoundaryMap,
  getRootBoundaryValue: (suspension: SuspensionRegistry, diffSet: DiffSet, boundaryMap: BoundaryMap) => mixed[],
};

export type SuspensionRegistry = {
  suspensionsByCommit: Map<CommitID3, mixed>,
  clone: () => SuspensionRegistry,
  addSuspensionValue: (commitId: Commit3) => void,
};