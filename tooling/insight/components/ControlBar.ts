import { Component, h } from "@lukekaalim/act";

import classes from './index.module.css';
import breakpointPanelURL from '../assets/icons/breakpoint_panel.svg';
import inspectorPanelURL from '../assets/icons/inspector_panel.svg';


import commitTreeURL from '../assets/icons/commit_tree.svg';
import sideEffectsURL from '../assets/icons/side_effects.svg';
import historyListURL from '../assets/icons/history_list.svg';

let breakpointPanelURL2 = new URL(breakpointPanelURL, document.location.href);

export type ControlBarProps = {
  showBreakpointPanel: boolean,
  showInspectorPanel: boolean,

  activeWindow: 'commits' | 'effects' | 'history',
  onChangeWindow(window: 'commits' | 'effects' | 'history'): void,
  
  onShowBreakpointPanelChange(show: boolean): void,
  onShowInspectorPanelChange(show: boolean): void,
};

export const ControlBar: Component<ControlBarProps> = ({
  showBreakpointPanel,
  showInspectorPanel,
  activeWindow,

  onChangeWindow,
  onShowInspectorPanelChange,
  onShowBreakpointPanelChange,
}) => {
  return h('div', { className: classes.controlBar }, [
    h('button', {
      classList: [classes.toggle, !showBreakpointPanel && classes.off],
      onClick: () => onShowBreakpointPanelChange(!showBreakpointPanel)
    }, h('img', { height: '22', src: breakpointPanelURL2, title: "Toggle Breakpoints" })),

    h('div', { className: classes.windowToggle }, [
      h('button', { className: classes.toggle, disabled: activeWindow === 'commits', onClick: () => onChangeWindow('commits') }, 
        h('img', { height: '22', src: commitTreeURL, title: "Commits" })),
      h('button', { className: classes.toggle, disabled: activeWindow === 'effects', onClick: () => onChangeWindow('effects') },
        h('img', { height: '22', src: sideEffectsURL, title: "Effects" })),
      h('button', { className: classes.toggle, disabled: activeWindow === 'history', onClick: () => onChangeWindow('history') },
        h('img', { height: '22', src: historyListURL, title: "History" })),
    ]),

    h('button', {
      classList: [classes.toggle, !showInspectorPanel && classes.off],
      onClick: () => onShowInspectorPanelChange(!showInspectorPanel)
    }, h('img', { height: '22', src: inspectorPanelURL, title: "Toggle Inspector" })),
  ])
};