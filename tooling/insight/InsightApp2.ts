import { Component, h, Node, OpaqueID, useEffect, useMemo, useRef, useState } from "@lukekaalim/act";
import { CommitReport, DebugClient } from "@lukekaalim/act-debug";

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
import { CommitPreview } from "./TreeViewer";
import { CommitID } from "@lukekaalim/act-recon";
import { EffectButton } from "./components/Button";

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

  const breakLocation = state.breakPosition && h('div', {}, [
    state.breakPosition.commit && h('div', {}, h(CommitPreview, { commit: state.client.cache.getCommitOrThrow(state.breakPosition.commit ) })),
    state.breakPosition.effect && h('div', {}, h(EffectButton, { onClick() {}, effectId: state.breakPosition.effect })),
    state.breakPosition.named && h('div', {}, `@${state.breakPosition.named}`),
  ])

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
        controller,
        onBreakpointsChange: (breakpoints) => client.setBreakpoints(breakpoints),
        breakpoints: state.breakpoints,
        paused: state.paused,
        cache: client.cache,
        state,

        onResumePressed: () => client.resume(),
        onStepPressed: () => client.step(),
      }),
      h('div', { className: classes.activeWindow }, [
        state.activeWindow === 'commits' && h(CommitTree, { commits: state.commits, client, thread: state.thread, state, controller,
          scrollTarget: state.commitScrollTarget,
          onScrollTargetComplete: controller.onConsumeCommitScrollTarget }),
        state.activeWindow === 'effects' && h(EffectTable, { state, controller }),
      ]),
      state.panels.inspector && h(InspectorPanel, { client, breakpoints: state.breakpoints, state, controller }),
    ]),
    state.paused && h(PlaybackBar, {
      onResumeClick: () => client.resume(),
      onStepClick: () => client.step(),
      onReloadClick: () => console.warn('UNIMPLEMETED'),
      onToggleBreakpointsEnabled: () => console.warn("UNIMPLEMNTED"),
      breakpointsEnabled: true,
      currentBreakLocation: breakLocation
    }),
  ]))
};