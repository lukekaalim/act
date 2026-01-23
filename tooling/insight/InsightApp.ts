import { Component, h, useEffect, useMemo, useRef, useState } from '@lukekaalim/act';
import { CommitDetailsReport, CommitReport, DeltaReport, ReconcilerDebugController, ReconcilerDebugEventBus, ThreadReport, updateTreeReport, ValueReport, WorkTaskReport } from '@lukekaalim/act-debug';
import { CommitID } from '@lukekaalim/act-recon';
import { CommitPreview, TreeViewer } from './TreeViewer';
import { ScheduleControls } from './ScheduleControls';
import { CommitLookupCache, ThreadLookupCache } from './lookup';
import { Virtual1D } from './Virtual';
import { CommitAttributeTag } from './AttributeTag';

export type InsightAppProps = {
  controller: ReconcilerDebugController,
  bus: ReconcilerDebugEventBus,

  document: Document,
};

export type InsightAppState = {
  breakOnAfterUpdate: boolean,
  breakOnBeforeUpdate: boolean,

  commitBreakpoints: Set<CommitID>,

  paused: boolean,
}

export const InsightApp: Component<InsightAppProps> = ({ controller, bus, document = window.document }) => {
  const [c, setRenderCounter] = useState(0);

  const [insightState, setInsightState] = useState<InsightAppState>({
    commitBreakpoints: new Set(),
    breakOnAfterUpdate: false,
    breakOnBeforeUpdate: true,
    paused: false,
  });

  const commitCache = useRef(() => new CommitLookupCache()).current;
  const deltaCache = useRef(() => new ThreadLookupCache(commitCache)).current;

  useMemo(() => {
    commitCache.setTree(controller.getTree())
    deltaCache.reset();
  }, [])

  useEffect(() => {
    console.log('[Insight] Populate Cache')

    bus.onThreadDone = (thread, delta) => {
      console.log('[Insight] ThreadDone')

      deltaCache.ingestDelta(delta);
      deltaCache.ingestThread(thread);
      deltaCache.prevTask = null;
      setRenderCounter(c => c + 1);

      for (const subscriber of cacheSubscribers) {
        subscriber();
      }
    }
    bus.thread.onQueue = (reason) => {
      console.log('[Insight] OnQueue')
      const thread = controller.getThread();
      
      if (thread.reasons.length === 1) {
        if (insightState.breakOnBeforeUpdate)
          controller.scheduler.intercept = true;

        if (deltaCache.report)
          commitCache.ingest(deltaCache.report);
        
        deltaCache.reset();
        deltaCache.ingestThread(thread);
        setRenderCounter(c => c + 1);

        for (const subscriber of cacheSubscribers) {
          subscriber();
        }
      }
    }
    bus.thread.onWork = (prevTask, nextTask, isDone) => {

      if (insightState.breakOnAfterUpdate && isDone) {
        controller.scheduler.intercept = true;
      }
      if (nextTask && insightState.commitBreakpoints.has(nextTask.id)) {
        controller.scheduler.intercept = true;
      }

      if (controller.scheduler.intercept) {
        const thread = controller.getThread();
        const delta = controller.getDelta();
        
        deltaCache.ingestDelta(delta);
        deltaCache.ingestThread(thread);
        setRenderCounter(c => c + 1);

        for (const subscriber of cacheSubscribers) {
          subscriber();
        }

        if (prevTask)
          deltaCache.prevTask = prevTask;
      }
    }
  }, [controller, bus, insightState]);

  const cacheSubscribers = useRef<Set<() => void>>(new Set()).current;

  const scrollToCommitIndex = useMemo(() => {
    return (index: number) => {
      if (!viewportRef.current)
        return;
      const viewPortRect = viewportRef.current.getBoundingClientRect();
      if (index) {
        viewportRef.current.scrollTo({
          top: (index * 33) - (viewPortRect.height / 2),
          behavior: 'smooth'
        })
        return;
      }
    }
  }, []);

  useEffect(() => {
    const { nextTask, prevTask } = deltaCache;

    const task = nextTask || prevTask;
    const index = task && commits.findIndex(c => (nextTask && c.id === nextTask.id) || (prevTask && prevTask.id === c.id));
    
    if (index && index !== -1) {
      scrollToCommitIndex(index);
    }
  }, [deltaCache.prevTask, deltaCache.nextTask, scrollToCommitIndex])

  const renderCommit = useMemo(() => (commitId: CommitID) => {
    return h(CommitComponent, { commitId })
  }, []);

  const CommitComponent = useMemo((): Component<{ commitId: CommitID }> => ({ commitId }) => {
    const [c, setRenderCounter] = useState(0);

    useEffect(() => {
      const subscription = () => {
        const commit = deltaCache.all.get(commitId);
        const originalCommit = commitCache.map.get(commitId);

        const inTaskList = deltaCache.allTasks.has(commitId);
        
        if (commit !== originalCommit || inTaskList || (deltaCache.prevTask && deltaCache.prevTask.id === commitId))
          setRenderCounter(c => c + 1);
      }
      cacheSubscribers.add(subscription);
      subscription();

      return () => {
        console.log(`[Commit] Cleaning up ${commitId}`)
        cacheSubscribers.delete(subscription);
      }
    }, [commitId])

    const commit = deltaCache.all.get(commitId) || null;
    if (!commit)
      return (console.warn(`[Commit] Commit ${commitId} not found in delta cache`), null);

    const color = 
      (deltaCache.nextTask && deltaCache.nextTask.id === commit.id) ? '#e1d600ff'
      : deltaCache.targets.has(commit.id) ? '#db55e7ff'
      : deltaCache.allTasks.has(commit.id) ? '#ea931aff'
      : deltaCache.created.has(commit.id) ? (deltaCache.prevTask && deltaCache.prevTask.id === commit.id ? '#4bc847ff' : '#21a51cff')
      : deltaCache.removed.has(commit.id) ? '#f25252ff'
      : deltaCache.updated.has(commit.id) ? '#1ab9eaff'
      : deltaCache.visited.has(commit.id) ? '#6f6f97ff'
      : '#cacaca';
    
    if (!commit)
      return (console.log(`[Commit] ${commitId} not ready yet??`), null);

    return useMemo(() => h(CommitPreview, { commit, renderCommit, color, onClick: () => setSelectedCommitId(commit.id) }), [
      commit.version,
      color,
    ])
  }, [])

  const viewportRef = useRef<HTMLElement | null>(null);

  const [selectedCommitId, setSelectedCommitId] = useState<CommitID | null>(null)
  const [selectedCommitDetails, setSelectedCommitDetails] = useState<CommitDetailsReport | null>(null)

  useEffect(() => {
    if (!selectedCommitId)
      return;

    const details = controller.getDetails(selectedCommitId);
    setSelectedCommitDetails(details)
  }, [selectedCommitId])

  const roots = [...deltaCache.roots.keys()];
  const commits = deltaCache.getFlat();

  const CHUNK_SIZE = 8;

  return h('div', { style: { display: 'flex', 'flex-direction': 'column', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } }, [
    h('div', { style: { flex: 0, display: 'flex' } }, [
      h(ScheduleControls, {
        controller: controller.scheduler,
        bus: bus.scheduler,
        reconciler: controller,

        state: insightState,
        onStateChange: setInsightState,
      }),
    ]),
    h('div', { style: { flex: 1, overflow: 'hidden', background: '#c0d7ddff', display: 'flex' } }, [
      h('div', { style: { flex: 1 } },
        //h(TreeViewer, { roots, renderCommit }),
        h(Virtual1D, { viewportRef, windowRange: 5, chunkCount: commits.length / CHUNK_SIZE, chunkSize: (33 * CHUNK_SIZE), renderChunk(index) {
          if (index < 0)
            return null;

          return Array.from({ length: CHUNK_SIZE }).map((_, chunkIndex) => {
            const report = commits[(index  * CHUNK_SIZE) + (chunkIndex)];
            if (!report)
              return null;

            const color = getCommitColor(deltaCache, report.id);

            const onClick = () => {
              setSelectedCommitId(report.id);
            };
            const attributes: [string, string][] = [
              insightState.commitBreakpoints.has(report.id) ? ['Breakpoint', 'Enabled'] as [string, string] : null
            ].filter(x => !!x)

            return h('div', { style: { 'margin-left': ((report.distance - 1) * 32) + 'px', height: '33px' } }, [
              h(CommitPreview, { color, commit: report, onClick, attributes })
            ])
          });
        }, })
      ),
      h('div', { style: { 'min-width': '300px', flex: 0, background: '#ffdeabff' } }, [
        deltaCache.thread && h('div', { }, [
          h('dl', {}, [
            h('dt', {}, 'Thread ID'),
            h('dd', {}, deltaCache.thread.id),
            h('dt', {}, 'Thread Done'),
            h('dd', {}, deltaCache.thread.done.toString()),
            h('dt', {}, 'Thread Passes'),
            h('dd', {}, deltaCache.thread.passes),
            h('dt', {}, 'Tasks (count)'),
            h('dd', {}, deltaCache.thread.pendingTasks.length),
            h('dt', {}, 'Visited (count)'),
            h('dd', {}, deltaCache.thread.visited.length),
            h('dt', {}, 'Created (count)'),
            h('dd', {}, deltaCache.created.size),
            h('dt', {}, 'Updated (count)'),
            h('dd', {}, deltaCache.updated.size),
            h('dt', {}, 'Removed (count)'),
            h('dd', {}, deltaCache.removed.size),
            h('dt', {}, 'MustRender '),
            h('dd', {}, deltaCache.thread.mustRender.map(commitId => {
              const commit = deltaCache.all.get(commitId);
              if (!commit)
                return null;
              const color = getCommitColor(deltaCache, commitId);

              return h(CommitPreview, {
                commit,
                color,
                onClick: () => (scrollToCommitIndex(commits.indexOf(commit)), setSelectedCommitId(commitId))
              })
            })),
            h('dt', {}, 'Missed'),
            h('dd', {}, deltaCache.thread.missed.map(commitId => {
              const commit = deltaCache.all.get(commitId);
              if (!commit)
                return null;
              const color = getCommitColor(deltaCache, commitId);

              return h(CommitPreview, {
                commit,
                color,
                onClick: () => (scrollToCommitIndex(commits.indexOf(commit)), setSelectedCommitId(commitId))
              })
            })),
          ])
        ]),
        h('hr'),
        selectedCommitDetails && [
          h(CommitPreview, {
            commit: selectedCommitDetails.commit,
            color: getCommitColor(deltaCache, selectedCommitDetails.commit.id),
            onClick: () => (scrollToCommitIndex(commits.indexOf(selectedCommitDetails.commit)), setSelectedCommitId(selectedCommitDetails.commit.id))
          }),
          h('button', { onClick: () => {
            setInsightState(state => {
              const prev = state.commitBreakpoints;
              if (prev.has(selectedCommitDetails.commit.id)) {
                prev.delete(selectedCommitDetails.commit.id)
                return { ...state, commitBreakpoints: new Set(prev) };
              }
              prev.add(selectedCommitDetails.commit.id)
              return { ...state, commitBreakpoints: new Set(prev) }
            })
          }}, 'Toggle Breakpoint'),
          h('h3', {}, 'Parent'),
          (() => {
            const parentId = selectedCommitDetails.commit.parent;
            if (!parentId)
              return 'NO PARENT';
            const parent = deltaCache.all.get(parentId);
            if (!parent)
              return h(CommitAttributeTag, { name: 'ParentID', value: parentId.toString() });

            return h(CommitPreview, {
              commit: parent,
              color: getCommitColor(deltaCache, parent.id),
              onClick: () => (scrollToCommitIndex(commits.indexOf(parent)), setSelectedCommitId(parent.id))
            });
          })(),
          h('h3', {}, 'Props'),
          h('ul', {},
            Object.entries(selectedCommitDetails.props).map(([prop, value]) => {
              return h('li', {}, `${prop} = ${getTextForValue(value)}`);
            })
          )
        ]
      ])
    ])
  ])
}


export const getTextForValue = (value: ValueReport): string => {
  switch (value.type) {
    case 'primitive':
      switch (typeof value.value) {
        case 'object':
          return `null`;
        case 'string':
        case 'boolean':
        case 'number':
          return value.value.toString();
      }
    case 'complex':
      return value.name;
    case 'undefined':
      return `undefined`;
    default:
      return  value;
  }
}

const getCommitColor = (deltaCache: ThreadLookupCache, commitId: CommitID) => {

  const color = 
    (deltaCache.nextTask && deltaCache.nextTask.id === commitId) ? '#e1d600ff'
    : deltaCache.targets.has(commitId) ? '#db55e7ff'
    : deltaCache.allTasks.has(commitId) ? '#ea931aff'
    : deltaCache.created.has(commitId) ? (deltaCache.prevTask && deltaCache.prevTask.id === commitId ? '#4bc847ff' : '#21a51cff')
    : deltaCache.removed.has(commitId) ? '#f25252ff'
    : deltaCache.updated.has(commitId) ? '#1ab9eaff'
    : deltaCache.visited.has(commitId) ? '#6f6f97ff'
    : '#cacaca';

  return color;
}