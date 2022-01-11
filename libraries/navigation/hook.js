// @flow strict
/*:: import type { Navigation } from "./context"; */
import { useEffect, useMemo, useState } from "@lukekaalim/act";


export const useRootNavigation = (initialHref/*: string*/ = '', history/*: History*/ = window.history)/*: Navigation*/ => {
  const [location, setLocation] = useState(new URL(initialHref || document.location.href))

  const navigate = useMemo(() => (destination, title = '') => {
    history.pushState(null, title, destination.href);
    setLocation(destination);
  }, []);

  const navigation = useMemo(() => ({
    navigate,
    location,
  }), [navigate, location]);

  useEffect(() => {
    const onPopState = () => {
      setLocation(new URL(document.location.href));
    }
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    }
  }, []);

  return navigation;
};