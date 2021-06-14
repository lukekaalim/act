// @flow strict
import { useEffect, useMemo, useRef, useState } from "@lukekaalim/act";

const easeInOutCubic = (x/*: number*/)/*: number*/ => (
  x < 0.5 ?
    (4 * x * x * x) :
    (1 - Math.pow(-2 * x + 2, 3) / 2)
)
const getProgress = (start, duration) => Math.min((Date.now() - start) / duration, 1);
const interpolate = (start, end, t, easer) => start + easer(t) * (end - start);

export const useCurve = (
  nextValue/*: number*/,
  applyCurve/*: (v: number) => mixed*/,
  { duration = 1000, easer = easeInOutCubic  }/*: { duration?: number, easer?: number => number }*/ = {},
) => {
  const { current: curveState } = useRef({ targets: [nextValue, nextValue], startTime: 0 } );

  useEffect(() => {
    if (isNaN(nextValue))
      return;
    if (nextValue !== curveState.targets[1]) {
      const newStartValue = interpolate(
        curveState.targets[0],
        curveState.targets[1],
        getProgress(curveState.startTime, duration),
        easer
      );
      curveState.startTime = Date.now();
      curveState.targets = [newStartValue, nextValue];
    }

    const onFrame = () => {
      const t = getProgress(curveState.startTime, duration)
      const v = interpolate(curveState.targets[0], curveState.targets[1], t, easer);
      applyCurve(v);
      if (t < 1)
        id = requestAnimationFrame(onFrame);
    };
    let id = requestAnimationFrame(onFrame);
    return () => cancelAnimationFrame(id);
  }, [nextValue, applyCurve, duration, easer]);
};

const entries = /*:: <V>*/(a/*: { +[string]: V }*/)/*: [string, V][]*/ => (Object.entries(a)/*: any*/);

export const useCurves = /*:: <T: { +[string]: number }>*/(
  curves/*: T*/,
  applyCurves/*: T => mixed*/,
  { duration = 1000, easer = easeInOutCubic  }/*: { duration?: number, easer?: number => number }*/ = {},
) => {
  const curveEntries = entries(curves);
  const { current: curveStates } = useRef/*:: <Map<string, { targets: [number, number ], start: number }>>*/(
    new Map(curveEntries.map(([n, v]) => [n, { start: 0, targets: [v, v] }]))
  );

  useEffect(() => {
    for (const [prop, newValue] of curveEntries) {
      if (isNaN(newValue))
        continue;
      const oldState = curveStates.get(prop);
      if (!oldState || newValue !== oldState.targets[1]) {
        if (oldState) {
          const t = getProgress(oldState.start, duration)
          const v = interpolate(oldState.targets[0], oldState.targets[1], t, easer);
          oldState.start = Date.now();
          oldState.targets = [v, newValue];
        } else {
          curveStates.set(prop, { start: Date.now(), targets: [newValue, newValue] })
        }
      }
    }

    const onFrame = () => {
      const minStart = Math.max(...[...curveStates].map(([_, s]) => s.start));
      const minT = getProgress(minStart, duration)

      const value = {};
      for (const [prop, { targets, start }] of curveStates) {
        const t = getProgress(start, duration)
        const v = interpolate(targets[0], targets[1], t, easer);
        value[prop] = v;
      }
      applyCurves((value/*: any*/));
      if (minT < 1)
        id = requestAnimationFrame(onFrame);
    };
    let id = requestAnimationFrame(onFrame);
    return () => cancelAnimationFrame(id);
  }, [applyCurves, curves, duration, easer]);
};