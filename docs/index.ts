import { createDocApp, BoneTheme } from '@lukekaalim/grimoire';
import { TypeDocPlugin } from '@lukekaalim/grimoire-ts';
import { createDOMScheduler, createWebNodeBuilder, hs, render } from '@lukekaalim/act-web';
import { h, primitiveNodeTypes, renderNodeType, useEffect, useRef, useState } from '@lukekaalim/act';

import rootReadmeMd from '../README.md?parse';
import coreReadmeMd from '../core/README.md?parse';
import reconReadmeMd from '../recon/readme.md?parse';

import recon from 'typedoc:../recon/mod.ts';
import core from 'typedoc:../core/mod.ts';
import { Reconciler2 } from '@lukekaalim/act-recon';
import { RenderSpace2 } from '@lukekaalim/act-backstage';
import { assertRefs } from '@lukekaalim/act-graphit';

const doc = createDocApp([TypeDocPlugin]);

doc.typedoc.addProjectJSON('@lukekaalim/act-recon', recon);
doc.typedoc.addProjectJSON('@lukekaalim/act', core);

//doc.article.add('readme', rootReadmeMd, '/')
doc.article.addRawRoot('readme', rootReadmeMd, '/')

doc.article.addRawRoot('core.readme', coreReadmeMd, '/Core')
doc.article.addRawRoot('recon.readme', reconReadmeMd, '/Reconciler')

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

      function onClick() {
        setCount(n => n + 1);
      }

      return h('button', { onClick }, `Clicked ${count} times`);
    }


    const MyApp = () => {
      const [name, setName] = useState("World");

      function onInput(event: InputEvent) {
        const newName = (event.target as HTMLInputElement).value;
        setName(oldName => {
          console.log('Set Value', { newName, oldName })
          return newName;
        });
      }

      useEffect(() => {
        console.log('SIDE EFFECT!', name)
        return () => {
          console.log('CLEAN UP EFFECT!', name)
        }
      }, [name])

      return [
        h('h1', {}, `Hello, ${name}`),
        h('input', { type: 'text', onInput, value: name }),

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

const location = new URL(document.location.href);

if (location.searchParams.has('beta')) {
  console.log("LOADING BETA")
  const scheduler = createDOMScheduler();
  const reconciler = new Reconciler2(scheduler);
  const space = new RenderSpace2(reconciler.tree, createWebNodeBuilder(document.body));
  reconciler.bus = space.bus;
  reconciler.mount(h(renderNodeType, { type: 'web:html' }, h('div', {}, h(BoneTheme, { doc }))))
} else {
  console.log("LOADING APP")
  render(h(BoneTheme, { doc }), document.body)
}

//

