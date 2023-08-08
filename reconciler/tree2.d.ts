import { Element } from "@lukekaalim/act";
import { CommitRef3, DiffService, DiffSet } from "./main.js";

export type TreeService2 = {
  mount: (element: Element) => void,
  update: (commit: CommitRef3) => void,
  unmount: () => void,
  live: DiffSet,
};

export declare function createTreeService2(
  diff: DiffService
): TreeService2;