// @flow strict
/*:: import type { JSONValue } from '@lukekaalim/cast'; */
/*:: import type { Component } from '@lukekaalim/act'; */
import { h, useState, useEffect } from '@lukekaalim/act';

import toolStyles from './tools.module.css';

/*::
export type JSONEditorInputProps = {
  label: string,
  value: JSONValue,
  onValueChange: JSONValue => mixed,
};
*/

export const JSONEditorInput/*: Component<JSONEditorInputProps>*/ = ({ value, onValueChange, label }) => {
  const [error, setError] = useState(null);
  const onChange = (e) => {
    try {
      onValueChange(JSON.parse(e.target.value))
      setError(null);
    } catch (error) {
      setError(error);
    }
  };

  return [
    h('label', { className: toolStyles.jsonEditor }, [
      h('span', { key: 'label' }, label),
      h('textarea', {
        key: 'area',
        value: JSON.stringify(value, null, 2),
        onChange,
      }),
      error && h('pre', { key: 'error' }, error.message),
    ])
  ];
};