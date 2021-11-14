// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
/*:: import type { Page } from '../entry.js'; */
import { h, useState } from '@lukekaalim/act';
import { Document } from '@lukekaalim/act-rehersal';

const text = `
# Quickstart

Follow this guide to create a act-powered website quickly without much fuss.

## Initialization

Find a nice space to work with on your computer.
Maybe \`~/projects/my-first-act\`?

Initialize our npm package.

${'```'}
npm init
${'```'}

Follow the instructions, naming your project whatever you link.
The entry point isn't important, nor is the test command for now.

## Dependencies

Lets install our dependencies:
 - \`@lukekaalim/act\` (generic element building)
 - \`@lukekaalim/act-web\` (specific act tool for building websites)

And we'll use the tool \`vite\` to bundle our site into something hostable.

${'```'}
npm i @lukekaalim/act @lukekaalim/act-web
npm i -D vite
${'```'}

And lets add a build and dev step to our package.json

${'```'}
"scripts": {
  "dev": "vite",
  "build": "vite build"
},
${'```'}

## Entrypoints

Lets drop in our entrypoints.
Vite uses html as an entrypoint, so we'll create a file called index.html.

${'```'}
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>My Website</title>
    <script async type="module" src="./entry.js"></script>
    </style>
  </head>
  <body></body>
</html>
${'```'}

You can see we also reference a script called entry.js, so lets make that as well.


${'```'}
const main = () => {
  // application logic
};

main();
${'```'}

Alright, now we have a good basis for making an application. Lets add the act bits now.

> You can now run \`npm run dev\` and crack open the localhost link to preview our changes as we make them.

## Application

Inside that entry.js, lets create our application component. Lets import "h" to create some basic elements.

${'```'}
import { h } from '@lukekaalim/act';

const Application = () => {
  return h('main', {}, [
    h('h1', {}, 'My first act!'),
    h('p', {}, 'This is some sample text!'),
  ])
};
${'```'}

Lets now render this application directly into the body. First, lets import our renderer.
${'```'}
import { render } from '@lukekaalim/act-web';
${'```'}

Then, update our main function.

${'```'}
const main = () => {
  const { body } = document;
  if (body)
    render(h(Application), body);
};

main();
${'```'}

And voila! You should now see the test elements we've thrown together.

## State

And for kicks, let show off some state and styling.

Update our act import to add the "useState" hook alongside "h".
${'```'}
import { h, useState } from '@lukekaalim/act';
${'```'}

And lets update our application to use a _color_.

${'```'}
const Application = () => {
  const [color, setColor] = useState('black');

  const onInput = (event) => {
    setColor(event.target.value)
  }

  return h('main', { style: { color } }, [
    h('h1', {}, 'My first act!'),
    h('p', {}, 'This is some sample text!'),
    h('label', {}, [
      h('div', {}, 'Change the text color!'),
      h('input', { type: 'color', value: color, onInput }),
    ])
  ])
};
${'```'}

And your final application should look somthing like what's attached below.

Congrats! You're done.

---

`;

const ApplicationExample = () => {
  const [color, setColor] = useState('black');

  const onInput = (event) => {
    setColor(event.target.value)
  }

  return h('main', { style: { color } }, [
    h('h1', {}, 'My first act!'),
    h('p', {}, 'This is some sample text!'),
    h('label', {}, [
      h('div', {}, 'Change the text color!'),
      h('input', { type: 'color', value: color, onInput }),
    ])
  ])
};

export const quickstartPage/*: Page*/ = {
  link: {
    name: 'Quickstart',
    href: '/quickstart',
    children: [],
  },
  content: [
    h(Document, { text }),
    h(ApplicationExample)
  ]
};