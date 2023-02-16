// @flow strict
import { assert, colorReporter, exitCodeReporter } from '@lukekaalim/test';

import { testSchedule } from './reconciler.js';
import { testComponentService } from './component.js';
import { testTree } from './tree.js';
import { testCommitService } from './reconciler/commit.test.js';
import { assertTree } from './reconciler/tree.test.js';

export const test = () => {
  //console.clear();
  const assertion = assert('all tests', [
    assert('@lukekaalim/act', true),
    assert('@lukekaalim/act-reconciler', [
      testCommitService(),
      assertTree(),
      //testSchedule(),
      //testComponentService(),
      //testTree()
    ]),
    assert('@lukekaalim/act-dom', true),
  ]);
  console.log(colorReporter(assertion));
  process.exitCode = exitCodeReporter(assertion);
};

test();