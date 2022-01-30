// @flow strict

import { useEffect, useState } from "@lukekaalim/act";

export const useIntervals = (times/*: DOMHighResTimeStamp[]*/)/*: DOMHighResTimeStamp*/ => {
  const [renderTime, setRenderTime] = useState(performance.now());
  useEffect(() => {
    const now = performance.now();
    const intervals = times
      .filter(time => time >= now)
      .map(time => setInterval(() => setRenderTime(time), time - now))

    return () => {
      for (const interval of intervals)
        clearInterval(interval)
    }
  }, [...times])
  return renderTime;
};
