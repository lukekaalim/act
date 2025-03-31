import { createId, h } from "@lukekaalim/act";
import { createWebSpace, HTML } from "./space";
import { createRenderFunction, RenderFunction } from "@lukekaalim/act-backstage";
import { Scheduler } from "@lukekaalim/act-recon";

export const createDOMScheduler = (): Scheduler => {
  const workMap = new Map();
  let id: number | null = null;
  const work = () => {
    id = null;
    for (const [,callback] of workMap)
      callback();

    workMap.clear();
  };
  return {
    requestWork(callback) {
      const workId = createId<'WorkID'>();
      workMap.set(workId, callback);
      if (!id)
        id = setTimeout(work, 1) as any;
      return workId;
    },
    cancelWork(workId) {
      workMap.delete(workId);
    },
  }
}


export const render: RenderFunction<HTMLElement> = (node, root) => 
  createRenderFunction(createDOMScheduler(), createWebSpace)(h(HTML, {}, node), root);
