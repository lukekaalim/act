import { Component, h } from "@lukekaalim/act"
import { icons } from "../assets/icons"
import classes from './index.module.css';

export type IconButtonProps = {
  icon: keyof typeof icons,

  onClick(): void,
  title?: string,
  className?: string,
}

export const IconButton: Component<IconButtonProps> = ({ icon, onClick, title, className }) => {
  return h('button', { onClick, classList: [classes.iconButton, className || ''] },
    h('img', { title: title || '', src: icons[icon] }))
}
