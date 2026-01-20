import { createDocApp, BoneTheme } from '@lukekaalim/grimoire';
import { TypeDocPlugin } from '@lukekaalim/grimoire-ts';
import { Root } from 'hast';
import { toHtml } from 'hast-util-to-html';

import { createDOMScheduler, createHASTBuilder, createWebNodeBuilder, hs, HTML, render } from '@lukekaalim/act-web';
import { Boundary, Component, h, renderNodeType, specialNodeTypes, useEffect, useMemo, useRef, useState } from '@lukekaalim/act';

import rootReadmeMd from '../README.md?parse';
import coreReadmeMd from '../core/README.md?parse';

import reconReadmeMd from '../recon/readme.md?parse';
import reconLifecycleMd from '../recon/docs/lifecycle_of_an_update.md?parse';

import blogFunOptimization from './blogs/fun_optimization.md?parse';


import recon from 'typedoc:../recon/mod.ts';
import core from 'typedoc:../core/mod.ts';

import rendererWebMd from '../renderers/web/README.md?parse';
import rendererWeb from 'typedoc:../renderers/web/mod.ts';

import rendererBackstageMd from '../renderers/backstage/README.md?parse';
import rendererBackstage from 'typedoc:../renderers/backstage/mod.ts';

import { Reconciler2 } from '@lukekaalim/act-recon';
import { RenderSpace2 } from '@lukekaalim/act-backstage';
import { assertRefs } from '@lukekaalim/act-graphit';

import { CommitPreview, renderDEV, TreeViewer } from '@lukekaalim/act-insight';

const doc = createDocApp([TypeDocPlugin]);

doc.typedoc.addProjectJSON('@lukekaalim/act-recon', recon);
doc.typedoc.addProjectJSON('@lukekaalim/act', core);

doc.typedoc.addProjectJSON('@lukekaalim/act-web', rendererWeb);
doc.typedoc.addProjectJSON('@lukekaalim/act-backstage', rendererBackstage);

//doc.article.add('readme', rootReadmeMd, '/')
doc.article.addRawRoot('readme', rootReadmeMd, '/')

doc.article.addRawRoot('core.readme', coreReadmeMd, '/Core')
doc.article.addRawRoot('recon.readme', reconReadmeMd, '/Reconciler')
doc.article.addRawRoot('web.readme', rendererWebMd, '/Renderers/Web')
doc.article.addRawRoot('backstage.readme', rendererBackstageMd, '/Utils/Backstage')



doc.article.add('three.readme', '', '/Renderers/Three')
doc.article.add('debug.readme', '', '/Tooling/Debug')
doc.article.add('insight.readme', '', '/Tooling/Insight')
doc.article.add('ext.readme', '', '/Tooling/Dev-Ext')

doc.article.addRawRoot('guides.lifecycle', reconLifecycleMd, '/Guides/Lifecycle_of_an_Update')
doc.article.addRawRoot('blog.funOptimization', blogFunOptimization, '/Devblog/Searching_The_Depths')

doc.demos.add('recon.experiment', () => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const { div } = assertRefs({ div: ref })

    const StatefulButton = () => {
      const [count, setCount] = useState(0);
      const [error, setError] = useState<null | Error>(null);

      if (error)
        throw error;

      function onClick() {
        setCount(n => n + 1);
      }

      return [
        h('button', { onClick }, `Clicked ${count} times`),
        h('button', { onClick: () => setError(new Error(`Kaboom!`)) }, `Throw!`),
        h('button', { onClick: () => setError(null) }, `Clear!`),
        h('span', { style: { }}, crypto.randomUUID())
      ];
    }

    const ErrorDisplay: Component<{ errors: Error[], onClear: () => void }> = ({ errors, onClear }) => {
      return [h('button', { onClick: onClear }, 'Clear'), h('ol', {}, errors.map(error => {
        return h('li', {}, h('pre', {}, [
          error.message,
        ]))
      }))]
    }


    const MyApp = () => {
      const [name, setName] = useState("World");
      const [errors, setErrors] = useState<Error[]>([])

      function onInput(event: InputEvent) {
        const newName = (event.target as HTMLInputElement).value;
        setName(oldName => {
          return newName;
        });
      }

      function onClear() {
        console.log('Clear')
      }
      function onThrow(_: unknown, allValues: unknown[]) {
        //setErrors(allValues.filter(x => x instanceof Error))
        console.log('Throw', allValues)
      }

      console.log(errors.length === 0)

      return [
        h('h1', {}, `Hello, ${name}`),
        h('input', { type: 'text', onInput, value: name }),
        errors.length > 0 && [
          h(ErrorDisplay, { errors, onClear: () => setErrors([]) })
        ],
        useMemo(() => h(Boundary, { fallback: h('div', {}, ['Oopsie!', h(StatefulButton)]), onClear, onThrow },
          [h('ol', {}, [
            name === 'reverse'
              ? [
                h('li', { key: 'c' }, h(StatefulButton, {  })),
                h('li', { key: 'b' }, h(StatefulButton, {  })),
                h('li', { key: 'a' }, h(StatefulButton, {  })),
              ]
              : [
                h('li', { key: 'a' }, h(StatefulButton, {  })),
                h('li', { key: 'b' }, h(StatefulButton, {  })),
                h('li', { key: 'c' }, h(StatefulButton, {  })),
              ]
          ])]
        ), [name === 'reverse', errors])
      ]
    };

    
    render(h('div', {}, h(MyApp)), div);
    //renderDEV(h(HTML, {}, h('div', {}, h(MyApp))), [createWebNodeBuilder(div)])
  }, [])

  return h('div', { ref })
});

doc.demos.add('core.rendering', () => {
  const onClick = () => {
    alert("Nothing");
  }

  return [
    h('h1', {}, `This is my application!`),
    h('button', { onClick } , 'this button shows you nothing')
  ]
})

const app =  h('div', {}, h(BoneTheme, { doc }))

if (true)
  renderDEV(h(HTML, {}, app), [createWebNodeBuilder(document.body)])
else
  render(app, document.body);