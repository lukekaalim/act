// @flow strict
import { h, render } from '@lukekaalim/act/html';
import { Intro } from './intro';

const main = () => {
  const { body } = document;
  if (body)
    render(h(Intro), body);
};

main();