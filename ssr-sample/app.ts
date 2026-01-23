import { h, useEffect, useState } from "@lukekaalim/act";

const ChildComponent = () => {
  const [clicked, setClicked] = useState(0);
  const background = `hsl(${Math.random() * 360}deg  50% 50%)`;

  function onClick() {
    setClicked(c => c + 1)
  }

  return h('button', { style: { background }, onClick }, `Clicked ${clicked} times!`)
}

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | ReadonlyArray<JSONValue>
  | { [key: string]: JSONValue }

export const App = ({ done, useSSREffect, useSSRState }: { done: () => void, useSSRState: <T extends JSONValue>(key: string, initial: T) => [T, (v: T) => void] }) => {
  const [name, setName] = useState("World");
  const [beers, setBeers] = useSSRState<string[]>('beers', []);

  function onInput (event: Event) {
    setName((event.target as HTMLInputElement).value)
  }

  useSSREffect(() => {
    fetch('https://api.sampleapis.com/beers/ale')
      .then(r => r.json())
      .then(payload => setBeers(payload.map(d => d.name)))
  }, [])

  useEffect(() => {

    if (beers.length > 0)
      done();

  }, [beers])

  return h('article', {}, [
    h('h1', {}, `Hello, ${name}`),
    h(ChildComponent),
    h('input', { type: 'text', value: name, onInput }),
    h('ol', {}, beers.map(beer => h('li', {}, beer)))
  ])
};