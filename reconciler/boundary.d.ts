import { Commit3, CommitID3 } from "./commit3.js";
import { DiffSet } from "./diff.js";

export type BoundaryMap = {
  boundaries: Map<CommitID3, Commit3>,
  boundaryEdges: Map<CommitID3, CommitID3[]>,
};

export type BoundaryService = {
  calcBoundaryMap: (diffSet: DiffSet) => BoundaryMap,
  getRootBoundaryValue: (suspension: SuspensionRegistry, diffSet: DiffSet, boundaryMap: BoundaryMap) => unknown[],
};

export type SuspensionRegistry = {
  suspensionsByCommit: Map<CommitID3, unknown>,
  clone: () => SuspensionRegistry,
  addSuspensionValue: (commitId: Commit3) => void,
};

export declare function createSuspensionRegistry(
  suspensionsByCommit?: Map<CommitID3, unknown>
): SuspensionRegistry

export declare function createBoundaryService(): BoundaryService;