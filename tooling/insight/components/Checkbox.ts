import { Component, h, Node } from "@lukekaalim/act"

export type CheckboxProps = {
  label: Node,
  checked: boolean,
  onCheckedChange(nextChecked: boolean): void,
}

export const Checkbox: Component<CheckboxProps> = ({ label, checked, onCheckedChange }) => {
  return h('label', {}, [
    h('input', { type: 'checkbox', checked, onInput(e: InputEvent) {
      const input = (e.target) as HTMLInputElement;
      onCheckedChange(input.checked);
    } }),
    h('span', {}, label),
  ]);
}