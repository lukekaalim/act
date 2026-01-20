import { Component, h, useEffect, useMemo, useRef, useState } from '@lukekaalim/act';
import { CommitDetailsReport, CommitReport, DeltaReport, ReconcilerDebugController, ReconcilerDebugEventBus, ThreadReport, updateTreeReport, ValueReport, WorkTaskReport } from '@lukekaalim/act-debug';
import { CommitID } from '@lukekaalim/act-recon';
import { CommitPreview, TreeViewer } from './TreeViewer';
import { ScheduleControls } from './ScheduleControls';
import { CommitLookupCache, ThreadLookupCache } from './lookup';

export type InsightAppProps = {
  controller: ReconcilerDebugController,
  bus: ReconcilerDebugEventBus,

  document: Document,
};

export const InsightApp: Component<InsightAppProps> = ({ controller, bus, document = window.document }) => {
  const [c, setRenderCounter] = useState(0);

  const commitCache = useRef(() => new CommitLookupCache()).current;
  const deltaCache = useRef(() => new ThreadLookupCache(commitCache)).current;

  useEffect(() => {
    commitCache.setTree(controller.getTree());
    deltaCache.reset();

    setRenderCounter(c => c + 1);
    console.log('[Insight] Populate Cache')

    bus.onThreadDone = (thread, delta) => {
      console.log('[Insight] ThreadDone')

      deltaCache.ingestDelta(delta);
      deltaCache.ingestThread(thread);
      setRenderCounter(c => c + 1);

      for (const subscriber of cacheSubscribers) {
        subscriber();
      }
    }
    bus.thread.onQueue = (reason) => {
      console.log('[Insight] OnQueue')
      const thread = controller.getThread();
      
      if (thread.reasons.length === 1) {
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
    bus.thread.onWork = (task) => {
      if (controller.scheduler.intercept) {
        const delta = controller.getDelta();
        const thread = controller.getThread();
        
        deltaCache.ingestDelta(delta);
        deltaCache.ingestThread(thread);
        setRenderCounter(c => c + 1);

        for (const subscriber of cacheSubscribers) {
          subscriber();
        }

        if (task)
          deltaCache.prevTask = task;
      }
    }
  }, [controller, bus]);

  const cacheSubscribers = useRef<Set<() => void>>(new Set()).current;

  useEffect(() => {
    if (!treeViewerRef.current)
      return;
    const treeRect = treeViewerRef.current.children[0].getBoundingClientRect();
    const viewPortRect = treeViewerRef.current.getBoundingClientRect();

    const { nextTask, prevTask } = deltaCache;

    const commitPreviewElement =
      nextTask && document.getElementById(`commit:${nextTask.id}`)
      || prevTask && document.getElementById(`commit:${prevTask.id}`)
    
    if (commitPreviewElement) {
      const childRect = commitPreviewElement.getBoundingClientRect();

      const top = childRect.top - treeRect.top;
      treeViewerRef.current.scrollTo({
        top: top - (viewPortRect.height / 2),
        behavior: 'smooth'
      })
      return;
    }
  }, [c])

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

  const treeViewerRef = useRef<HTMLElement | null>(null);

  const [selectedCommitId, setSelectedCommitId] = useState<CommitID | null>(null)
  const [selectedCommitDetails, setSelectedCommitDetails] = useState<CommitDetailsReport | null>(null)

  useEffect(() => {
    if (!selectedCommitId)
      return;

    const details = controller.getDetails(selectedCommitId);
    setSelectedCommitDetails(details)
  }, [selectedCommitId])

  const roots = [...deltaCache.roots.keys()];

  return h('div', { style: { display: 'flex', 'flex-direction': 'column', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } }, [
    h('div', { style: { flex: 0, display: 'flex' } }, [
      h(ScheduleControls, { controller: controller.scheduler, bus: bus.scheduler, reconciler: controller }),
    ]),
    h('div', { style: { flex: 1, overflow: 'hidden', background: '#c0d7ddff', display: 'flex' } }, [
      h('div', { style: { flex: 1, overflow: 'auto' }, ref: treeViewerRef },
        h(TreeViewer, { roots, renderCommit }),
      ),
      h('div', { style: { 'min-width': '300px', flex: 0, background: '#ffdeabff' } }, [
        selectedCommitDetails && [
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