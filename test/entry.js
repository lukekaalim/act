// @flow strict
import { assert, colorReporter, exitCodeReporter } from '@lukekaalim/test';

export const test = () => {
  const assertion = assert('Act Monorepo Tests', [
    assert('@lukekaalim/act', true),
    assert('@lukekaalim/act-reconciler', true),
    assert('@lukekaalim/act-dom', true),
  ]);
  console.log(colorReporter(assertion));
  process.exitCode = exitCodeReporter(assertion);
};

test();