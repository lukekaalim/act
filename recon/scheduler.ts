import { OpaqueID } from "@lukekaalim/act";

export type WorkID = OpaqueID<"WorkID">;
/**
 * Work provider is platform agnostic timer/callback interface
 */
export type Scheduler = {
  requestWork(callback: () => void): WorkID,
  cancelWork(workId: WorkID): void,
};
