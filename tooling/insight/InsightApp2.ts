import { Component, h, Node, OpaqueID, useEffect, useMemo, useRef, useState } from "@lukekaalim/act";
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
import { CommitPreview } from "./TreeViewer";
import { CommitID } from "@lukekaalim/act-recon";

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

  const breakLocation = useMemo(() => {
    const locations: Node[] = [];

    if (!state.thread)
      return locations;

    if (!state.thread.started) {
      // OR we are doing effects... who is to say
      locations.push('Before Thread Start')
    }
    if (state.thread.started && state.thread.done && !state.thread.submitted) {
      locations.push('Before Thread Submission')
    }

    const nextTask = state.thread.pendingTasks[state.thread.pendingTasks.length - 1];
    if (nextTask) {
      if (state.breakpoints.commits.has(nextTask.id)) {
        const commit = client.cache.getCommit(nextTask.id);
        if (commit) {
          locations.push('Breakpoint', h(CommitPreview, { commit, onClick() { controller.select({ type: 'commit', id: nextTask.id })} }))
        }
      }
    }

    if (locations.length === 0)
      return ['Step']

    return locations;
  }, [state.thread, state.breakpoints])

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