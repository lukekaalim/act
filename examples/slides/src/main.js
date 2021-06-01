// @flow strict
import { h } from '@lukekaalim/act';
import { render } from '@lukekaalim/act-web';
import { Intro } from './intro';

const main = () => {
  const { body } = document;
  if (body)
    render(h(Intro), body);
};

main();