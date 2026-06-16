import { Component, h } from "@lukekaalim/act"
import { ThreadReport } from "@lukekaalim/act-debug"

export type ThreadInspectorProps = {
  thread: ThreadReport
}

export const ThreadInspector: Component<ThreadInspectorProps> = ({ thread }) => {
  return h('div', {}, [
    h('span', {}, thread.id),
    h('span', {}, thread.passes),
  ])
}