import { createDocApp, BoneTheme } from '@lukekaalim/grimoire';
import { TypeDocPlugin } from '@lukekaalim/grimoire-ts';
import { createDOMScheduler, createWebNodeBuilder, hs, render } from '@lukekaalim/act-web';
import { Boundary, h, renderNodeType, specialNodeTypes, useEffect, useMemo, useRef, useState } from '@lukekaalim/act';

import rootReadmeMd from '../README.md?parse';
import coreReadmeMd from '../core/README.md?parse';
import reconReadmeMd from '../recon/readme.md?parse';
import reconLifecycleMd from '../recon/docs/lifecycle_of_an_update.md?parse';

import recon from 'typedoc:../recon/mod.ts';
import core from 'typedoc:../core/mod.ts';

import { Reconciler2 } from '@lukekaalim/act-recon';
import { RenderSpace2 } from '@lukekaalim/act-backstage';
import { assertRefs } from '@lukekaalim/act-graphit';

import { JSON, render as renderJSON } from '../renderers/json';

const doc = createDocApp([TypeDocPlugin]);

doc.typedoc.addProjectJSON('@lukekaalim/act-recon', recon);
doc.typedoc.addProjectJSON('@lukekaalim/act', core);

//doc.article.add('readme', rootReadmeMd, '/')
doc.article.addRawRoot('readme', rootReadmeMd, '/')

doc.article.addRawRoot('core.readme', coreReadmeMd, '/Core')
doc.article.addRawRoot('recon.readme', reconReadmeMd, '/Reconciler')
doc.article.addRawRoot('recon.lifecycle', reconLifecycleMd, '/Reconciler/Lifecycle_of_an_Update')

doc.article.add('web.readme', '', '/Renderers/Web')
doc.article.add('three.readme', '', '/Renderers/Three')
doc.article.add('backstage.readme', '', '/Utils/Backstage')
doc.article.add('debug.readme', '', '/Tooling/Debug')
doc.article.add('insight.readme', '', '/Tooling/Insight')
doc.article.add('ext.readme', '', '/Tooling/Dev-Ext')

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


    const MyApp = () => {
      const [name, setName] = useState("World");

      function onInput(event: InputEvent) {
        const newName = (event.target as HTMLInputElement).value;
        setName(oldName => {
          return newName;
        });
      }

      return [
        h('h1', {}, `Hello, ${name}`),
        h('input', { type: 'text', onInput, value: name }),

        useMemo(() => h(Boundary, { fallback: ['Oopsie!', h(StatefulButton)] },
          h('ol', {}, [
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
          ])
        ), [name === 'reverse'])
      ]
    };

    const scheduler = createDOMScheduler();
    const reconciler = new Reconciler2(scheduler);
    
    const space = new RenderSpace2(reconciler.tree, createWebNodeBuilder(div));

    reconciler.bus = {
      render(delta) {
        space.create(delta);
        space.update(delta);
      },
    };

    (window as any).__LUKE_TEST_RECONCILER = reconciler;

    reconciler.mount(h(renderNodeType, { type: 'web:html' }, h('div', {}, h(MyApp))))
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

const r = render(h('div', {}, h(BoneTheme, { doc })), document.body);

(window as any).Reconciler2 = r;
