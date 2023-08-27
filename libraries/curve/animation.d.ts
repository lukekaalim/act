
export function useAnimation(
  animation?: (now: DOMHighResTimeStamp) => void | boolean,
  deps?: unknown[]
): { refresh: () => void };
