import { Component, h, useMemo } from "@lukekaalim/act"
import { Commit, CommitID, CommitPath, CommitRef, CommitTree, DeltaSet, Update, WorkReason, WorkThread } from "@lukekaalim/act-recon"
import { hs } from "@lukekaalim/act-web"
import { findCommonAncestor, getElementName } from "./utils"
import { CommitAttributeTag } from "./AttributeTag"
import { CommitPreview, TreeViewer } from "./TreeViewer"

import classes from './ThreadViewer.module.css';

export type ThreadViewerProps = {
  thread: WorkThread,
  tree: CommitTree,
}

export const ThreadViewer: Component<ThreadViewerProps> = ({ thread, tree }) => {
  const appliedTree = useMemo(() => {
    const tempTree = CommitTree.clone(tree);
    DeltaSet.apply(thread.deltas, tempTree)
    return tempTree;
  }, [tree, thread]);

  const fiberCommits = new Set([...thread.pendingTasks].map(u => u.ref.id));

  const nextUpdate = thread.pendingTasks[thread.pendingTasks.length - 1];

  const getCommitColor = (commit: Commit) => {
    const isUpdating = fiberCommits.has(commit.id);
    const mustVisit = thread.mustVisit.has(commit.id);
    const mustRender = thread.mustRender.has(commit.id);
    const visited = thread.visited.has(commit.id);

    if (visited)
      return '#7efb8c';
    if (isUpdating)
      return 'blue'
    if (mustRender)
      return 'red';
    if (mustVisit)
      return 'orange';

    return 'white';
  }
  

  const renderCommit = (depth: number) => (commit: Commit) => {
    const color = getCommitColor(commit);
    console.log(color);
    const commitNode = h(CommitPreview, {
      commit,
      tree: appliedTree,
      depth,
      renderCommit: renderCommit(depth + 1),
      onSelectCommit: _ => {},
      selectedCommits: new Set<CommitID>(),
      color,
    });

    return commitNode
  }
  
  return [
    h('h3', {}, 'Next Update'),
    nextUpdate ? h(UpdateViewer, { update: nextUpdate, tree, thread }) : 'Send to Renderer',
    thread.reasons.map(reason => {
      const commit = appliedTree.commits.get(reason.ref.id);
      if (!commit)
        return null;
      return h(TreeViewer, { tree: appliedTree, roots: [commit], selectedCommits: new Set<CommitID>(), renderCommit: renderCommit(0) });
    }),
    hs('h3', {}, 'Fibers'),
    hs('ul', {}, [...thread.pendingTasks].map((update) => hs('li', {}, h(UpdateViewer, { update, tree })))),
    hs('h3', {}, 'Visited'),
    hs('ul', {}, [...thread.visited].map(([id, ref]) => hs('li', {}, id))),
    hs('h3', {}, 'Must Visit'),
    hs('ul', {}, [...thread.mustVisit].map((id) => hs('li', {}, id))),
    hs('h3', {}, 'Must Render'),
    hs('ul', {}, [...thread.mustRender].map(([id, ref]) => hs('li', {}, id))),
    hs('h3', {}, 'Created'),
    hs('ul', {}, thread.deltas.created.map(delta => hs('li', {}, [delta.next.id,' ', getElementName(delta.next.element)]))),
    hs('h3', {}, 'Removed'),
    hs('ul', {}, thread.deltas.removed.map(delta => hs('li', {}, [delta.ref.id,' ', getElementName(delta.prev.element)]))),
    hs('h3', {}, 'Updated'),
    hs('ul', {}, thread.deltas.updated.map(delta => hs('li', {}, [delta.next.id,' ', getElementName(delta.next.element)]))),
    hs('h3', {}, 'Reasons'),
    h(ReasonsListViewer, { reasons: thread.reasons, tree }),
  ]
}

type DeltaViewerProps = {
  deltas: DeltaSet,
}

const DeltaViewer = () => {

}

type UpdateViewerProps = {
  tree: CommitTree,
  thread: WorkThread,
  update: Update,
};

const UpdateViewer: Component<UpdateViewerProps> = ({ update, tree, thread }) => {
  const commit = tree.commits.get(update.ref.id);

  const isEqual = update.next && update.prev && update.next.id === update.prev.element.id;
  
  return hs('div', { className: classes.updateViewer }, [
    !isEqual && update.next && typeof update.next.type === 'function' && [
      h('span', {}, `Calling render function for component: `),
      h('pre', { style: { display: 'inline' } }, `"${update.next.type.name}"`),
    ],
    isEqual && [
      thread.mustVisit.has(update.ref.id) ? [
        thread.mustRender.has(update.ref.id) ?
        h('span', {}, `Marked for rendering`) :
        h('span', {}, `Visiting but not rendering`),
      ] : [
        h('span', {}, `Skipping render and visit - fiber ends here`)
      ]
    ],
    h(CommitAttributeTag, { name: 'Type', value: getUpdateType(update) }),
    h(CommitAttributeTag, { name: 'ID', value: update.ref.id.toString() }),
    update.prev && h(CommitAttributeTag, { name: 'Prev ID', value: (update.prev && update.prev.id.toString()) || 'null' }),
    update.next && h(CommitAttributeTag, { name: 'Next Element', value: (update.next && getElementName(update.next)) || 'null' }),
  ])
}

const getUpdateType = (update: Update) => {
  if (update.prev && !update.next)
    return 'Remove';
  if (update.prev && update.next)
    if (update.moved)
      return "Move & Update"
    else
      return "Update"
  if (!update.prev && update.next)
    return "Create";
  return "???"
};

type ReasonsListViewerProps = {
  reasons: WorkReason[],
  tree: CommitTree,
};

const ReasonsListViewer: Component<ReasonsListViewerProps> = ({ reasons, tree }) => {
  const firstReason = reasons[0];
  if (!firstReason)
    return null;

  return [
    h('p', {}, `Started rendering because:`),
    h('p', {}, h(ReasonViewer, { reason: firstReason, tree })),
    reasons.length > 1 && [
      h('p', {}, `The following updates were also batched with this render:`),
      h('ol', {}, reasons.slice(1).map(reason => {
        return h('li', {}, h(ReasonViewer, { reason, tree }));
      }))
    ]
  ]
};

type ReasonsViewerProps = {
  reason: WorkReason,
  tree: CommitTree,
};

const ReasonViewer: Component<ReasonsViewerProps> = ({ reason, tree }) => {
  switch (reason.type) {
    case 'mount':
      return [
        `Mounting a new tree using:`,
        h('pre', { style: { display: 'inline' } }, getElementName(reason.element)),
      ];
    case 'target':
      const targetCommit = tree.commits.get(reason.ref.id) as Commit;
      return [
        h(CommitAttributeTag, { name: 'CommitID', value: targetCommit.id.toString() }),
        ` `,
        h('pre', { style: { display: 'inline' } }, getElementName(targetCommit.element)),
        ` requested a re-render`
      ];
  }
}