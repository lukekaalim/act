import { Component, h, Node, OpaqueID, useEffect, useRef, useState } from "@lukekaalim/act";
import { CommitReport, DebugClient, DEFAULT_BREAKPOINTS, EffectReport, FlattenedCommitReport, ThreadReport } from "@lukekaalim/act-debug";

import classes from './InsightApp.module.css';

import { CommitTree } from "./components/CommitTree";
import { EffectTable } from "./components/EffectTable";
import { ControlBar } from "./components/ControlBar";
import { BreakpointPanel } from "./components/BreakpointPanel";
import { InspectorPanel } from "./components/InspectorPanel";
import { PlaybackBar } from "./components/PlaybackBar";
import { SelectionContext, SelectionTarget, useSelectionManager } from "./lib/selection";
import { CommitListEntry, createCommitList } from "./lib/list";
import { useInsightManager } from "./lib/controller";

export type InsightApp2Props = {
  client: DebugClient;
  onReady(): void;
}

export const InsightApp2: Component<InsightApp2Props> = ({ client, onReady }) => {
  const [state, controller] = useInsightManager(client);

  useEffect(() => {
    onReady();
  }, [])

  const providers = (child: Node) => {
    return h(SelectionContext.Provider, { value: state.selection },
      child
    )
  }

  return providers(h('div', { className: classes.insightRoot }, [
    h(ControlBar, {
      showBreakpointPanel: state.panels.breakpoints,
      showInspectorPanel: state.panels.inspector,
      activeWindow: state.activeWindow,

      onChangeWindow: controller.changeWindow,
      onShowInspectorPanelChange: controller.setShowInspectorPanel,
      onShowBreakpointPanelChange: controller.setShowBreakpointPanel,
    }),
    h('div', { className: classes.insightContent }, [
      state.panels.breakpoints && h(BreakpointPanel, {
        onBreakpointsChange: (breakpoints) => client.setBreakpoints(breakpoints),
        breakpoints: state.breakpoints,
        paused: state.paused,
        cache: client.cache,

        onResumePressed: () => client.resume(),
        onStepPressed: () => client.step(),
      }),
      h('div', { className: classes.activeWindow }, [
        state.activeWindow === 'commits' && h(CommitTree, { commits: state.commits, client, thread: state.thread, state, controller }),
        state.activeWindow === 'effects' && h(EffectTable, { cache: client.cache, effects: state.effects }),
      ]),
      state.panels.inspector && h(InspectorPanel, { client, breakpoints: state.breakpoints, state, controller }),
    ]),
    state.paused && h(PlaybackBar, {
      onResumeClick: () => client.resume(),
      onStepClick: () => client.step(),
      onReloadClick: () => console.warn('UNIMPLEMETED'),
      onToggleBreakpointsEnabled: () => console.warn("UNIMPLEMNTED"),
      breakpointsEnabled: true,
      currentBreakLocation: null
    }),
  ]))
};