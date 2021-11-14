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

export const useRootNavigation = (initialHref/*: string*/ = '', history/*: History*/ = window.history)/*: Navigation*/ => {
  const [location, setLocation] = useState(new URL(initialHref || document.location.href))

  const navigate = useMemo(() => (destination, title = '') => {
    history.pushState(null, title, destination.href);
    setLocation(destination);
  }, []);

  const navigation = {
    navigate,
    location,
  };

  return navigation;
};

export const NavigationProvider/*: Component<{ history?: History, initialHref?: string  }>*/ = ({ children, history, initialHref }) => {
  const navigation = useRootNavigation(initialHref, history);
  return h(navigationContext.Provider, { value: navigation }, children);
};