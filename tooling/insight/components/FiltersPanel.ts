import { Component, h } from "@lukekaalim/act";
import classes from './index.module.css';
import { Checkbox } from "./Checkbox";
import { InsightController, InsightState, toggleCollapsedCommit } from "../lib/controller";
import { CommitPreview } from "../TreeViewer";
import { IconButton } from "./Button";


export type FiltersPanelProps = {
  state: InsightState,
  controller: InsightController,
}

export const FiltersPanel: Component<FiltersPanelProps> = ({ state, controller }) => {
  const collapsedList = [...state.filters.collapsed.values()];

  return h('div', { className: classes.filterPanel }, [
    h(Checkbox, { label: 'Skip Primitive Elements', checked: state.filters.skipPrimitives, onCheckedChange(nextChecked) {
      controller.changeFilters({ ...state.filters, skipPrimitives: nextChecked })
    }, }),
    h(Checkbox, { label: 'Skip Components', checked: state.filters.skipComponents, onCheckedChange(nextChecked) {
      controller.changeFilters({ ...state.filters, skipComponents: nextChecked })
    }, }),
    h(Checkbox, { label: 'Skip Special Elements', checked: state.filters.skipSpecial, onCheckedChange(nextChecked) {
      controller.changeFilters({ ...state.filters, skipSpecial: nextChecked })
    }, }),
    h(Checkbox, { label: 'Skip Named Elements', checked: state.filters.skipNamed, onCheckedChange(nextChecked) {
      controller.changeFilters({ ...state.filters, skipNamed: nextChecked })
    }, }),
    collapsedList.length > 0 && [
      h('h4', {}, 'Collapsed Commits'),
      h('ul', { className: classes.commitList }, collapsedList.map(collapsed => {
        const commit = state.client.cache.getCommit(collapsed);
        if (!commit)
          return null;
        const onExpandClick = () => {
          controller.changeFilters(toggleCollapsedCommit(state.filters, collapsed))
        }
        return h('li', {}, [h(IconButton, { icon: 'expand', title: 'Expand', onClick: onExpandClick }), h(CommitPreview, { commit, onClick: () => {
          controller.select({ type: 'commit', id: collapsed })
        } })])
      }))
    ]
  ]);
};