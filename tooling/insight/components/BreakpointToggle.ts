import { Component, h } from "@lukekaalim/act";
import { IconButton } from "./Button";
import classes from './index.module.css';

export type BreakpointToggleProps = {
  toggled: boolean,
  onToggle(toggled: boolean): void,
}

export const BreakpointToggle: Component<BreakpointToggleProps> = ({ toggled, onToggle }) => {
  return h(IconButton, { icon: toggled ? 'breakpoint' : 'breakpoint_unset', className: classes.breakpointToggle, onClick() {
    onToggle(!toggled)
  }, title: `Toggle Breakpoint` })
};
