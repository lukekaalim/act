import { h, useEffect, useState } from "@lukekaalim/act";
import { ssr } from '@lukekaalim/act-web';

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

export const App = () => {
  const [name, setName] = ssr.useState<string>("World");
  const [beerType, setBeerType] = ssr.useState<'ale' | 'stouts'>('ale');
  const [beers, setBeers] = ssr.useState<string[]>([]);

  const ready = ssr.useSSRReady();

  function onInput (event: Event) {
    setName((event.target as HTMLInputElement).value)
  }
  function onBeerTypeInput (event: Event) {
    setBeerType((event.target as HTMLInputElement).value as 'ale' | 'stouts')
  }

  ssr.useEffect(() => {
    fetch(`https://api.sampleapis.com/beers/${beerType}`)
      .then(r => r.json())
      .then((payload: { name: string }[]) => setBeers(payload.map(d => d.name)))
  }, [beerType])

  useEffect(() => {
    if (beers.length > 0)
      ready();
  }, [beers])

  return h('article', {}, [
    h('h1', {}, `Hello, ${name}`),
    h(ChildComponent),
    h('input', { type: 'text', value: name, onInput }),
    h('select', { onInput: onBeerTypeInput }, [
      h('option', { value: 'ale', selected: 'ale' === beerType }, ['ale']),
      h('option', { value: 'stouts', selected: 'stouts' === beerType }, 'stouts'),
    ]),
    h('ol', {}, beers.map(beer => h('li', {}, beer)))
  ])
};