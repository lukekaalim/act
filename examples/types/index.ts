import { h, Component, useState, useEffect, useRef, Ref } from '@lukekaalim/act';
import { render as renderWeb } from '@lukekaalim/act-web';
import { render as renderThree } from '@lukekaalim/act-three';
import '@lukekaalim/act-renderer-core';


const MyNestedApp: Component<{ brah: string, ref: Ref<Symbol> }> = ({ brah }) => {
  return brah;
};

const App: Component<{ count: number }> = ({ children, count }) => {
  const [greeting, setGreeting] = useState('hello')

  useEffect(() => {
    setGreeting('Infinite looooooop!')
    setGreeting(s => s + ' And again!')

    return () => {
      'what?'
    }
  }, [10])

  const ref = useRef(Symbol());

  return h('div', {}, [
    'Yo!',
    true && 'Whassup',
    false,
    null,
    true && [
      h(MyNestedApp, { brah: 'wee', ref }),
      0,
    ],
    children,
  ]);
};

renderThree(h(App, { count: 10 }), document.body);