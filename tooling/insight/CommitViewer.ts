import { Component, Deps, h, Ref, refSymbol, useState } from "@lukekaalim/act";
import { Commit, CommitID, CommitTree, Reconciler } from "@lukekaalim/act-recon";
import { hs } from "@lukekaalim/act-web"
import { getElementName } from "./utils";
import { CommitAttributeTag } from "./AttributeTag";
import classes from './CommitViewer.module.css';
import { CommitReport, CommitStateReport, ValueReport } from "@lukekaalim/act-debug";

export type CommitViewerProps = {
  commit: CommitReport,
  state: CommitStateReport,
};

export const CommitViewer: Component<CommitViewerProps> = ({ commit, state }) => {

  const isRef = (value: unknown): value is Ref<unknown> => (
    typeof value === 'object' && !!value && (refSymbol in value)
  );

  //const refs = state && [...state.values]
  //  .filter(([id, value]) => isRef(value))

  const [, setRender] = useState(0);
  const rerender = () => {
    setRender(r => r + 1);
  }

  return hs('div', { className: classes.commitViewer }, [
    hs('h3', {}, commit.element.type),
    hs('div', {}, [
      h(CommitAttributeTag, { name: 'Version', value: commit.version.toString() }),
      h(CommitAttributeTag, { name: 'ID', value: commit.id.toString() }),
      //!!state.props.key && [
      //  h(CommitAttributeTag, { name: 'Key', value: getValueName(commit.element.props.key) }),
      //]
    ]),
    state.props.length > 0 && [
      hs('h4', {}, 'Props'),
      hs('ul', {}, state.props.map(prop => 
        hs('li', {}, [
          h(CommitAttributeTag, { name: 'Key', value: prop.name }),
          h(CommitAttributeTag, { name: 'Value', value: getTextForValue(prop.value) }),
        ]))),
    ],
    state.values.length && [
      hs('h4', {}, 'useState'),
      hs('ul', {}, state.values.map(value => 
        hs('li', {}, [
          h(CommitAttributeTag, { name: 'Key', value: value.id.toString() }),
          h(CommitAttributeTag, { name: 'Value', value: getTextForValue(value.value) }),
        ]))),
    ],
  ])
}

export type ValueViewerProps = {
  value: ValueReport,
}

export const getTextForValue = (value: ValueReport) => {
  switch (value.type) {
    case 'primitive':
      switch (typeof value.value) {
        case 'object':
          return `null`;
        case 'string':
        case 'boolean':
        case 'number':
          return value.value.toString();
      }
    case 'complex':
      return value.name;
    case 'undefined':
      return `undefined`;
    default:
      return `${value.type}`;
  }
}

export const getValueName = (value: unknown) => {
  switch (typeof value) {
    case 'object':
      if (!value)
        return 'null';
      if (Array.isArray(value))
        return `Array[${value.length}]`;
      if (value.constructor === ({}).constructor)
        return JSON.stringify(value, null, 2);

      return value.constructor.name;
    case undefined:
      return 'undefined';
    case 'string':
    case 'number':
    case 'boolean':
    case 'symbol':
      return (value as string | number | boolean | symbol).toString();
    case 'function':
      return `${(value as Function).name || 'Function'}()`;
    default:
      console.log(value);
      return typeof value
  }
}