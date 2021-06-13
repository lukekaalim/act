// @flow strict
import { useEffect, useState } from "@lukekaalim/act";

const createCurve = (applyCurve/*: (el: HTMLElement, t: number) => mixed*/) => {
  return applyCurve;
};

const textCurve = createCurve((el, v) => el.textContent = v.toString());

const easeInOutCubic = (x/*: number*/)/*: number*/ => (
  x < 0.5 ?
    (4 * x * x * x) :
    (1 - Math.pow(-2 * x + 2, 3) / 2)
)
const getProgress = (start, duration) => Math.min((Date.now() - start) / duration, 1);
const cubicEaseInterpolate = (start, end, t) => start + easeInOutCubic(t) * (end - start);

export const useCurve = (nextValue/*: number*/, el/*: ?HTMLElement*/) => {
  const duration = 1000;
  const [[startTarget, endTarget], setTargets] = useState/*:: <[number, number]>*/([nextValue, nextValue]);
  const [startTime, setStartTime] = useState(0);
  useEffect(() => {
    if (!el)
      return;
    const newStartValue = cubicEaseInterpolate(startTarget, endTarget, getProgress(startTime, duration));
    const newEndValue = nextValue;
    const newStartTime = Date.now();
    setStartTime(newStartTime);
    setTargets([newStartValue, newEndValue]);

    const onFrame = () => {
      const v = cubicEaseInterpolate(newStartValue, newEndValue, getProgress(newStartTime, duration));
      textCurve(el, v);
      if (v !== newEndValue)
        id = requestAnimationFrame(onFrame);
    };
    let id = requestAnimationFrame(onFrame);
    return () => cancelAnimationFrame(id);
  }, [nextValue, el]);
};
