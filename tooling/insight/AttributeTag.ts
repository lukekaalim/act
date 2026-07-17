import { Component, h } from "@lukekaalim/act";
import classes from './AttributeTag.module.css';
import stringHash from "@sindresorhus/string-hash";
import { html } from "@lukekaalim/act-web";

export type CommitAttributeTagProps = {
  name: string,
  value: string,
}

export const CommitAttributeTag: Component<CommitAttributeTagProps> = ({ name, value }) => {
  const background = `hsl(${stringHash(name) % 360}deg, 50%, 50%)`;
  return h(html.span, { className: classes.commitAttributeTag, style: { background } }, [
    h('span', { className: classes.commitAttributeTagName }, name),
    h('span', { className: classes.commitAttributeTagValue }, value),
  ])
}