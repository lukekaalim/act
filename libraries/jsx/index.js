import { h } from "@lukekaalim/act"

export const createElement = (type, props, children) => {
  return h(type, props, children);
}