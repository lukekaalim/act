import {
  createElement,
  
  useEffect,
  useState,
  useContext,

  useMemo,
  
  createContext,
} from 'react';

const classPropsTransformer = (props) => {
  if (props.class)
    return { ...props, className: props.class };
  return props;
}
const classListPropsTransformer = (props) => {
  if (Array.isArray(props.classList))
    return { ...props, className: classList.filter(Boolean).join(' ') };
  return props;
}

const propsTransformer = (props) => {
  if (!props)
    return props;

  return [
    classPropsTransformer ,
    classListPropsTransformer,
  ].reduce((props, transformer) => transformer(props), props)
};

const createElementWrapper = (element, props, children) => {
  return createElement(element, propsTransformer(props), children)
};

export {
  createElementWrapper as createElement,
  createElementWrapper as h,
  createContext,
  useMemo,
  useContext,
  useState,
  useEffect,
}