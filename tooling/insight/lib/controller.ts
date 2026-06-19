import { Breakpoints, CommitReport, DebugClient, DEFAULT_BREAKPOINTS, EffectCleanupReport, EffectReport, ThreadReport } from "@lukekaalim/act-debug";
import { CommitListEntry, createCommitList } from "./list";
import { SelectionManager, SelectionTarget, useSelectionManager } from "./selection";
import { CommitID } from "@lukekaalim/act-recon";
import { createContext, useEffect, useMemo, useState } from "@lukekaalim/act";

export type InsightWindow =
  | 'commits'
  | 'effects'
  | 'history'
  | 'performance'

export type Filters = {
  collapsed: Set<CommitID>,

  skipComponents: boolean,
  skipPrimitives: boolean,
  skipSpecial: boolean,
  skipNamed: boolean,
}

const DEFAULT_FILTERS: Filters = {
  collapsed: new Set(),

  skipComponents: false,
  skipPrimitives: false,
  skipSpecial: false,
  skipNamed: false,
}

export const toggleCollapsedCommit = (filters: Filters, collapseToggledCommit: CommitID) => {
  const isCollapsed = filters.collapsed.has(collapseToggledCommit);

  const nextFilters = { ...filters, collapsed: new Set(filters.collapsed) };
  if (isCollapsed) {
    nextFilters.collapsed.delete(collapseToggledCommit);
  } else {
    nextFilters.collapsed.add(collapseToggledCommit);
  }
  return nextFilters;
}

export type InsightState = {
  paused: boolean,

  breakpoints: Breakpoints,
  thread: ThreadReport | null,
  filters: Filters,
  commits: CommitListEntry[],
  effects: EffectReport[],
  cleanups: EffectCleanupReport[],
  client: DebugClient,

  selection: SelectionManager,
  
  activeWindow: InsightWindow,

  panels: {
    inspector: boolean,
    breakpoints: boolean,
  },
  commitScrollTarget: CommitID | null,
}

export type InsightController = {
  select(newTarget: SelectionTarget): void,
  focus(focusTarget: SelectionTarget): void,

  changeWindow(nextWindow: InsightWindow): void,
  changeFilters(newFilters: Filters): void,

  setShowInspectorPanel(showPanel: boolean): void,
  setShowBreakpointPanel(showPanel: boolean): void,

  onConsumeCommitScrollTarget(): void,
};

export const useInsightManager = (client: DebugClient) => {
  const [commits, setCommits] = useState<CommitListEntry[]>([]);
  const [effects, setEffects] = useState<EffectReport[]>([]);
  const [cleanups, setCleanups] = useState<EffectCleanupReport[]>([]);
  const [thread, setThread] = useState<ThreadReport | null>(null);

  const selection = useSelectionManager();

  const [activeWindow, setActiveWindow] = useState<InsightWindow>('commits');

  const [showBreakpointPanel, setShowBreakpointPanel] = useState(true);
  const [showInspectorPanel, setShowInspectorPanel] = useState(true);

  const [breakpoints, setBreakpoints] = useState(DEFAULT_BREAKPOINTS);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [paused, setPaused] = useState(false);

  const [commitScrollTarget, setScrollTarget] = useState<CommitID | null>(null);

  useEffect(() => {
    const skip = (c: CommitReport) => {
      if (filters.skipPrimitives && (c.element.type.type === 'primitive' || c.element.type.type === 'array'))
        return true;
      if (filters.skipComponents && c.element.type.type === 'component')
        return true;
      if (filters.skipNamed && (c.element.type.type === 'string' || c.element.type.type === 'symbol'))
        return true;
      if (filters.skipSpecial && (c.element.type.type === 'special' || c.element.type.type === 'render'))
        return true;

      //return c.element.type.type !== 'component'
      //return c.element.type.type !== 'string' && c.element.type.type !== 'primitive';
      return false;
    }
    const hide = (c: CommitReport) => {
      if (c.parent && filters.collapsed.has(c.parent)) {
        return true;
      }
      return false;
      //return c.element.type.type === 'primitive';
    }
    setCommits(createCommitList(client.cache, { skip, hide }));
    setThread(thread)
    setEffects([]);
    setCleanups(client.cache.getAllCleanups());

    const subs = [
      client.onThreadSubmit((submission) => {
        setCommits(createCommitList(client.cache, { skip, hide }));
        setThread(submission.thread)
        setEffects(submission.delta.effects);
      }),
      client.onEffectsFinish((effects) => {
        // Update our cleanups
        setCleanups([...client.cache.liveCleanups.values()]);
      }),
      client.onBreak(([submission, effects]) => {
        if (submission) {
          setCommits(createCommitList(client.cache, { skip, hide }));
          setThread(submission.thread)
          setEffects(submission.delta.effects);
          
          const pendingTask = submission.thread.pendingTasks[submission.thread.pendingTasks.length - 1];
          if (pendingTask)
            controller.focus({ type: 'commit', id: pendingTask.id });
        }
        if (effects) {
          // Update our cleanups
          setCleanups([...client.cache.liveCleanups.values()]);
        }
        
        setPaused(true)
      }),
      client.onBreakpointsChange((newBreakpoints) => {
        setBreakpoints(newBreakpoints)
      }),
      client.onFinish(() => {
        setPaused(false)
      })
    ];
    () => {
      subs.forEach(sub => sub.cancel());
    }
  }, [client, filters]);

  const state: InsightState = {
    paused,
    thread,
    breakpoints,
    selection,
    activeWindow,
    
    client,
    commits,
    effects,
    cleanups,

    filters,
    panels: {
      breakpoints: showBreakpointPanel,
      inspector: showInspectorPanel,
    },
    commitScrollTarget
  };
  
  // KLUDGE
  useEffect(() => {
    if (selection.target.type === 'commit')
      controller.focus(selection.target);
  }, [selection.target])

  const controller: InsightController = useMemo(() => ({
    setShowBreakpointPanel,
    setShowInspectorPanel,
    select(newTarget) {
      selection.select(newTarget)
    },
    focus(focusTarget) {
      if (focusTarget.type === 'commit')
        setScrollTarget(focusTarget.id);
    },
    onConsumeCommitScrollTarget() {
      setScrollTarget(null);
    },
    changeFilters(newFilters) {
      setFilters(newFilters);
    },
    changeWindow(nextWindow) {
      setActiveWindow(nextWindow);
    },
  }), [client]);

  return [state, controller] as const;
};

export const InsightControllerContext = createContext(null);