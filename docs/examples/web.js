// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */

import { h, useRef, useState } from "@lukekaalim/act";

export const WebClassListDemo/*: Component<>*/ = () => {
  const ref = useRef();
  const [classses, setClasses] = useState([]);
  const onSubmit = (e) => {
    e.preventDefault();
    setClasses(c => [...c, ref.current && ref.current.value]);
  };
  return [
    h('form', { onSubmit }, [
      h('input', { type: 'text', ref }),
      h('button', { type: 'submit' }, 'Add Class')
    ]),
    h('div', { classList: classses }, [
      'This text will be affected by any attached classes.'
    ]),
  ];
}