import { Component, h, useEffect, useMemo, useRef, useState } from "@lukekaalim/act";
import { CommitReport, DebugCache, DebugClient, FlattenedCommitReport, ThreadReport } from "@lukekaalim/act-debug";

import { CommitPreview } from "../TreeViewer";
import { Virtual1D } from "../Virtual";
import { useSelection } from "../lib/selection";
import { CommitListEntry } from "../lib/list";

import classes from './index.module.css';

import treeColumnURL from '../assets/icons/tree_column.svg'
import treeJunctionURL from '../assets/icons/tree_junction.svg'
import treeEndURL from '../assets/icons/tree_end.svg'

import breakpointURL from '../assets/icons/breakpoint.svg'
import breakpointUnsetURL from '../assets/icons/breakpoint_unset.svg'
import { IconButton } from "./Button";
import { InsightController, InsightState, toggleCollapsedCommit } from "../lib/controller";
import { FiltersPanel } from "./FiltersPanel";
import { CommitID } from "@lukekaalim/act-recon";


export type CommitTreeProps = {
  state: InsightState,
  controller: InsightController,

  commits: CommitListEntry[],
  client: DebugClient,
  thread: ThreadReport | null,

  scrollTarget: CommitID | null,
  onScrollTargetComplete(): void,
}

const COMMIT_VIEW_HEIGHT_PX = 33;
const CHUNK_COMMIT_COUNT = 8;
const CHUNK_HEIGHT_PX = COMMIT_VIEW_HEIGHT_PX * CHUNK_COMMIT_COUNT;

type CommitRowProps = {
  state: InsightState,
  controller: InsightController,

  commit: CommitReport,

  index: number,
  list: CommitListEntry[],

  client: DebugClient,
  thread: null | ThreadReport,

  width: number,
}

export const CommitRow: Component<CommitRowProps> = ({ width, thread, commit, client, index, list, state, controller }) => {
  const ancestors = buildAncestorList(index, list);
  const border = getCommitBorder(commit, client.cache,  thread);
  const color =  getCommitColor(commit, client.cache, thread);

  const entry = list[index]
  const distance = entry.distance;

  const selection = useSelection()

  const onClick = () => {
    selection.select({ type: 'commit', id: commit.id })
  }

  const [focused, setFocused] = useState(false);

  const collapsed = state.filters.collapsed.has(commit.id);
  const onToggleCollapse = () => {
    controller.changeFilters(toggleCollapsedCommit(state.filters, commit.id))
  }

  const onMouseEnter = () => {
    setFocused(true)
  };
  const onMouseLeave = () => {
    setFocused(false)
  }

  const breakpointSet = client.breakpoints.commits.has(commit.id)
  const onClickBreakpointToggle = () => {
    const next = { ...client.breakpoints, commits: new Set(client.breakpoints.commits) };
    if (breakpointSet) {
      next.commits.delete(commit.id)
    } else {
      next.commits.add(commit.id)
    }
    client.setBreakpoints(next);
  }
  
  return [
    h('div', { onMouseEnter, onMouseLeave, className: classes.commitRow }, [
      h('div', { className: classes.commitRowBackground, style: { width: width + 'px' } }),
      ancestors.map((ancestorCommitIndex, ancestorIndex) => {
        const childCommitIndex = ancestors[ancestorIndex + 1];
        const ancestor = list[ancestorCommitIndex];
        const child = list[childCommitIndex]

        const left = ancestorIndex * 32 + 'px';
        const style = { left };

        if (!child) {
          if (ancestor.children[ancestor.children.length - 1] === index) {
            return h('img', { src: treeEndURL, style });
          } else {
            return h('img', { src: treeJunctionURL, style });
          }
        }
        if (ancestor.children[ancestor.children.length - 1] === childCommitIndex) {
          return null;
        }

        return h('img', { src: treeColumnURL, style });
      }),
      h('div', { className: classes.commitRowPreviewContainer, style: {
        'margin-left': ((distance - 1) * 32) + 'px',
      } }, [
        (focused || collapsed) && commit.children.length > 0 && h(IconButton, {
          icon: collapsed ? 'expand' : 'collapse',
          onClick: onToggleCollapse,
          className: classes.commitRowCollapseButton
        }),
        h(CommitPreview, { color, commit, onClick, border, attributes: [] }),
        h('div', { className: classes.commitRowControls }, [
          (focused || breakpointSet) && h('button', {
            classList: [classes.commitRowBreakpointToggle, !breakpointSet && classes.off],
            onClick: onClickBreakpointToggle
          },
            h('img', { src: breakpointSet ? breakpointURL : breakpointUnsetURL, title: 'Set Breakpoint' }))
        ])
      ])
    ]),
  ];
}


export const getCommitBorder = (commit: CommitReport, cache: DebugCache, thread: ThreadReport | null) => {
  const nextTask = thread && thread.pendingTasks[thread.pendingTasks.length - 1];
  if (nextTask && nextTask.id === commit.id)
    return '2px solid rgb(255, 145, 0)';

  const state = cache.getCommitState(commit.id);
  if (state === 'mount-task')
      return '2px dashed rgb(26, 123, 234)'

  if (thread) {
    if (thread.mustRender.includes(commit.id))
      return '2px solid rgb(19, 33, 231)';
    const pendingTask = thread.pendingTasks.find(c => c.id === commit.id)
    if (pendingTask) {
      if (!pendingTask.element)
        return '2px dashed #f25252ff'
      return '2px dashed rgb(255, 145, 0)'
    }
    if (state !== 'live' && thread.visited.includes(commit.id)) {
      return '1px dashed rgb(160, 160, 160)';
    }
  }

  return '1px solid #b1b1b1';
}

export const getCommitColor = (commit: CommitReport, cache: DebugCache, thread: ThreadReport | null) => {
  const state = cache.getCommitState(commit.id);
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

const buildAncestorList = (index: number, list: CommitListEntry[]) => {
  const ancestors: number[] = [];
  let current_index: number = list[index].parent;

  while (current_index !== -1) {
    ancestors.unshift(current_index);
    const entry = list[current_index];
    current_index = entry.parent;
  }

  return ancestors;
}

export const CommitTree: Component<CommitTreeProps> = ({ commits, client, thread, state, controller, scrollTarget, onScrollTargetComplete }) => {
  const viewportRef = useRef<HTMLElement | null>(null);

  const nextTask = thread && thread.pendingTasks[thread.pendingTasks.length - 1];

  const renderChunk = (index: number, width: number) => {
    if (index < 0)
      return null;

    return Array.from({ length: CHUNK_COMMIT_COUNT }).map((_, chunkIndex) => {
      const commitIndex = (index  * CHUNK_COMMIT_COUNT) + (chunkIndex);
      const entry = commits[commitIndex];
      const commit = entry && client.cache.getCommit(entry.id);

      if (!commit)
        return null;

      return h(CommitRow, {
        width,
        
        client,
        commit,
        list: commits,
        index: commitIndex,
        thread,
        state,
        controller,
      });
    });
  };
  
  /*
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
  */

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!scrollTarget || !viewport)
      return;

    const commit = client.cache.getCommit(scrollTarget);
    if (!commit)
      return;

    const rect = viewport.getBoundingClientRect()
    const index = commits.findIndex(c => c.id === scrollTarget);
    if (index === -1)
      return;
    const entry = commits[index];

    viewport.scrollTo({
      top: (index * COMMIT_VIEW_HEIGHT_PX) - (rect.height / 2),
      left: ((entry.distance - 1) * 32) - (rect.width / 2),
      behavior: 'smooth'
    });
    onScrollTargetComplete();
  }, [scrollTarget, onScrollTargetComplete])

  const [showFilter, setShowFilter] = useState(false);

  return h('div', { className: classes.commitTree }, [
    h(Virtual1D, {
      viewportRef,
      chunkCount: commits.length / CHUNK_COMMIT_COUNT,
      chunkSize: CHUNK_HEIGHT_PX,
      renderChunk
    }),
    h(IconButton, { className: classes.filterButton, icon: 'filter', title: 'Filters', onClick() {
      setShowFilter(!showFilter)
    }, }),
    showFilter && h(FiltersPanel, { controller, state }),
  ])
};
