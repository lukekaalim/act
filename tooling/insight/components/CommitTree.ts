import { Component, h, useEffect, useMemo, useRef, useState } from "@lukekaalim/act";
import { Virtual1D } from "../Virtual";
import { CommitReport, DebugClient, ThreadReport } from "@lukekaalim/act-debug";
import { CommitPreview } from "../TreeViewer";

import treeColumnURL from '../assets/icons/tree_column.svg'
import treeJunctionURL from '../assets/icons/tree_junction.svg'
import treeEndURL from '../assets/icons/tree_end.svg'


export type CommitTreeProps = {
  commits: CommitReport[],
  client: DebugClient,
  thread: ThreadReport | null,
}

const COMMIT_VIEW_HEIGHT_PX = 33;
const CHUNK_COMMIT_COUNT = 8;
const CHUNK_HEIGHT_PX = COMMIT_VIEW_HEIGHT_PX * CHUNK_COMMIT_COUNT;

export const CommitTree: Component<CommitTreeProps> = ({ commits, client, thread }) => {
  const viewportRef = useRef<HTMLElement | null>(null);

  const nextTask = thread && thread.pendingTasks[thread.pendingTasks.length - 1];

  const getCommitBorder = (commit: CommitReport) => {
    if (nextTask && nextTask.id === commit.id)
      return '2px solid rgb(255, 145, 0)';

    const state = client.cache.getCommitState(commit.id);
    if (state === 'mount-task')
        return '2px dashed rgb(26, 123, 234)'

    if (thread) {
      if (thread.mustRender.includes(commit.id))
        return '1px solid rgb(19, 33, 231)';
      if (thread.pendingTasks.some(c => c.id === commit.id)) {
        return '2px dashed rgb(255, 145, 0)'
      }
      if (state !== 'live' && thread.visited.includes(commit.id)) {
        return '1px dashed rgb(160, 160, 160)';
      }
    }

    return 'none';
  }

  const getCommitColor = (commit: CommitReport) => {
    // maybe do border stuff instead

    //: deltaCache.created.has(commitId) ? (deltaCache.prevTask && deltaCache.prevTask.id === commitId ? '#4bc847ff' : '#21a51cff')

    const state = client.cache.getCommitState(commit.id);
    switch (state) {
      case 'created':
        return '#4bc847ff';
      case 'live':
        if (thread && thread.visited.includes(commit.id)) {
          return '#8b8b8b';
        }
        return '#d8d8d8';
      case 'removed':
        return '#f25252ff';
      case 'updated':
        return '#1ab9eaff';
      case 'mount-task':
        return 'rgb(221, 247, 255)';
    }
  }

  const renderChunk = (index: number, width: number) => {
    if (index < 0)
      return null;

    return Array.from({ length: CHUNK_COMMIT_COUNT }).map((_, chunkIndex) => {
      const commitIndex = (index  * CHUNK_COMMIT_COUNT) + (chunkIndex);
      const report = commits[commitIndex];
      if (!report)
        return null;

      const onClick = () => {
        //setSelectedCommitId(report.id);
      };
      const attributes: [string, string][] = [
        //insightState.commitBreakpoints.has(report.id) ? ['Breakpoint', 'Enabled'] as [string, string] : null
        //['Version', report.version]
      ].filter(x => !!x);

      const buildAncestorList = (commit: CommitReport) => {
        const ancestors: CommitReport[] = [];
        let current_commit: CommitReport | null = commit;

        while (current_commit) {
          current_commit = current_commit.parent && client.cache.getCommit(current_commit.parent);

          if (current_commit)
            ancestors.unshift(current_commit);
        }

        return ancestors;
      }

      const ancestors = buildAncestorList(report);
      const border = getCommitBorder(report);
      const color =  getCommitColor(report);

      return [
        h('div', { style: {
          position: 'absolute',
          top: chunkIndex * COMMIT_VIEW_HEIGHT_PX + 'px',
          width: width + 'px',
          'background-color': commitIndex % 2 === 0 ? '#f4f4f4' : 'white',
          height: COMMIT_VIEW_HEIGHT_PX + 'px'
        } }),
        h('div', { style: {
          position: 'absolute',
          top: chunkIndex * COMMIT_VIEW_HEIGHT_PX + 'px',
        }},
          ancestors.map((ancestor, ancestorIndex) => {
            const child = ancestors[ancestorIndex + 1] || null;

            const left = ancestorIndex * 32 + 'px';
            const style = { position: 'absolute', left };

            if (!child) {
              if (ancestor.children[ancestor.children.length - 1] === report.id) {
                return h('img', { height: 33, width: 32, src: treeEndURL, style });
              } else {
                return h('img', { height: 33, width: 32, src: treeJunctionURL, style });
              }
            }
            if (ancestor.children[ancestor.children.length - 1] === child.id) {
              return null;
            } else {
              return h('img', { height: 33, width: 32, src: treeColumnURL, style });
            }


            // if (ancestor) {
            //   const parent = report.parent && client.cache.getCommit(report.parent);
            //   return h('img', { height: 32, width: 32, src: treeJunctionURL });
            // }

            return h('img', { height: 32, width: 32, src: treeColumnURL });
          })
        ),
        h('div', { style: {
          'margin-left': ((report.distance - 1) * 32) + 'px',
          height: '33px',
        } }, [
          h(CommitPreview, { color, commit: report, onClick, attributes, border })
        ]),
      ];
    });
  };
  
  useEffect(() => {
    const viewport = viewportRef.current;
    
    if (!nextTask || !viewport)
      return;

    const rect = viewport.getBoundingClientRect()

    const index = commits.findIndex(c => c.id === nextTask.id);
    const commit = commits[index];
    if (!commit)
      return console.info(`Failed to scroll to ${index} or ${nextTask.id}`);

    viewport.scrollTo({
      top: (index * COMMIT_VIEW_HEIGHT_PX) - (rect.height / 2),
      left: ((commit.distance - 1) * 32) - (rect.width / 2),
      behavior: 'smooth'
    });
  }, [nextTask])

  return h(Virtual1D, {
    viewportRef,
    chunkCount: commits.length / CHUNK_COMMIT_COUNT,
    chunkSize: CHUNK_HEIGHT_PX,
    renderChunk
  })
};
