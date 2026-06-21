import { Component, h, OpaqueID } from "@lukekaalim/act"
import { icons } from "../assets/icons"
import classes from './index.module.css';
import { CommitID, EffectID } from "@lukekaalim/act-recon";

export type IconButtonProps = {
  icon: keyof typeof icons,

  onClick(): void,
  title?: string,
  className?: string,
}

export const IconButton: Component<IconButtonProps> = ({ icon, onClick, title, className, children }) => {
  return h('button', { onClick, classList: [classes.iconButton, className || ''] }, [
    h('img', { title: title || '', src: icons[icon] }),
    children
  ])
}


export type HookButtonProps = {
  hookIndex: number,

  onClick(): void,
}
export const HookButton: Component<HookButtonProps> = ({ onClick, hookIndex }) => {
  return h(IconButton, { icon: 'hook', onClick }, `hook#${hookIndex}`)
}
export type EffectButtonProps = {
  effectId: EffectID,
  
  onClick(): void,
}
export const EffectButton: Component<EffectButtonProps> = ({ onClick, effectId }) => {
  return h(IconButton, { icon: 'effect', onClick }, `effect#${effectId}`)
}
export type ThreadButtonProps = {
  threadId: OpaqueID<"ThreadID">,
  
  onClick(): void,
}
export const ThreadButton: Component<ThreadButtonProps> = ({ onClick, threadId }) => {
  return h(IconButton, { icon: 'thread', onClick }, `thread#${threadId}`)
}
export type CommitButtonProps = {
  commitId: CommitID,
  
  onClick(): void,
}
export const CommitButton: Component<CommitButtonProps> = ({ onClick, commitId }) => {
  return h(IconButton, { icon: 'commit', onClick }, `commit#${commitId}`)
}