// @flow strict
import { createContext, h, useContext, useEffect, useState } from '@lukekaalim/act';
import { render } from '@lukekaalim/act-web';
import { MarkdownRenderer } from '@lukekaalim/act-markdown';

import { test, normalize } from './index.js';
import { assert } from '@lukekaalim/test';
import styles from './page.module.css';
import { RehersalApp } from "../rehersal/rehersal2/RehersalApp";
/*::
import type { DocTestAssertion } from "./index.js";
import type { RehersalPage } from "../rehersal/rehersal2/pages";
*/

const parseDocTestToMarkdown = (doc) => {
  switch (doc.type) {
    case 'markdown':
      return doc.text;
    case 'text':
      return doc.text;
    case 'assert':
      return doc.assertion.result ? '✅' : '❌';
    case 'param':
      return `:param{key="${doc.key}" type="${doc.paramType}"}`
    case 'result':
      return `:result`;
    case 'output':
      return '::output';
    case 'type-declaration':
      return `::type{id="${doc.typeDeclaration.id.name}"}`
    default:
      return ''
  }
}

const ParamComponent = ({ node: { attributes: { key, paramType } } }) => {
  const [{ params }, setParams] = useContext(testContext);

  const onInput = (e) => {
    setParams({ ...params, [key]: e.target.valueAsNumber })
  }

  return h('label', {}, [
    h('span', {}, `${key}: `),
    h('input', { type: 'number', style: { width: '4rem' }, value: params[key], onInput })
  ]);
}
const ResultComponent = ({ node }) => {
  const [{ params, pass }, setParams] = useContext(testContext);
  return pass ? '✅' : '❌';
}

const AssertionOutput = ({ assertion, depth = 0 }) => {
  return h('span', {}, [
    Array.from({ length: depth }).map(() => '\t'),
    assertion.title,
    ' ',
    assertion.result ? '✅' : '❌',
    '\n',
    assertion.because.map(assertion => h(AssertionOutput, { assertion, depth: depth + 1 })),
  ]);
}

const OutputComponent = ({ node }) => {
  const [{ params, pass, assertions }, setParams] = useContext(testContext);

  const testAssertions = assertions
    .map(a => a.type === 'assert' ? a.assertion : null)
    .filter(Boolean)

  return [
    h('details', { open: 'open' }, [
      h('summary', {}, 'Output'),
      h('code', { class: styles.output }, [
        h('pre', {  }, [
          testAssertions.map(assertion => h(AssertionOutput, { assertion, depth: 0 }))
        ])
      ])
    ])
  ]
}

const getTypeProperties = (type) => {
  switch (type.type) {
    case 'ObjectTypeAnnotation':
      return new Map(type.properties.map(prop => {
        switch (prop.type) {
          case 'ObjectTypeProperty':
            switch (prop.key.type) {
              case 'Identifier':
                return [prop.key.name, prop.value];
            }
          default:
            return null
        }
      }).filter(Boolean));
  }
}

const RenderType = ({ type }) => {
  switch (type.type) {
    case 'FunctionTypeAnnotation':
      return [
        '(',
        type.params.map(param => h(RenderType, { type: param })).join(','),
        ') => ',
        h(RenderType, { type: type.returnType })
      ];
    case 'VoidTypeAnnotation':
      return 'void';
    case 'NumberTypeAnnotation':
      return 'number';
    case 'ObjectTypeAnnotation':
      return [
        '{\n',
        type.properties.map(prop => {
          return ['  ', prop.key.name, `: `, h(RenderType, { type: prop.value }), '\n']
        }),
        '}'
      ]
  }
  return null;
}

const TypeComponent = ({ node: { attributes: { id }}}) => {
  const [{ types }, setParams] = useContext(testContext);

  const declaration = types.find(t => t.id.name === id);
  if (!declaration)
    return;

  const type = declaration.right;

  console.log(type);

  return h('pre', { class: styles.typeDeclaration }, [
    h(RenderType, { type })
  ]);
}

const directiveComponents = {
  param: ParamComponent,
  result: ResultComponent,
  output: OutputComponent,
  type: TypeComponent,
}
const testContext = createContext([{
  params: {},
  pass: false,
  assertions: [],
  types: []
}, _ => {}]);

const getBlockAssertions = async (block, params)/*: Promise<[DocTestAssertion[], DocTestAssertion[]]>*/ => {
  const directAssertions = await normalize(block.runBlock(params));

  const nestedAssertionPromises/*: Promise<DocTestAssertion[]>[]*/ = directAssertions.map(async assertion => {
    switch (assertion.type) {
      case 'block':
        const [, allChildTests] = await getBlockAssertions(assertion.block, assertion.block.defaultParams);
        return allChildTests;
      default:
        return [assertion];
    }
  });
  const allAssertions = (await Promise.all(nestedAssertionPromises)).flat(1);
  
  return [
    directAssertions,
    allAssertions,
  ];
}

const TestBlock = ({ block }) => {
  const [overrideParams, setParams] = useState({});
  const [assertions, setAssertions] = useState/*:: <null | DocTestAssertion[]>*/(null);
  const [directAssertions, setDirectAssertions] = useState/*:: <null | DocTestAssertion[]>*/(null);

  const params = { ...block.defaultParams, ...overrideParams };

  useEffect(() => {
    getBlockAssertions(block, params)
      .then(([directAssertions, assertions]) => {
        setAssertions(assertions);
        setDirectAssertions(directAssertions)
      })
      .catch(console.error);
    return () => setAssertions(null);
  }, [overrideParams, block])

  if (!assertions || !directAssertions)
    return 'Running Tests';

  const testResult = assert('it works',
    assertions
    .map(r => r.type === 'assert' ? r.assertion : null)
    .filter(Boolean))

  const blockContext = [
    {
      pass: testResult.result,
      params,
      assertions: directAssertions,
      types: assertions
        .map(r => r.type === 'type-declaration' ? r.typeDeclaration : null)
        .filter(Boolean)
    },
    setParams
  ];

  return h(testContext.Provider, { value: blockContext }, [
    h(TestResults, { result: directAssertions })
  ]);
}

const TestResults = ({ result }) => {

  const markdownText = result.map(parseDocTestToMarkdown).join('');
  const blocks = result
    .map(r => r.type === 'block' ? r.block : null)
    .filter(Boolean)

  return [
    h(MarkdownRenderer, { markdownText, directiveComponents }),
    blocks.map(block => h(TestBlock, { block })),
  ]
}

const TestApp = () => {
  const content = h('div', { style: { maxWidth: '60rem', margin: 'auto' }}, [
    h(TestBlock, { block: { defaultParams: {}, runBlock: _ => test() } }),
    h('div', { style: { height: '20rem' } }),
  ]);

  const page = {
    id: 'home',
    title: 'Home',
    path: '/',
    content,
    children: [],
    subsections: [],
  };
  return h(RehersalApp, { pages: [page] })

}

const content = h('div', { style: { maxWidth: '60rem', margin: 'auto' }}, [
  h(TestBlock, { block: { defaultParams: {}, runBlock: _ => test() } }),
  h('div', { style: { height: '20rem' } }),
]);

export const testDocPage/*: RehersalPage*/ = {
  id: 'testpage',
  title: 'Home',
  path: '/testpage',
  content,
  children: [],
  subsections: [],
};

const main = async () => {
  const { body } = document;
  body && render(h(TestApp), body);
};

main();