import { h } from "@lukekaalim/act";

export type ThreadControlsProps = {
  onPlay: () => void,
  onPause: () => void,
  onStep: () => void,
  onPlay: () => void,
};

export const ThreadControls = () => {
  return [
    h('button', {}, 'Play'),
    h('button', {}, 'Pause'),
    h('button', {}, 'Step'),
    h('button', {}, 'Play To End'),
    h(PendingWorkNotifier),
  ]
};

const PendingWorkNotifier = () => {
  return 'pending';
}
