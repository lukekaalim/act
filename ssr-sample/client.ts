import { createWebNodeBuilder, rehydrate, SSRPayload } from '@lukekaalim/act-web';
import { App, HydrateMap } from './app';
import { createDebugPopup } from '@lukekaalim/act-insight';
import { DebugReconciler } from '@lukekaalim/act-debug';
import { RenderSpace2 } from '@lukekaalim/act-backstage';


const main = async () => {
  const dataElement = document.getElementById('SSR-DATA')
  const rootElement = document.getElementById('SSR-ROOT')
  if (!dataElement || !rootElement)
    return;

  const payload = JSON.parse(dataElement.innerText) as SSRPayload;

  const reconciler = new DebugReconciler();
  const space = new RenderSpace2(reconciler.tree, createWebNodeBuilder(rootElement))

  await createDebugPopup(reconciler)

  rehydrate(HydrateMap, reconciler, space, payload);

  reconciler.debugBus.externalUpdate();
}

main();