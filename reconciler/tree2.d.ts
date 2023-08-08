import { Element } from "@lukekaalim/act";
import { CommitRef, CommitRef3, DiffService, DiffSet } from "./main";

export type TreeService2 = {
  mount: (element: Element) => void,
  update: (commit: CommitRef3) => void,
  unmount: () => void,
  live: DiffSet,
};

declare export function createTreeService2(
  diff: DiffService
): TreeService2;