import { Component, h, Node } from "@lukekaalim/act"
import classes from './index.module.css';

import stepURL from '../assets/icons/step.svg';
import playURL from '../assets/icons/play.svg';
import breakpointActiveURL from '../assets/icons/breakpoint_arrow.svg';
import breakpointInactiveURL from '../assets/icons/breakpoint_arrow_paused.svg';
import reloadURL from '../assets/icons/reload.svg';
import { IconButton } from "./Button";


export type PlaybackBarProps = {
  onStepClick(): void,
  onResumeClick(): void,
  onReloadClick(): void,

  breakpointsEnabled: boolean,
  onToggleBreakpointsEnabled(breakpointsEnabled: boolean): void,

  currentBreakLocation: null | Node,
}

export const PlaybackBar: Component<PlaybackBarProps> = ({
  onStepClick, onReloadClick, onResumeClick,
  
  currentBreakLocation,
  onToggleBreakpointsEnabled,

  breakpointsEnabled
}) => {
  return h('div', { className: classes.playbackBar }, [
    h('menu', {}, [
      h(IconButton, { icon: 'step', onClick: onStepClick }),
      //h(IconButton, { icon: 'step_over_children', onClick() {} }),
      h(IconButton, { icon: 'play', onClick: onResumeClick }),

    ]),
    currentBreakLocation && h('div', { className: classes.breakLocation },
      currentBreakLocation
    )
  ])
}