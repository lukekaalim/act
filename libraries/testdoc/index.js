// @flow strict

/*::
import type { Component } from "../../library/component";
import type { ElementNode } from "../../library/element";
import type { Assertion } from "@lukekaalim/test/src/assert";
*/
import { assert as assertIs } from '@lukekaalim/test';


const createBrokenCounterService = ()/*: CounterService*/ => {
  const counter = {
    increment: () => { counter.count-- },
    reset: () => { counter.count = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) },
    count: 0,
  };
  return counter;
};
const createWorkingCounterService = ()/*: CounterService*/ => {
  const counter = {
    increment: () => { counter.count++ },
    reset: () => { counter.count = 0 },
    count: 0,
  };
  return counter;
};

/*::
type CounterService = {
  increment: () => void,
  reset: () => void,
  count: number,
};

type TestParameters = {
  count: number,
}

type TestContext = {
  ...TestParameters,
};
*/

const setup = {
  repeat: /*:: <T>*/(count/*: number*/, func/*: (index: number) => T*/)/*: T[]*/ => {
    const arr = []
    for (let i = 0; i < count; i++)
      arr.push(func(i));
    return arr;
  },
};

const md = {}

const assert = {
  is: (description, pass) => ({
    type: 'assert',
    assertion: assertIs(description, Array.isArray(pass) ? pass.map(a => a.assertion) : pass)
  }),
  countEquals: (subject/*: CounterService*/, expectedCount/*: number*/) => {
    return assert.is(
      `internal count (${subject.count}) should equal ${expectedCount}`,
      subject.count === expectedCount,
    );
  },
  list: /*:: <T: DocTestContext>*/(assertions/*: DocTest<T>[]*/) => {
    return {
      assertion: []
    }
  },
  canCountToTarget: (subject/*: CounterService*/, count/*: number*/) => {
    return assert.is(`can count to ${count}`, [
      ...setup.repeat(count, () =>
        (subject.increment(), assert.is('increment()', true))),
      assert.countEquals(subject, count)
    ]);
  },
  canReset: (subject/*: CounterService*/, count/*: number*/) => {
    ;
    subject.reset();
    return assert.is(
      `should reset it's internal count
      to zero when calling the reset()
      function`.replaceAll('\n', '').split(' ').filter(Boolean).join(' '),
      [
        ...setup.repeat(count, () =>
          (subject.increment(), assert.is('increment()', true))),
        assert.is('reset()', (subject.reset(), true)),
        assert.countEquals(subject, 0)
      ],
    );
  },
  block: /*:: <T: DocTestContext>*/(
    defaultParams/*: T["params"]*/,
    runBlock/*: (params: T["params"]) => DocTest<T>*/,
  )/*: DocTest<T>*/ => {
    return {
      type: 'block',
      block: {
        defaultParams,
        runBlock,
      },
    }
  },
  md: /*:: <T: DocTestContext>*/(
    markdown/*: string[]*/, ...tests/*: DocTest<T>[]*/
  )/*: DocTest<T>[]*/ => {
    return markdown.map((text, index)/*: DocTest<T>[]*/ => {
      return [
        { type: 'markdown', text },
        tests[index]
      ]
    }).flat(1).filter(Boolean);
  },
};

export const normalize = async /*::<T:DocTestContext >*/(test/*: DocTest<T>*/)/*: Promise<DocTestAssertion[]>*/ => {
  if (test instanceof Promise)
    return normalize(await test);
  if (Array.isArray(test))
    return (await Promise.all(test.map(normalize))).flat(1);
  if (typeof test === 'function')
    return normalize(await test())
    
  switch (test.type) {
    default:
      return [test];
  }
}

/*::
export type DocTestAssertion =
  | { type: 'assert', assertion: Assertion, depth?: 'all' }
  | { type: 'text', text: string }
  | { type: 'markdown', text: string }
  | { type: 'param', key: string, paramType: 'string' | 'number' | 'boolean' }
  | { type: 'result' }
  | { type: 'block', block: DocTestAssertionBlock<any> }
  | { type: 'output-fragment', key: string, outputs: mixed[] }
  | { type: 'output', key: string }

export type DocTestAssertionBlock<T: DocTestContext> = {
  defaultParams: T["params"],
  runBlock: (params: T["params"]) => DocTest<T>
}

type DocTest<T: DocTestContext> =
  | DocTestAssertion
  | (Promise<DocTest<T>>)
  | (() => DocTest<T>)
  | DocTest<T>[]

type DocTestComponentProps<T: DocTestContext> = {
  params: T["params"],
  output: T["output"],
  onParamsChange: () => T["params"]
}

type DocTestContext = {
  params: any,
};
*/

const text = value => ({ type: 'text', text: value.toString() });
const param = (key, paramType = 'string') => ({ type: 'param', key, paramType });
const output = (key) => ({ type: 'output', key })
const result = ({ type: 'result' })


export const test = ()/*: DocTest<any>*/ => {
  return assert.md`
# My Tests :result

## Testing the Counter Service

The counter service is a object than can \`increment()\`
an internally stored number. You can retrieve the value from
\`count\`. Once you are done, you can reset the internal value
to zero with \`reset()\`.

This package exposes two implementations of this service:
 - Working
 - Broken

The broken variant decrements instead of incrementing, and
the reset function sets the number to a random value.

${() => {
  const working = createWorkingCounterService();
  const broken = createBrokenCounterService();

  return [
    assert.block({ count: 5 }, (params) => assert.md`
### Working version :result

- can keep track of the amount of times \`increment\` is called (${param('count')})
${assert.canCountToTarget(working, params.count)}
- can reset its internal state
${assert.canReset(working, params.count)}

::output
`),
    assert.block({ count: 5 }, (params) => assert.md`
### Broken version :result

- can keep track of the amount of times \`increment\` is called (${param('count')})
${assert.canCountToTarget(broken, params.count)}
- can reset its internal state
${assert.canReset(broken, params.count)}

::output
    `),
  ]
}}
`};
