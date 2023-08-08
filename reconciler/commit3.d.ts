import { Element } from "@lukekaalim/act";
import { EffectRegistry } from "./effect";
import { ComponentService2 } from "./component2";

export type CommitID3 = string;
export type CommitVersion = string;
export type CommitRef3 = {
  id: CommitID3;
  path: CommitID3[];
};

export type CommitState3 = "pruned" | "suspended" | "attached";

export type Commit3 = CommitRef3 & {
  version: CommitVersion;
  element: Element;
  children: CommitID3[];
  state: CommitState3;
};

export type CommitChange3 =
  | { type: "create"; element: Element; commit: CommitRef3 }
  | { type: "remove"; commit: Commit3 }
  | {
      type: "update";
      targets: CommitRef3[];
      commit: Commit3;
      element: Element;
    };

export type CommitChangeResult3 = {
  changes: $ReadOnlyArray<CommitChange3>;
  commit: Commit3;
};

export type CommitMap = {
  map: Map<CommitID3, Commit3>;
  get: (commitId: CommitID3) => Commit3;

  append: (commit: Commit3) => void;
  clone: () => CommitMap;
};

export type CommitService2 = {
  submit: (
    change: CommitChange3,
    map: CommitMap,
    effect: EffectRegistry
  ) => CommitChangeResult3;
};

declare function createCommitService2(
  component: ComponentService2
): CommitService2;
