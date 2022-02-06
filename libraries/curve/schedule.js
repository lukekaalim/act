// @flow strict

import { useAnimation } from "./animation.js";
import { calculateProgress } from "./progress.js";

// A type that represents something that spans
// a set of time
/*::
export type TimeSpan = {
  start: DOMHighResTimeStamp,
  durationMs: number,
}
*/

export const maxSpan = (spans/*: TimeSpan[]*/)/*: TimeSpan*/ => {
  const start = Math.min(...spans.map(s => s.start));
  const durationMs = Math.max(...spans.map(s => s.start + s.durationMs));

  return {
    start,
    durationMs
  };
}

export const useTimeSpan = (
  span/*: TimeSpan*/,
  animate/*: (now: DOMHighResTimeStamp) => mixed*/,
  deps/*: mixed[]*/ = []
) => {
  useAnimation((now) => {
    animate(now);
    return calculateSpanProgress(span, now) === 1;
  }, deps)
}

export const calculateSpanProgress = (
  { start, durationMs }/*: TimeSpan*/,
  now/*: DOMHighResTimeStamp*/
)/*: number*/ => {
  return calculateProgress(start, durationMs, now);
}

export const sequenceSpanPairs = /*:: <T>*/(
  collection/*: [T, TimeSpan][]*/,
  delay/*: number*/,
)/*: [T, TimeSpan][]*/ => {
  const sortedByStart = collection
    .sort((a, b) => a[1].start - b[1].start);

  let nextStart = 0;
  const sequencedPairs = [];
  for (const [element, span] of sortedByStart) {
    const start = Math.max(nextStart, span.start);
    const pair = [element, { ...span, start }];
    nextStart = start + span.durationMs + delay;
    sequencedPairs.push(pair);
  }

  return sequencedPairs;
}