import { Component, h, Node } from "@lukekaalim/act";
import { hs } from "@lukekaalim/act-web";
import stringHash from '@sindresorhus/string-hash';

import classes from './TreeViewer.module.css';
//import { CommitAttributeTag } from "./AttributeTag";
import { CommitReport, TreeReport } from "@lukekaalim/act-debug";
import { CommitID } from "@lukekaalim/act-recon";
import { CommitAttributeTag } from './AttributeTag';
import { getTextForElementType } from "./utils";

export type TreeViewerProps = {
  //commits: Map<CommitID, CommitReport>,
  roots: CommitID[],

  renderCommit: (commitId: CommitID) => Node,
}

export const TreeViewer: Component<TreeViewerProps> = ({
  //commits,
  roots,
  renderCommit
}) => {
  //const rootCommits = roots.map(root => commits.get(root)).filter(x => !!x)

  const className = [classes.commitList, classes.top].join(' ')

  return h('ol', { className }, roots.map(root =>
    h('li', { key: root }, renderCommit(root))));
};

export type CommitPreviewProps = {
  commit: CommitReport,

  attributes?: [string, string][],

  color?: string,
  border?: string,

  depth?: number,

  renderCommit?: (commit: CommitID) => Node,
  onClick?: () => void,
}

export const CommitPreview: Component<CommitPreviewProps> = ({
  commit, depth = 0,
  attributes = [],
  renderCommit,
  color,
  border = 'none',
  onClick,
}) => {
  const background = `hsl(${(depth * 22.3) % 360}deg, 50%, 80%)`;
  const text = getTextForElementType(commit.element);
  const elementBackground = color || `hsl(${stringHash(text) % 360}deg, 60%, 80%)`;
  const lineColor = `hsl(${stringHash(commit.id.toString()) % 360}, 100%, 20%)`


  return hs('div', { className: classes.commit, style: { position: 'relative' }, id: `commit:${commit.id}` }, [

    hs('div', { className: [classes.elementBar].join(' '), style: { 'position': 'relative' } }, [
      hs('button', { onClick, className: classes.elementName, style: { background: elementBackground, border } },
        text),
      h(CommitAttributeTag, { name: 'Id', value: commit.id.toString() }),
      attributes.map(([name, value]) => h(CommitAttributeTag, { name, value }))
      //h(CommitAttributeTag, { name: 'Version', value: commit.version.toString() }),
    ]),

    !!renderCommit && hs('ol', { className: classes.commitList }, commit.children.map(childId => h('li', { key: childId, style: { position: 'relative' } }, [
      renderCommit(childId),
      h('div', { style: {
        top: 0,
        width: '25px', height: '1px', 'border-top': '2px dotted black', position: 'absolute',
        transform: `translate(-22px, 15px)`
      }})
    ]))),
  ])
};

const renderElementName = () => {
  
}

// h(CommitPreview, { commit: child, tree, depth: depth + 1, selectedCommits, onSelectCommit })))