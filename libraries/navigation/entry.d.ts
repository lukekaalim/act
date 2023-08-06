import { Context } from "@lukekaalim/act";

export type Navigation = {
  navigate: (destination: URL, title?: string) => unknown;
  location: URL;
};

export type History = {
  pushState: (state?: unknown, unused?: "", destination?: string) => void;
};

export const navigationContext: Context<null | Navigation>;

/**
 * Create a Navigation element, which keeps track of the current
 * "path".
 */
export function useRootNavigation(
  initialHref?: string,
  history?: History
): Navigation;
