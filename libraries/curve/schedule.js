// @flow strict

import { calculateProgress } from "./progress";

// A type that represents something that spans
// a set of time
/*::
export type TimeSpan = {
  start: DOMHighResTimeStamp,
  durationMs: number,
}
*/

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