import {
  createElement,
  
  useEffect,
  useState,
  useContext,

  useMemo,
  
  createContext,
} from 'react';

const propsTransformer = (props) => {
  if (!props)
    return props;
  if (props.class)
    return { ...props, className: props.class };
  return props;
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