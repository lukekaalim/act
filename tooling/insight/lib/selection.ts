import { createContext, OpaqueID, useContext, useState } from "@lukekaalim/act";
import { CommitID, EffectID } from "@lukekaalim/act-recon";

export type SelectionTarget =
  | { type: 'commit', id: CommitID }
  | { type: 'effect', id: EffectID }
  | { type: 'thread', id: OpaqueID<"ThreadID"> }
  | { type: 'none' }

export type SelectionManager = {
  select(target: SelectionTarget): void,

  target: SelectionTarget,
}

export const useSelectionManager = (): SelectionManager => {
  const [target, select] = useState<SelectionTarget>({ type: 'none' })

  return {
    target,
    select
  }
}

export const SelectionContext = createContext<SelectionManager>({
  target: { type: 'none' },
  select(target) {},
})

export const useSelection = (): SelectionManager => {
  return useContext(SelectionContext);
}