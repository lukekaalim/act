import breakpoint_arrow_paused from './breakpoint_arrow_paused.svg';
import breakpoint_arrow from './breakpoint_arrow.svg';
import breakpoint_panel from './breakpoint_panel.svg';
import breakpoint_unset from './breakpoint_unset.svg';
import breakpoint from './breakpoint.svg';
import bug from './bug.svg';
import children from './children.svg';
import collapse from './collapse.svg';
import commit_tree from './commit_tree.svg';
import expand from './expand.svg';
import eye from './eye.svg';
import filter from './filter.svg';
import graph from './graph.svg';
import history_list from './history_list.svg';
import inspector_panel from './inspector_panel.svg';
import magnifying_glass from './magnifying_glass.svg';
import pause from './pause.svg';
import play from './play.svg';
import reload from './reload.svg';
import selection from './selection.svg';
import side_effects from './side_effects.svg';
import skip from './skip.svg';
import step from './step.svg';
import step_over_children from './step_over_children.svg'
import tree_column from './tree_column.svg';
import tree_end from './tree_end.svg';
import tree_junction from './tree_junction.svg';

export const icons = {
  breakpoint_arrow_paused,
  breakpoint_arrow,
  breakpoint_panel,
  breakpoint_unset,
  breakpoint,
  bug,
  children,
  collapse,
  commit_tree,
  expand,
  eye,
  filter,
  graph,
  history_list,
  inspector_panel,
  magnifying_glass,
  pause,
  play,
  reload,
  selection,
  side_effects,
  skip,
  step,
  step_over_children,
  tree_column,
  tree_end,
  tree_junction
}

for (const icon of Object.keys(icons) as (keyof typeof icons)[]) {
  icons[icon] = new URL(icons[icon], location.href).href;
}