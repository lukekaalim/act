import {
  createElement,
  
  useEffect,
  useState,
  useContext,

  useMemo,
  useRef,
  
  createContext,
} from 'react';

const classPropsTransformer = (props) => {
  const { class: classProp, ...otherProps } = props;
  if (props.hasOwnProperty('class'))
    return { ...otherProps, className: classProp };
  return props;
}
const classListPropsTransformer = (props) => {
  const { classList, ...otherProps } = props;
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
  if (Array.isArray(children)) {
    return createElement(element, propsTransformer(props), ...children)
  }
  return createElement(element, propsTransformer(props), children)
};

export {
  createElementWrapper as createElement,
  createElementWrapper as h,
  createContext,
  useMemo,
  useRef,
  useContext,
  useState,
  useEffect,
}