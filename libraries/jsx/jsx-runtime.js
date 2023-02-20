import { h } from "@lukekaalim/act";

export const Fragment = ({ children }) => {
  return children;
}

export const jsx = (type, props, key) => {
  return h(type, { ...props, key }, props.children);
};

export const jsxs = (type, props, key) => {
  return h(type, { ...props, key }, props.children);
}