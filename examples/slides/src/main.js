// @flow strict
import { h } from '@lukekaalim/act';
import { render } from '@lukekaalim/act-dom';
import { Intro } from './intro';

const main = () => {
  const { body } = document;
  if (body)
    render(h(Intro), body);
};

main();