import { Component, h, Node } from "@lukekaalim/act";
import { Commit, CommitID, CommitTree } from "@lukekaalim/act-recon";
import { hs } from "@lukekaalim/act-web";
import { getElementName } from "./utils";
import stringHash from '@sindresorhus/string-hash';

import classes from './TreeViewer.module.css';
import { CommitAttributeTag } from "./AttributeTag";

export type TreeViewerProps = {
  tree: CommitTree,
  roots?: Commit[],
  
  selectedCommits: ReadonlySet<CommitID>,
  onSelectCommit?: (id: CommitID) => unknown,

  renderCommit: (commit: Commit) => Node,
}

export const TreeViewer: Component<TreeViewerProps> = ({
  tree, roots, selectedCommits, onSelectCommit = _ => {},
  renderCommit
}) => {
  const commits = roots || CommitTree.getRootCommits(tree);
  console.log(commits)

  return h('ol', { className: [classes.commitList, classes.top].join(' ') }, commits.map(root =>
    h('li', {}, renderCommit(root))));
};

export type CommitPreviewProps = {
  commit: Commit,
  tree: CommitTree,

  attributes?: [string, string][],

  color?: string,

  depth?: number,
  selectedCommits: ReadonlySet<CommitID>,
  onSelectCommit: (id: CommitID) => unknown,

  renderCommit: (commit: Commit) => Node,
}

export const CommitPreview: Component<CommitPreviewProps> = ({
  commit, tree, depth = 0,
  attributes = [],
  selectedCommits, onSelectCommit, renderCommit,
  color,
}) => {
  const children = commit.children.map(childRef => tree.commits.get(childRef.id)).filter(c => !!c);
  const background = `hsl(${(depth * 22.3) % 360}deg, 50%, 80%)`;
  const elementBackground = color || `hsl(${stringHash(getElementName(commit.element)) % 360}deg, 60%, 80%)`;

  const selected = selectedCommits.has(commit.id);
  const onClick = () => {
    onSelectCommit(commit.id);
  }

  return hs('div', { className: classes.commit, style: { background } }, [
    hs('div', { className: [classes.elementBar, selected && classes.selected].join(' ') }, [
      hs('button', { onClick, className: classes.elementName, style: { background: elementBackground } },
        getElementName(commit.element)),
      //h(CommitAttributeTag, { name: 'Id', value: commit.id.toString() }),
      attributes.map(([name, value]) => h(CommitAttributeTag, { name, value }))
      //h(CommitAttributeTag, { name: 'Version', value: commit.version.toString() }),
    ]),
    hs('ol', { className: classes.commitList }, children.map(child => h('li', {}, renderCommit(child)))),
  ])
};

// h(CommitPreview, { commit: child, tree, depth: depth + 1, selectedCommits, onSelectCommit })))