import { Component, Element, h, useEffect, useMemo, useRef, useState } from '@lukekaalim/act';
import { Commit, CommitID, CommitTree, DeltaSet, Reconciler, Update, WorkThread } from '@lukekaalim/act-recon';
import { hs } from '@lukekaalim/act-web';

import { CommitPreview, TreeViewer } from './TreeViewer';

import { debounce } from 'lodash-es'
import { getElementName } from './utils';
import { CommitViewer } from './CommitViewer';
import classes from './InsightApp.module.css';
import { InsightMode } from './mode';
import { MenuBar } from './MenuBar';
import { ThreadViewer } from './ThreadViewer';
import { DebuggerServer } from '@lukekaalim/act-debug';
import { CommitReport, ComponentStateReport, TreeReport, updateTreeReport } from '@lukekaalim/act-debug/report';

export type InsightAppProps = {
  server: DebuggerServer,
}

export const InsightApp2: Component<InsightAppProps> = ({ server }) => {
  const [tree, setTree] = useState<TreeReport>({ commits: new Map(), roots: [] });
  const [componentState, setComponentState] = useState<ComponentStateReport | null>(null);

  useEffect(() => {
    server.subscribe((event) => {
      switch (event.type) {
        case 'thread:finish':
          setTree(tree => {
            return updateTreeReport(tree, event.thread);
          });
          break;
        case 'tree:root-update':
          setTree(tree => {
            return { ...tree, roots: event.roots };
          });
          break;
        case 'component-state:response':
          setComponentState(event.report);
          break;
      }
    })
    server.ready();
    return;
  }, [server])

  const renderCommit = (commit: CommitReport) => {
    const onClick = () => {
      server.componentState(commit.id);
    };

    return h(CommitPreview, { commit, renderCommit, tree, onClick });
  }

  return h('div', { style: { display: 'flex', flexDirection: 'row' } }, [
    h(TreeViewer, { tree, renderCommit, }),
    componentState && h('pre', {}, JSON.stringify(componentState, null, 2))
  ]);
}

export const InsightApp: Component<InsightAppProps> = () => {
  throw new Error();

  const [mode, setMode] = useState<InsightMode>('tree');

  const [renderReportIndex, setRenderReportIndex] = useState(0);
  const [renderReports, setRenderReports] = useState<WorkThread[]>([]);
  const [tree, setTree] = useState<null | CommitTree>(null);

  const [currentThread, setCurrentThread] = useState<WorkThread | null>(null);

  const currentReport = renderReports[renderReportIndex] || null;
  const rootCommits = tree && CommitTree.getRootCommits(tree) || [];

  const [pendingWork, setPendingWork] = useState(false)
  const [autoWork, setAutoWork] = useState(false);

  const updateThread = useMemo(() => {
    return debounce(() => {
      console.log('updating thread');
      const currentThread = reconciler.state.thread;
      if (currentThread)
        setCurrentThread(WorkThread.clone(currentThread));
      else
        setCurrentThread(null);
    }, 100, { leading: true, trailing: true, maxWait: 100 });
  }, []);

  //const [counter, setCounter] = useState(0);

  useEffect(() => {

    const renderSub = reconciler.on('on-thread-complete', (thread) => {
      setRenderReports(rrs => [...rrs, WorkThread.clone(thread)])
      setTree(reconciler.tree);
      updateThread();
    });
    
    reconciler.on('on-thread-update', () => {
      setTree(reconciler.tree);
      updateThread();
    })
    

    onReady();
    return () => {
      renderSub.cancel();
    }
  }, [])

  useEffect(() => {
    if (autoWork) {
      const id = setInterval(() => {
        scheduler.work();
      }, 5);
      return () => clearInterval(id);
    }
  }, [autoWork, reconciler])

  const onWorkClick = () => {
    setPendingWork(false);
    scheduler.work();
    updateThread();
  }
  const onToggleAutoWork = (e: Event) => {
    setAutoWork((e.target as HTMLInputElement).checked);
  }

  const [selectedCommit, setSelectedCommit] = useState<null | CommitID>(null);
  const onSelectCommit = (id: CommitID) => {
    if (selectedCommit === id)
      setSelectedCommit(null)
    else
      setSelectedCommit(id)
  }

  const renderCommit = (depth: number) => (commit: Commit) => {
    if (!tree)
      return null;
    return h(CommitPreview, {
      commit,
      tree,
      depth,
      renderCommit: renderCommit(depth + 1),
      onSelectCommit,
      attributes: [
        ['Id', commit.id.toString()]
      ],
      selectedCommits: new Set(selectedCommit ? [selectedCommit] : [])
    })
  }

  return h('div', { className: classes.insight }, [
    h(MenuBar, { currentMode: mode, onSelectMode: setMode }),
    mode === 'thread' && hs('div', {}, [
      hs('button', { onClick: onWorkClick }, pendingWork ? 'Do Pending Work' : 'Work'),
      hs('label', {}, [
        hs('span', {}, 'Toggle Auto-Work'),
        hs('input', { type: 'checkbox', onInput: onToggleAutoWork, checked: autoWork }),
      ])
    ]),
    mode === 'thread' && currentThread && h(ThreadViewer, { thread: currentThread, tree: tree || CommitTree.new() }),
    //hs('pre', {}, counter),
    mode === 'tree' && hs('div', { className: classes.treeExplorer }, [
      tree && [
        h(TreeViewer, { tree, selectedCommits: new Set(selectedCommit ? [selectedCommit] : []), onSelectCommit,
          renderCommit: renderCommit(0)
         }),
      ],
      selectedCommit && tree && [
        h(CommitViewer, { tree, commitId: selectedCommit, reconciler })
      ]
    ])
  ]);
};

const UpdateDesc = ({ update }: { update: Update }) => {
  if (update.prev && update.next)
    return `Update ${update.ref.id} (${getElementName(update.next)})`;
  if (update.prev && !update.next)
    return `Destroy ${update.ref.id} (${getElementName(update.prev.element)})`;
  if (!update.prev && update.next)
    return `Create ${update.ref.id} (${getElementName(update.next)})`;
  return `???`;
}

export type CommitTreeLeafProps = {
  commit: Commit,
  tree: CommitTree,
}

const CommitTreeLeaf: Component<CommitTreeLeafProps> = ({ commit, tree }) => {
  return [
    hs('pre', {}, [getElementName(commit.element), ` id=${commit.id} v=${commit.version}`]),
    hs('ul', {}, commit.children
      .map(ref => tree.commits.get(ref.id) as Commit)
      .map(commit => h(CommitTreeLeaf, { commit, tree })))
  ];
}
