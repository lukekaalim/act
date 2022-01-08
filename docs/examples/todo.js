// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import { h, useState } from '@lukekaalim/act';

export const TodoManager/*: Component<{ initialTasks: string[] }>*/ = ({ initialTasks }) => {
  const [tasks, setTasks] = useState(initialTasks);

  const onTaskComplete = (task) => () => {
    setTasks(tasks => tasks.filter(t => t !== task))
  }
  const onTaskCreate = (newTask) => {
    setTasks(tasks => [...tasks, newTask]);
  }

  return [
    h('div', { style: {
      width: '405px', height: '190px',
      overflow: 'hidden',
      padding: '1em',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    } }, [
      h('h3', { style: { margin: 0 }}, 'TODO'),
      h(NewTaskForm, { onCreate: onTaskCreate }),
      h('ul', { style: { overflow: 'auto', flexGrow: 1, margin: 0 }}, tasks.map(task =>
        h('li', {}, h(Task, { task, onComplete: onTaskComplete(task) }))))
    ])
  ]
};

const NewTaskForm = ({ onCreate }) => {
  const [task, setTask] = useState('');

  const onSubmit = (event) => {
    event.preventDefault();
    onCreate(task);
    setTask('');
  }

  return h('form', { onSubmit }, [
    h('input', { type: 'text', value: task, onChange: e => setTask(e.target.value) }),
    h('button', { type: 'submit' }, '➕ Add Task'),
  ]);
}

const Task = ({ task, onComplete }) => {
  return h('div', {}, [
    h('button', { onClick: () => onComplete() }, '✅'),
    ' ',
    task,
  ]);
}