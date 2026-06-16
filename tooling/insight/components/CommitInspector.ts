import { Component, h, useEffect, useState } from "@lukekaalim/act"

import { icons } from "../assets/icons"
import { IconButton } from "./Button"
import classes from './index.module.css';
import { Breakpoints, CommitDetailsReport, CommitReport, DebugClient, toggleCommitBreakpoint } from "@lukekaalim/act-debug";
import { useSelection } from "../lib/selection";
import { CommitPreview } from "../TreeViewer";
import { Filters, InsightController, InsightState, toggleCollapsedCommit } from "../lib/controller";
import { CommitAttributeTag } from "../AttributeTag";

export type CommitInspectorProps = {
  commit: CommitReport,

  client: DebugClient,
  breakpoints: Breakpoints,

  state: InsightState,
  controller: InsightController,
}

export const CommitInspector: Component<CommitInspectorProps> = ({ commit, breakpoints, client, state, controller }) => {
  const hasBreakpoint = breakpoints.commits.has(commit.id);

  const [details, setDetails] = useState<CommitDetailsReport | null>(null);
  useEffect(() => {
    setDetails(state.client.getDetails(commit.id));
  }, [commit])

  const onToggleBreakpoint = () => {
    client.setBreakpoints(toggleCommitBreakpoint(breakpoints, commit.id));
  }

  const isCollapsed = state.filters.collapsed.has(commit.id);
  const onToggleCollapse = () => {
    controller.changeFilters(toggleCollapsedCommit(state.filters, commit.id))
  }

  return h('div', { className: classes.commitInspector }, [
    // preview
    h('div', { className: classes.commitInspectorPreviewRow }, 
      h(CommitPreview, { commit, attributes: [] })
    ),
    h('div', {}, [
      h(CommitAttributeTag, { name: 'Id', value: commit.id.toString() }),
      h(CommitAttributeTag, { name: 'Version', value: commit.version.toString() }),
      !!(details && details.props.key && details.props.key.type === 'primitive') &&
        h(CommitAttributeTag, { name: 'Key', value: details.props.key.value as string }),
    ]),

    // quick controls
    h('div', { className: classes.commitControlBar }, [
      h(IconButton, { icon: hasBreakpoint ? 'breakpoint' : 'breakpoint_unset', onClick: onToggleBreakpoint }),
      h(IconButton, { icon: 'selection', onClick() {} }),
      h(IconButton, { icon: isCollapsed ? 'expand' : 'collapse', onClick: onToggleCollapse }),
      h(IconButton, { icon: 'reload', onClick() {} }),
    ])
    

    // info

    // state details
  ])
}