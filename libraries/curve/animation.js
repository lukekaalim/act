// @flow strict
/*:: import type { Context } from '@lukekaalim/act'; */
import { createContext, useContext, useEffect, useState } from "@lukekaalim/act";

/*::
export type Animation = {
  requestAnimationFrame: (animation: (now: DOMHighResTimeStamp) => void) => AnimationFrameID, 
  cancelAnimationFrame: (id: AnimationFrameID) => void, 
};
*/

export const animationContext/*: Context<Animation> */ = createContext({ requestAnimationFrame, cancelAnimationFrame });

export const useAnimation = (animation/*: ?(now: DOMHighResTimeStamp) => ?boolean*/ = null, deps/*: mixed[]*/ = [])/*: { refresh: () => void }*/ => {
  const { requestAnimationFrame, cancelAnimationFrame } = useContext(animationContext);
  const [start, setStart] = useState(performance.now());

  useEffect(() => {
    if (!animation)
      return;
    let id = null;
    const onAnimate = (now) => {
      const done = animation(now);
      if (!done)
        id = requestAnimationFrame(onAnimate);
    }
    id = requestAnimationFrame(onAnimate);

    return () => {
      if (id)
        cancelAnimationFrame(id);
    };
  }, [...deps, start]);

  return {
    refresh: () => setStart(performance.now()),
  }
};
