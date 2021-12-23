// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import { h, useState, useEffect } from '@lukekaalim/act';

const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setData(null);
    setLoaded(false);

    fetch(url)
      .then(response => response.json())
      .then(json => (setData(json), setLoaded(true)))
  }, [url])

  if (!loaded)
    throw { type: 'loading', message: `loading ${url}` };
  
  return data;
}

const useDelay = () => {
  const [display, setDisplay] = useState(false);

  useEffect(() => {
    let id = setTimeout(() => {
      setDisplay(true);
      id = null;
    }, 2000);
    return () => {
      if (id)
        clearTimeout(id);
    }
  }, [])

  if (!display)
    throw { type: 'delayed', message: 'please wait 2000ms' }
};

const Suspender = ({ throwError, dataUrl }) => {
  const [value, setValue] = useState(1);

  if (throwError)
    throw new Error('My Error was Thrown')

  const testData = useFetch(`https://jsonplaceholder.typicode.com/todos/${value}`);

  return [
    h('pre', {}, JSON.stringify(testData, null, 2)),
    h('p', {}, 'I am the child!'),
    h('p', {}, 'This component won\'t throw an error... yet.'),
    h('button', { onClick: () => setValue(value + 1) }, `Increment Internal State: ${value}`)
  ];
}

const SuspensionError = ({ value }) => {
  if (value.type === 'loading')
    return h('progress');
  return h('pre', {}, value.message);
}

export const SuspensionTest/*: Component<>*/ = () => {
  const [throwError, setThrowError] = useState(false);
  const [dataUrl, setDataUrl] = useState('https://jsonplaceholder.typicode.com/todos/1');
  
  return [
    h('h1', {}, 'Error Boundary Tests'),
    h('label', {}, [
      'Throw Error in Child Component',
      h('input', { type: 'checkbox', checked: throwError, onChange: e => setThrowError(e.target.checked) }),
    ]),
    h('label', {}, [
      'Data URL',
      h('input', { type: 'text', value: dataUrl, onChange: e => setDataUrl(e.target.value) }),
    ]),
    h('act:boundary', { fallback: SuspensionError }, [
      h('div', { style: { border: '1px solid black' }}, [
        h(Suspender, { throwError, dataUrl }),
      ])
    ])
  ];
};