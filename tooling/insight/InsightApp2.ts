import { Component, h, Node, OpaqueID, useEffect, useRef, useState } from "@lukekaalim/act";
import { CommitReport, DebugClient, DEFAULT_BREAKPOINTS, EffectReport, ThreadReport } from "@lukekaalim/act-debug";

import classes from './InsightApp.module.css';

import { CommitTree } from "./components/CommitTree";
import { EffectTable } from "./components/EffectTable";
import { ControlBar } from "./components/ControlBar";
import { BreakpointPanel } from "./components/BreakpointPanel";
import { InspectorPanel } from "./components/InspectorPanel";
import { PlaybackBar } from "./components/PlaybackBar";
import { SelectionContext, SelectionTarget, useSelectionManager } from "./lib/selection";

export type InsightApp2Props = {
  client: DebugClient;
  onReady(): void;
}

export const InsightApp2: Component<InsightApp2Props> = ({ client, onReady }) => {
  const [commits, setCommits] = useState<CommitReport[]>([]);
  const [effects, setEffects] = useState<EffectReport[]>([]);
  const [thread, setThread] = useState<ThreadReport | null>(null);

  const selection = useSelectionManager();


  const [activeWindow, setActiveWindow] = useState<'commits' | 'effects' | 'history'>('commits');
  const [showBreakpointPanel, setShowBreakpointPanel] = useState(true);
  const [showInspectorPanel, setShowInspectorPanel] = useState(true);

  const [breakpoints, setBreakpoints] = useState(DEFAULT_BREAKPOINTS);
  const [paused, setPaused] = useState(false);


  useEffect(() => {
    setCommits(client.cache.getCommitList());
    setEffects(client.cache.getEffectList());

    const sync = (thread: ThreadReport) => {
      setCommits(client.cache.getCommitList())
      setThread(thread)
    }

    const subs = [
      client.onThreadSubmit((submission) => sync(submission.thread)),
      client.onEffectsFinish(() => {
        setEffects(effects);
      }),
      client.onBreak(() => {
        sync(client.getThread())
        setPaused(true)
      }),
      client.onBreakpointsChange((newBreakpoints) => {
        setBreakpoints(newBreakpoints)
      }),
      client.onFinish(() => {
        setPaused(false)
      })
    ];

    onReady();
    () => {
      subs.forEach(sub => sub.cancel());
    }
  }, [client]);

  const providers = (child: Node) => {
    return h(SelectionContext.Provider, { value: selection },
      child
    )
  }

  return providers(h('div', { className: classes.insightRoot }, [
    h(ControlBar, {
      showBreakpointPanel,
      showInspectorPanel,
      activeWindow,

      onChangeWindow: setActiveWindow,
      onShowInspectorPanelChange: setShowInspectorPanel,
      onShowBreakpointPanelChange: setShowBreakpointPanel,
    }),
    h('div', { className: classes.insightContent }, [
      showBreakpointPanel && h(BreakpointPanel, {
        onBreakpointsChange: (breakpoints) => client.setBreakpoints(breakpoints),
        breakpoints,
        paused,
        cache: client.cache,

        onResumePressed: () => client.resume(),
        onStepPressed: () => client.step(),
      }),
      h('div', { className: classes.activeWindow }, [
        activeWindow === 'commits' && h(CommitTree, { commits, client, thread }),
        activeWindow === 'effects' && h(EffectTable, { cache: client.cache, effects }),
      ]),
      showInspectorPanel && h(InspectorPanel, { client, breakpoints }),
    ]),
    paused && h(PlaybackBar, {
      onResumeClick: () => client.resume(),
      onStepClick: () => client.step(),
      onReloadClick: () => console.warn('UNIMPLEMETED'),
      onToggleBreakpointsEnabled: () => console.warn("UNIMPLEMNTED"),
      breakpointsEnabled: true,
      currentBreakLocation: null
    }),
  ]))
};