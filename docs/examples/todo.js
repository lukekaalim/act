// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import { h, useRef, useState } from '@lukekaalim/act';
import { useAnimatedList, useBezierAnimation } from '@lukekaalim/act-curve';

export const TodoManager/*: Component<{ initialTasks: string[] }>*/ = ({ initialTasks }) => {
  const [tasks, setTasks] = useState/*:: <string[]>*/(initialTasks);

  const onTaskComplete = (task) => () => {
    setTasks(tasks => tasks.filter(t => t !== task))
  }
  const onTaskCreate = (newTask) => {
    setTasks(tasks => [...tasks, newTask]);
  }

  const [taskAnimations] = useAnimatedList(tasks, initialTasks);

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
      h(NewTaskForm, { onCreate: onTaskCreate, tasks }),
      h('ul', { style: { overflow: 'auto', flexGrow: 1, margin: 0 }},
        taskAnimations
          .sort((a, b) => a.value.localeCompare(b.value))
          .map(animation =>
            h(Task, {
              status: animation.status,
              task: animation.value,
              onComplete: onTaskComplete(animation.value)
            })))
    ])
  ]
};

const NewTaskForm = ({ onCreate, tasks }) => {
  const [task, setTask] = useState('');

  const onSubmit = (event) => {
    event.preventDefault();
    onCreate(task.trim());
    setTask('');
  }

  const disabled = task.trim() === '' || tasks.includes(task.trim());

  return h('form', { onSubmit }, [
    h('input', { type: 'text', value: task, onInput: e => setTask(e.target.value) }),
    h('button', { type: 'submit', disabled }, '➕ Add Task'),
  ]);
}

const Task = ({ task, onComplete, status }) => {
  const liRef = useRef/*:: <?HTMLLIElement>*/(null);

  useBezierAnimation(status, status => {
    const { current: li } = liRef;
    if (!li)
      return;
    
    li.style.opacity = `${1 - Math.abs(status)}`;
    li.style.maxHeight = `${(1 - Math.abs(status)) * 40}px`;
    li.style.pointerEvents = status === 0 ? 'auto' : 'none';
  });

  return h('li', { ref: liRef }, h('div', {}, [
    h('button', { onClick: () => onComplete() }, '✅'),
    ' ',
    task,
  ]));
}