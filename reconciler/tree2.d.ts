import { Element } from "@lukekaalim/act";
import { CommitRef, DiffService } from "./main";

export type TreeService2 = {
  mount: (element: Element) => void,
  update: (commit: CommitRef3) => void,
  unmount: () => void,
  live: DiffSet,
};

declare export function createTreeService2(
  diff: DiffService
): TreeService2;