import {
  createElement,
  
  useEffect,
  useState,
  useContext,

  useMemo,
  
  createContext,
} from 'react';

const classPropsTransformer = (props) => {
  const { class: classProps, otherProps } = props;
  if (classProps)
    return { ...otherProps, className: classProps };
  return props;
}
const classListPropsTransformer = (props) => {
  const { classList, otherProps } = props;
  if (Array.isArray(classList))
    return { ...otherProps, className: classList.filter(Boolean).join(' ') };
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