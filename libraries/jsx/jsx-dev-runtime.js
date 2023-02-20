import { h } from "@lukekaalim/act";

export const Fragment = ({ children }) => {
  return children;
}

export const jsxDEV = (type, props, key) => {
  return h(type, { ...props, key }, props.children);
};
