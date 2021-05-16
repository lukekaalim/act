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
  display: 'flex'
};
const codeBlock = {
  whiteSpace: 'break-spaces',
  color: 'white',
  margin: 0,
  flexGrow: 1,
  fontFamily: 'monospace',
  fontSize: '24px',
};
const codeTextAreaStyle = {
  fontSize: 'inherit',
  fontFamily: 'inherit',
  color: 'inherit',
  height: '135px',
  resize: 'y',
  width: '100%',
  background: 'none',
  border: 'none'
}

export const CodeBlock/*: Component<mixed>*/ = (_, code) => {
  return h('section', { style: codeBlockContainer }, [
    h('code', { style: codeBlock }, code),
  ]);
};

/*::
export type EditableCodeBlockProps = {|
  text: string,
  onTextInput?: string => mixed,
  onTextChange?: string => mixed
|};
*/

export const EditableCodeBlock/*: Component<EditableCodeBlockProps>*/ = ({ onTextInput, onTextChange, text }) => {
  const onInput = e => {
    onTextInput && onTextInput(e.currentTarget.value);
  };
  const onChange = e => {
    onTextChange && onTextChange(e.currentTarget.value);
  }
  return h('section', { style: codeBlockContainer }, [
    h('code', { style: codeBlock }, h('textarea', { onInput, onChange, value: text, style: codeTextAreaStyle })),
  ]);
};