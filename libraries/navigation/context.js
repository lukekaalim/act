// @flow strict
/*:: import type { Context, Component } from '@lukekaalim/act'; */
import { h, createContext, useState, useMemo } from '@lukekaalim/act';

/*::
export type Navigation = {
  navigate: (destination: URL, title?: string) => mixed,
  location: URL,
};

export type History = {
  pushState: (state: ?mixed, title: ?string, destination?: string) => void,
};
*/

export const navigationContext/*: Context<?Navigation>*/ = createContext();
