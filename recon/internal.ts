import { UnsetHookImplementation } from "@lukekaalim/act";
import { ComponentState } from "./state";

export const useInternalComponentState = (): ComponentState => {
  return internalHookImplementations.useInternalComponentState();
}

export const internalHookImplementations = {
  useInternalComponentState(): ComponentState {
    throw new UnsetHookImplementation();
  },
}