import { createRenderFunction } from "@lukekaalim/act-backstage";
import { createDOMScheduler } from '@lukekaalim/act-web';
import { createThreeWebSpace } from "./space";

export const render = createRenderFunction<HTMLElement>(
  createDOMScheduler(),
  createThreeWebSpace
);
