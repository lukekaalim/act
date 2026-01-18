import { MagicError } from "@lukekaalim/act";

/**
 * ChangeReport
 */
export class ChangeReport2 {
  /**
   * The indices of elements that were removed
   */
  removed: number[] = [];
  /**
   * The indices of the previous position that an element
   * was in, or -1 if it didn't exist in the "prevs" array.
   */
  transform: number[] = [];

  /**
   * A (hopefully) faster single-entry report generator
   * @param prev 
   * @param next 
   * @param equalityTest 
   * @returns 
   */
  static generateSingles<Prev, Next>(prev: Prev, next: Next, equalityTest: ChangeEqualityTest<Prev, Next>) {
    const report = new ChangeReport2();

    if (equalityTest(prev, next, 0, 0)) {
      report.transform.push(0);
    } else {
      report.transform.push(-1);
      report.removed.push(0);
    }

    return report;
  }

  static generate<Prev, Next>(prevs: Prev[], nexts: Next[], equalityTest: ChangeEqualityTest<Prev, Next>) {
    if (prevs.length === 0 && nexts.length === 0)
      return ChangeReport2.generateSingles(prevs[0], nexts[0], equalityTest);

    const report = new ChangeReport2();
    const visited = new Set();

    for (let nextIndex = 0; nextIndex < nexts.length; nextIndex++) {
      const next = nexts[nextIndex];
      const prevIndex = prevs.findIndex((prev, prevIndex) => equalityTest(prev, next, prevIndex, nextIndex));
      report.transform.push(prevIndex);
      if (prevIndex !== -1)
        visited.add(prevIndex);
    }
    for (let i = 0; i < prevs.length; i++) {
      if (!visited.has(i))
        report.removed.push(i);
    }

    return report;
  }
}

export type ChangeEqualityTest<Prev, Next> = (prev: Prev, next: Next, prevIndex: number, nextIndex: number) => boolean;

export const first = <X, Y>(array: ReadonlyArray<X>, func: (value: X, index: number) => Y | null): Y | null => {
  for (let i = 0; i < array.length; i++) {
    const value = array[i];
    const result = func(value, i);
    if (result !== null)
      return result;
  }
  return null;
}

export const last = <X, Y extends {}>(array: ReadonlyArray<X>, func: (value: X, index: number) => Y | null | false | undefined | 0): Y | null => {
  for (let i = array.length - 1; i > 0; i--) {
    const value = array[i];
    const result = func(value, i);
    if (result)
      return result;
  }
  return null;
}
