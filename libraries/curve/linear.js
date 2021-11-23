// @flow strict
/*:: import type { ProgressAnimator } from "./progress.js"; */

import { lerp } from "./math.js";
import { createProgressAnimator } from "./progress.js";

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
