import { Component, h, useEffect, useState } from "@lukekaalim/act"

import { icons } from "../assets/icons"
import { IconButton } from "./Button"
import classes from './index.module.css';
import { Breakpoints, CommitDetailsReport, CommitReport, DebugClient, toggleCommitBreakpoint } from "@lukekaalim/act-debug";
import { useSelection } from "../lib/selection";
import { CommitPreview } from "../TreeViewer";
import { Filters, InsightController, InsightState, toggleCollapsedCommit } from "../lib/controller";
import { CommitAttributeTag } from "../AttributeTag";
import { getTextForValue } from "../utils";
import { getCommitBorder, getCommitColor } from "./CommitTree";
import { CommitID } from "@lukekaalim/act-recon";

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

  const ancestors: CommitReport[] = [];
  let parentId = commit.parent;
  while (parentId) {
    const parentCommit = state.client.cache.getCommit(parentId);
    if (!parentCommit)
      break;
    ancestors.push(parentCommit);
    parentId = parentCommit.parent;
  }
  ancestors.reverse();

  const component = details && details.component;

  const onCommitClick = (commitId: CommitID) => () => {
    controller.select({ type: 'commit', id: commitId })
  }

  const renderAncestor = (ancestor: CommitReport, isLast: boolean) => {
    const color = getCommitColor(ancestor, state.client.cache, state.thread);
    const border = getCommitBorder(ancestor, state.client.cache, state.thread);

    return [
      h(CommitPreview, { commit: ancestor, attributes: [], color, border, onClick: onCommitClick(ancestor.id) }),
      !isLast && h('img', { src: icons.ancestor_column }),
    ]
  }
  const color = getCommitColor(commit, state.client.cache, state.thread);
  const border = getCommitBorder(commit, state.client.cache, state.thread);

  return h('div', { className: classes.commitInspector }, [
    h("details", {}, [
      h('summary', {}, h('strong', {}, 'Lineage')),
      h('div', { className: classes.lineageColumn }, ancestors.map((a, i) => renderAncestor(a, i === ancestors.length - 1))),
    ]),
    // preview
    h('div', { className: classes.commitInspectorPreviewRow }, 
      h(CommitPreview, { commit, attributes: [], color, border })
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
      h(IconButton, { icon: 'reload', onClick() { client.requestRender(commit.id) } }),
    ]),
    h("details", {}, [
      h('summary', {}, h('strong', {}, 'Children')),
      h('ol', { className: classes.commitList }, commit.children.map(child => {
        const childCommit = state.client.cache.getCommit(child);
        if (!childCommit)
          return null;

        const color = getCommitColor(childCommit, state.client.cache, state.thread);
        const border = getCommitBorder(childCommit, state.client.cache, state.thread);
        return h('li', {}, h(CommitPreview, { color, border, commit: childCommit, attributes: [], onClick: onCommitClick(child) }))
      })),
    ]),
    

    // info

    // state details
    details && [
      h('div', {}, [
        h('button', {}, 'By Order'),
        h('button', { disabled: true }, 'By Type'),
      ]),

      h('h4', {}, 'Props'),
      h('table', {}, 
        Object.entries(details.props).map(([name, value]) => {
          return h('tr', {}, [h('td', {}, name), h('td', {}, getTextForValue(value))])
      })),
      component && [
        h('h4', {}, 'State'),
        h('table', {}, 
          component.stateValues.map((state) => {
            return h('tr', {}, [
              h('td', {}, state.hookIndex),
              h('td', {}, getTextForValue(state.value))
            ])
        })),
        h('h4', {}, 'Effects'),
        h('table', {}, 
          component.deps.map((effect) => {
            return h('tr', {}, [
              h('td', {}, effect.hookIndex),
              h('td', {},
                component.effects.find(e => e.hookIndex === effect.hookIndex)?.effect || '??'
              ),
              effect.deps && effect.deps.map(dep => {
                return h('td', {}, getTextForValue(dep))
              }),
              !effect.deps && h('td', {}, 'null')
            ])
        })),
        h('h4', {}, 'Contexts'),
        h('table', {}, 
          component.subscriptions.map((subscription) => {
            return h('tr', {}, [
              h('td', {}, subscription.hookIndex),
              h('td', {}, subscription.context),
              h('td', {}, subscription.provider),
            ])
        })),
      ]
    ]
  ])
}