// @flow strict
/*:: import type { Page } from '@lukekaalim/act-rehersal'; */
import { h, useState } from '@lukekaalim/act';
import { Document, TabbedToolbox, Workspace, TextInput, GridBench, NumberInput, BooleanInput } from '@lukekaalim/act-rehersal';

const primitiveText = `
# Input Components

There are three basic components for quickly building tools to change
primitive values such as strings, numbers, and booleans.

 - TextInput
 - NumberInput
 - BooleanInput

${'```'}ts
import {
  TextInput,
  NumberInput,
  BooleanInput
} from '@lukekaalim/act-rehersal';

const MyComponent = () => {
  const [value, setValue] = useState('initial text');

  return [
    h(TextInput, { value, onChange: setValue })
  ]
};
${'```'}
`;

const textInputText = `
### TextInput

${'```'}ts
type TextInputProps = {
  disabled?: boolean,
  label?: string,
  value?: string,
  onChange?: string => mixed,
  onInput?: string => mixed,
};
${'```'}
`
const numberInputText = `
### NumberInput
${'```'}ts
type NumberInputProps = {
  disabled?: boolean,
  label?: string,
  value?: number,
  hasRange?: boolean,
  min?: number,
  max?: number,
  step?: number,
  onChange?: number => mixed,
  onInput?: number => mixed,
};
${'```'}
`
const booleanInputText = `
### BooleanInput
${'```'}ts
type BooleanInputProps = {
  disabled?: boolean,
  label?: string,
  value?: boolean,
  onChange?: boolean => mixed,
  onInput?: boolean => mixed,
};
${'```'}
`

export const primitivesPage/*: Page*/ = {
  link: { href: '/libraries/rehersal/inputs', name: 'Input Components', children: [] },
  content: h(() => {
    const [disabled, setDisabled] = useState({ text: false, number: false, boolean: false })
    const [label, setLabels] = useState({ text: 'text label', number: 'number label', boolean: 'boolean label' })

    const [range, setRange] = useState({ min: 0, max: 100, step: 1, hasRange: true })

    const [stringValue, setStringValue] = useState('initial string value');
    const [numberValue, setNumberValue] = useState(0);
    const [booleanValue, setBooleanValue] = useState(false);

    return h(Workspace, {
      bench: h(GridBench, {}, [
        h('div', { style: { padding: '12px' }}, [
          h(TextInput, {
            label: label.text,
            value: stringValue,
            onChange: setStringValue,
            disabled: disabled.text
          }),
          h(NumberInput, {
            label: label.number,
            min: range.min,
            max: range.max,
            step: range.step,
            value: numberValue,
            onChange: setNumberValue,
            disabled: disabled.number,
            hasRange: range.hasRange,
          }),
          h(BooleanInput, {
            label: label.boolean,
            value: booleanValue,
            onChange: setBooleanValue,
            disabled: disabled.boolean
          }),
        ])
      ]),
      tools: h(TabbedToolbox, { tabs: {
        'Usage': h(Document, { text: primitiveText }),
        'Text': [
          h(Document, { text: textInputText }),
          h(BooleanInput, { label: 'Disabled', value: disabled.text, onChange: text => setDisabled({ ...disabled, text }) }),
          h(TextInput, { label: 'Label', value: label.text, onChange: text => setLabels({ ...label, text })  })
        ],
        'Number': [
          h(Document, { text: numberInputText }),
          h(BooleanInput, { label: 'Disabled', value: disabled.number, onChange: number => setDisabled({ ...disabled, number }) }),
          h(TextInput, { label: 'Label', value: label.number, onChange: number => setLabels({ ...label, number })  }),
          h(NumberInput, { label: 'Min', value: range.min, onChange: min => setRange({ ...range, min }) }),
          h(NumberInput, { label: 'Max', value: range.max, onChange: max => setRange({ ...range, max }) }),
          h(NumberInput, { label: 'Step', value: range.step, onChange: step => setRange({ ...range, step }) }),
          h(BooleanInput, { label: 'HasRange', value: range.hasRange, onChange: hasRange => setRange({ ...range, hasRange }) }),
        ],
        'Boolean': [
          h(Document, { text: booleanInputText }),
          h(BooleanInput, { label: 'Disabled', value: disabled.boolean, onChange: boolean => setDisabled({ ...disabled, boolean }) }),
          h(TextInput, { label: 'Label', value: label.boolean, onChange: boolean => setLabels({ ...label, boolean })  }),
        ],
      }})
    });
  })
}

const text = `
# @lukekaalim/act-rehersal.

A component library for building documentation websites. You may even be using it right now.

This library relies css modules, so it cannot be imported in a regular node context -
you must use a bundler like vite, rollup, webpack, parcel or esbuild.

> More specicially, it uses \`import\` against css files suffixed with the extension ".module.css".

Rehersal provides an overall visual app structure with the Layout components like
_Rehersal_, _Workspace_, _GridMount_ and so on.

It also provides a set
of standard input elements in the Tool components like _TextInput_, _NumberInput_ and so on.

Finally, it also provides a markdown renderer in the _Document_ component, so you can embed
markdown into your documentation.

## Install
${'```'}bash
npm install @lukekaalim/act-rehersal
${'```'}
`;

export const rehersalPage/*: Page*/ = {
  link: { href: '/libraries/rehersal', name: '@lukekaalim/act-rehersal', children: [
    { name: 'exports', children: [primitivesPage.link] }
  ] },
  content: h(Document, { text })
}

export const rehersalPages = [rehersalPage, primitivesPage];