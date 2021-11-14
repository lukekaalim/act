// @flow strict
/*:: import type { Component, SetValue, ElementNode } from '@lukekaalim/act'; */
import { h, useState, useEffect } from '@lukekaalim/act';

/*::
export type TextInputProps = {
  disabled?: boolean,
  label?: string,
  value?: string,
  onChange?: string => mixed,
  onInput?: string => mixed,
};
*/

export const TextInput/*: Component<TextInputProps>*/ = ({ label = '', value = '', onChange = _ => {}, onInput = _ => {}, disabled = false }) => {
  return [
    h('label', { style: { display: 'flex', flexDirection: 'column', width: '300px', margin: '24px' } }, [
      h('span', {}, label),
      h('input', {
        type: 'text',
        value,
        disabled,
        onInput: e => onInput(e.target.value),
        onChange: e => onChange(e.target.value)
      })
    ]),
  ];
};
/*::
export type NumberInputProps = {
  label?: string,
  value?: number,
  min?: number,
  max?: number,
  step?: number,
  onChange?: number => mixed,
  onInput?: number => mixed,
};
*/


export const NumberInput/*: Component<NumberInputProps>*/ = ({ label = '', min, max, step, value = '', onChange = _ => {}, onInput = _ => {} }) => {
  return [
    h('div', { style: { display: 'flex', flexDirection: 'column', width: '300px', margin: '24px' } }, [
      h('label', { style: { display: 'flex', flexDirection: 'column', width: '150px' } }, [
        h('span', {}, label),
        h('input', {
          type: 'number',
          value,
          min,
          max,
          step,
          onInput: e => onInput(e.target.valueAsNumber),
          onChange: e => onChange(e.target.valueAsNumber)
        })
      ]),
      h('input', {
        style: {},
        type: 'range',
        value,
        min,
        max,
        step,
        onInput: e => onInput(e.target.valueAsNumber),
        onChange: e => onChange(e.target.valueAsNumber)
      })
    ]),
  ];
};

/*::
export type SelectInputProps = {|
  label?: string,
  value?: string,
  values?: string[],
  onChange?: string => mixed,
  onInput?: string => mixed,
  getOptionLabel?: string => string,
|};
*/

export const SelectInput/*: Component<SelectInputProps>*/ = ({
  label = '', 
  value = '',
  values = [],
  getOptionLabel = a => a,
  onChange = _ => {},
  onInput = _ => {}
}) => {
  return [
    h('div', { style: { display: 'flex', flexDirection: 'column', width: '300px', margin: '24px' } }, [
      h('label', { style: { display: 'flex', flexDirection: 'column', width: '150px' } }, [
        h('span', {}, label),
        h('select', {
          value,
          onInput: e => onInput(e.target.value),
          onChange: e => onChange(e.target.value)
        }, [
          values.map(v => h('option', { value: v, selected: value === v }, getOptionLabel(v)))
        ])
      ]),
    ]),
  ];
};

/*::
export type ListInputProps<T> = {
  value: T[],
  onChange: T[] => mixed,

  initialValue: T,

  controlComponent: Component<{ value: T, onValueChange: T => mixed }>,
  previewComponent: Component<{ value: T }>,
};
*/

export const ListInput= /*:: <T>*/({
  value,
  onChange,
  initialValue,
  controlComponent,
  previewComponent
}/*: ListInputProps<T>*/)/*: ElementNode*/ => {
  const [nextValue, setNextValue] = useState(initialValue);
  const onAddClick = () => {
    onChange([...value, nextValue]);
  };
  const onRemoveClick = (index) => {
    setNextValue(value[index]);
    onChange(value.filter((_, i) => i !== index));
  };

  return [
    h('div', { style: { listStyle: 'none', display: 'flex', flexDirection: 'column', margin: '24px', boxShadow: '0 0 25px 0px #00000047' } }, [
      h('div', { style: { display: 'flex', flexDirection: 'row' } }, [
        h('span', { style: { display: 'flex', flexDirection: 'row', overflow: 'auto' } }, h(controlComponent, { value: nextValue, onValueChange: setNextValue })),
        h('span', { style: { flex: 1 } }),
        h('button', { type: 'button', onClick: () => onAddClick(), style: { margin: '16px', padding: '8px', width: '32px', boxSizing: 'border-box' } }, '+')
      ]),
      h('ul', { style: { listStyle: 'none', display: 'flex', flexDirection: 'column', margin: 0, padding: 0 } }, [
        value.map((v, i) =>
          h('li', { style: { display: 'flex', flexDirection: 'row', border: '1px solid black', overflow: 'auto' } }, [
            h(previewComponent, { value: v }),
            h('span', { style: { flex: 1 } }),
            h('button', { onClick: () => onRemoveClick(i), style: { margin: '16px', padding: '8px', width: '32px', boxSizing: 'border-box' } }, '-')
          ]))
      ]),
    ]),
  ];
};

/*::
export type MultiSelectInputProps = {
  options?: $ReadOnlyArray<string>,
  selected?: $ReadOnlyArray<string>,
  label?: string,
  onInput?: $ReadOnlyArray<string> => mixed,
  onChange?: $ReadOnlyArray<string> => mixed,
  getOptionLabel?: string => string,
};
*/
export const MultiSelectInput/*: Component<MultiSelectInputProps>*/ = ({
  options = [],
  selected = [],
  onInput = _ => {},
  onChange = _ => {},
  getOptionLabel = a => a,
  label = '',
}) => {
  const getSelected = e =>
    [...e.target.selectedOptions].map(o => o.value)

  return [
    h('div', { style: { display: 'flex', flexDirection: 'column', width: '300px', margin: '24px' } }, [
      h('label', { style: { display: 'flex', flexDirection: 'column', width: '150px' } }, [
        h('span', {}, label),
        h('select', {
          multiple: true,
          onInput: e => onInput(getSelected(e)),
          onChange: e => onChange(getSelected(e))
        }, [
          options.map(v => h('option', { value: v, selected: selected.includes(v)}, getOptionLabel(v)))
        ])
      ]),
    ]),
  ]
};