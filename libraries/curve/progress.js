// @flow strict

import { useEffect } from "@lukekaalim/act";

export const calculateProgress = (start/*: number*/, duration/*: number*/, now/*: number*/)/*: number*/ => {
  if (duration === 0)
    return 1;
  return (now - start) / duration;
}

export const createProgressTimer = (duration/*: number*/, onProgress/*: number => mixed*/)/*: () => void*/ => {
  const start = performance.now();

  const update = (now) => {
    const progress = calculateProgress(start, duration, now);

    onProgress(progress);
    if (progress < 1)
      id = requestAnimationFrame(update);
  };
  let id = requestAnimationFrame(update);

  return () => {
    cancelAnimationFrame(id);
  }
};

export const useProgress = (duration/*: number*/, onProgress/*: number => mixed*/, deps/*: mixed[]*/) => {
  useEffect(() => {
    const cleanup = createProgressTimer(duration, onProgress);
    return () => {
      cleanup();
    }
  }, [...deps])
};