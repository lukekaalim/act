// @flow strict

/*::
export type Easer = number => number;
*/

export const easeInOutCubic/*: Easer*/ = (x) => (
  x < 0.5 ?
    (4 * x * x * x) :
    (1 - Math.pow(-2 * x + 2, 3) / 2)
);

export const easeInOutLinear/*: Easer*/ = x => x;

export const easeInSine/*: Easer*/ = (x) => 1 - Math.cos((x * Math.PI) / 2);