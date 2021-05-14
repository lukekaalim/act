// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import { h } from '@lukekaalim/act/html';

const codeBlockContainer = {
  borderRadius: '4px',
  boxShadow: 'inset #d7d7d77a 0px 0px 30px 0px',
  boxSizing: 'border-box',
  padding: '24px',
  backgroundColor: '#714e9b',
  margin: '12px 0 12px 0',
};
const codeBlock = {
  whiteSpace: 'break-spaces',
  color: 'white',
  margin: 0,
  fontFamily: 'monospace'
};

export const CodeBlock/*: Component<mixed>*/ = (_, code) => {
  return h('section', { style: codeBlockContainer }, [
    h('code', { style: codeBlock }, code),
  ]);
};