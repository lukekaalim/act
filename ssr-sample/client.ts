import { createDOMScheduler, createWebNodeBuilder, primitiveToSymbolMap } from '@lukekaalim/act-web';
import { App } from './app';
import { Commit2, CommitID, CommitRef2, Reconciler2 } from '@lukekaalim/act-recon';
import { DehydratedBundle, DehydratedCommit } from '@lukekaalim/act-web/node';
import { Element, ElementType, h, primitiveNodeTypes, specialNodeTypes, useMemo, useState } from '@lukekaalim/act';
import { createDebugPopup } from '@lukekaalim/act-insight';
import { DebugReconciler } from '@lukekaalim/act-debug';
import { RenderSpace2 } from '@lukekaalim/act-backstage';


const main = () => {
  const commitDataElement = document.getElementById('COMMITS')
  const attachElement = document.getElementById('ATTACH')
  const stateElement = document.getElementById('STATE')
  if (!commitDataElement || !attachElement || !stateElement)
    return;

  const { commits, mountId } = JSON.parse(commitDataElement.innerText) as DehydratedBundle;

  const reconciler = new DebugReconciler();
  
  const space = new RenderSpace2(reconciler.tree, createWebNodeBuilder(attachElement))

  createDebugPopup(reconciler)

  const refs = new Map<CommitID, CommitRef2>();
  const elements = new Map<CommitID, Element>();
  const roots: CommitRef2[] = [];

  const state = JSON.parse(stateElement.textContent);

  const useSSRState = (key, _) => {
    const [value, setValue] = useState(state[key]);

    return [value, setValue];
  }
  const useSSREffect = () => {

  }

  for (const commit of commits) {
    refs.set(commit.id, CommitRef2.rehydrate(commit.id, commit.distance));
    
    if (mountId === commit.id)
      elements.set(commit.id, h(App, { useSSREffect, useSSRState, done() { console.log('All done!') } }));
    else {
      const elementType = (primitiveToSymbolMap[commit.elementType]
        || commit.elementType
        || specialNodeTypes.placeholder) as string | symbol

      const props = Object.fromEntries(commit.props);
      console.log(elementType, commit.props);

      elements.set(commit.id, h(elementType, props));
    }
  }
  for (const dehydratedCommit of commits) {
    const ref = refs.get(dehydratedCommit.id) as CommitRef2;
    ref.parent = dehydratedCommit.parent && refs.get(dehydratedCommit.parent) || null;

    const children = dehydratedCommit.children.map(c => refs.get(c)).filter(x => !!x);
    const element = elements.get(dehydratedCommit.id) as Element;
    element.children = children.map(c => elements.get(c.id) as Element)

    if (!ref.parent) {
      roots.push(ref);
    }

    const commit = reconciler.pools.commit.acquire(ref,
      element,
      children
    );

    const node = document.querySelector(`[data-commit-id="${commit.ref.id}"]`)
    if (node instanceof HTMLElement) {
      space.nodeByCommit.set(commit.ref.id, node);
      space.commitByNode.set(node, commit);
    }
    if (commit.element.type === specialNodeTypes.render) {
      space.roots.set(commit.ref.id, commit);
    }

    reconciler.tree.commits.set(commit.ref.id, commit)
  }
  
  const mountRef = refs.get(mountId) as CommitRef2;

  reconciler.bus.render = (delta) => {
    console.log({ delta })
    space.bus.render(delta)
  };

  console.log('=============ITS MY RENDER=============')
  reconciler.render(mountRef);
  
}

main();