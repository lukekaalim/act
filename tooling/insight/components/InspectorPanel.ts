import { h } from '@lukekaalim/act';
import classes from './index.module.css';

export const InspectorPanel = () => {
  return h('div', { className: classes.panel }, [
    h('h4', {}, 'Inspector')
  ]);
}