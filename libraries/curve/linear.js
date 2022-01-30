// @flow strict
/*:: import type { ProgressAnimator } from "./progress.js"; */
/*:: import type { TimeSpan } from "./schedule.js";*/

import { lerp } from "./math.js";
import { createProgressAnimator } from "./progress.js";
import { calculateSpanProgress } from "./schedule.js";

/*::
export type Line = [number, number];

export type LineAnimation = {
  type: 'linear',
  shape: Line,
  span: TimeSpan
}
*/

export const calculateLinePosition = (animation/*: LineAnimation*/, now/*: DOMHighResTimeStamp*/)/*: number*/  => {
  const progress = calculateSpanProgress(animation.span, now);
  return lerp(animation.shape[0], animation.shape[1], progress);
}

/*::
export type LinearAnimator = {
  update: (start: number, to: number, speed: number) => void,
  getValue: (now: number) => number,
  progressAnimator: ProgressAnimator,
};
*/
export const createLinearInterpolator = (initialValue/*: number*/)/*: LinearAnimator*/ => {
  let from = initialValue;
  let to = initialValue;

  const progressAnimator = createProgressAnimator();

  const update = (start, nextTo, speed) => {
    const nextFrom = getValue(start);
    const duration = Math.abs(nextFrom - nextTo) * speed;

    from = nextFrom;
    to = nextTo;

    progressAnimator.update(start, duration);
  };
  const getValue = (now) => {
    const progress = progressAnimator.getProgress(now);
    return lerp(from, to, progress);
  }
  return {
    progressAnimator,
    update,
    getValue,
  };
};
