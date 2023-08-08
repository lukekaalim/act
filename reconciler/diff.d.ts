import { SuspensionRegistry } from "./boundary";
import {
  Commit3,
  CommitChange3,
  CommitID3,
  CommitMap,
  CommitService2,
} from "./commit3";
import { ContextService2 } from "./context2";
import { EffectRegistry } from "./effect";
import { Scheduler2 } from "./scheduler2";

export type DiffService = {
  submitChange: (change: CommitChange3, prevSet: DiffSet) => Promise<DiffSet>;

  subscribeDiff: (subscriber: (diff: DiffSet) => unknown) => () => void;
  submitDiff: (set: DiffSet) => void;
};

export type DiffTask = {
  pending: CommitChange3[];
  prevSet: DiffSet;

  work: Generator<null, DiffSet, void>;
};
export type DiffSet = {
  diffs: Map<CommitID3, Diff3>;

  prevs: CommitMap;
  nexts: CommitMap;
  root: CommitID3;

  registry: EffectRegistry;
  suspensions: SuspensionRegistry;
};

export type Diff3 = {
  commit: Commit3;
  change: CommitChange3;
  diffs: CommitID3[];
};

declare function createDiffService(
  commitService: CommitService2,
  context: ContextService2,
  schedule: Scheduler2
): DiffService;
