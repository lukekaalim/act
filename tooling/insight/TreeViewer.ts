import { Component, h, Node } from "@lukekaalim/act";
import { Commit, CommitID, CommitTree } from "@lukekaalim/act-recon";
import { hs } from "@lukekaalim/act-web";
import { getElementName } from "./utils";
import stringHash from '@sindresorhus/string-hash';

import classes from './TreeViewer.module.css';
import { CommitAttributeTag } from "./AttributeTag";
import { CommitReport, TreeReport } from "@lukekaalim/act-debug";

export type TreeViewerProps = {
  tree: TreeReport,

  renderCommit: (commit: CommitReport) => Node,
}

export const TreeViewer: Component<TreeViewerProps> = ({
  tree, renderCommit
}) => {
  const rootCommits = tree.roots
    .map(root => tree.commits.get(root.id))
    .filter(Boolean) as CommitReport[];

  const className = [classes.commitList, classes.top].join(' ')

  return h('ol', { className }, rootCommits.map(root =>
    h('li', {}, renderCommit(root))));
};

export type CommitPreviewProps = {
  commit: CommitReport,
  tree: TreeReport,

  attributes?: [string, string][],

  color?: string,

  depth?: number,

  renderCommit: (commit: CommitReport) => Node,
}

export const CommitPreview: Component<CommitPreviewProps> = ({
  commit, tree, depth = 0,
  attributes = [],
  renderCommit,
  color,
}) => {
  const children = commit.children
    .map(childRef => tree.commits.get(childRef.id)).filter(c => !!c);

  const background = `hsl(${(depth * 22.3) % 360}deg, 50%, 80%)`;
  const elementBackground = color || `hsl(${stringHash(commit.element.type) % 360}deg, 60%, 80%)`;

  const selected = false; // selectedCommits.has(commit.id);
  const onClick = () => {
    //onSelectCommit(commit.id);
  }

  return hs('div', { className: classes.commit, style: { background } }, [
    hs('div', { className: [classes.elementBar, selected && classes.selected].join(' ') }, [
      hs('button', { onClick, className: classes.elementName, style: { background: elementBackground } },
        commit.element.type),
      //h(CommitAttributeTag, { name: 'Id', value: commit.id.toString() }),
      attributes.map(([name, value]) => h(CommitAttributeTag, { name, value }))
      //h(CommitAttributeTag, { name: 'Version', value: commit.version.toString() }),
    ]),
    hs('ol', { className: classes.commitList }, children.map(child => h('li', {}, renderCommit(child)))),
  ])
};

// h(CommitPreview, { commit: child, tree, depth: depth + 1, selectedCommits, onSelectCommit })))