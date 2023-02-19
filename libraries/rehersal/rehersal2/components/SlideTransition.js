// @flow strict

import { h, useEffect, useRef, useState, createId } from "@lukekaalim/act";
import { createInitialCubicBezierAnimation, interpolateCubicBezierAnimation, useAnimatedList, useBezierAnimation } from "@lukekaalim/act-curve";
import styles from './SlideTransition.module.css';

/*::
import type { CubicBezierAnimation } from "@lukekaalim/act-curve";
import type { ElementNode, Ref, Component } from "@lukekaalim/act";

type TransitionID = string;
type SlideTransitionState = {
  transitionId: TransitionID,
  content: ElementNode,
  contentKey: string,
  position: 'entering' | 'exiting',
  animation: CubicBezierAnimation,
}

export type SlideTransitionProps = {
  content: ElementNode,
  contentKey: string,
};
*/
const isStateValid = (state/*: SlideTransitionState*/, now/*: DOMHighResTimeStamp*/)/*: boolean*/ => {
  const { start, durationMs } = state.animation.span;
  return start + durationMs < now;
}

export const useSlideTransitionState = (
  state/*: SlideTransitionState*/,
  ref/*: ?Ref<?HTMLElement>*/ = null
)/*: Ref<?HTMLElement>*/ => {
  const localRef = useRef();
  const actualRef = ref || localRef;

  useBezierAnimation(state.animation, point => {
    const { current: element } = actualRef;
    if (!element) 
      return;
    element.style.opacity = (1 - Math.abs(point.position)).toString();
    element.style.transform = `translateX(${point.position * 100}px)`;
    if (point.position >= 1)
      element.style.display = 'none';
  });

  return actualRef;
}

export const SlideTransition/*: Component<SlideTransitionProps>*/ = ({ content, contentKey }) => {

  const [transitionState, setTransitionState] = useState/*:: <?SlideTransitionState>*/(null);
  const [prevStates, setPrevStates] = useState/*:: <SlideTransitionState[]>*/([]);

  useEffect(() => {
    if (!transitionState) {
      setTransitionState({
        transitionId: createId(),
        content,
        contentKey,
        animation: createInitialCubicBezierAnimation(0),
        position: 'entering',
      });
      return;
    }
    const now = performance.now();
    const prevTransitionState = {
      ...transitionState,
      position: 'exiting',
      animation: interpolateCubicBezierAnimation(transitionState.animation, 1, 400, 3, now)
    };
    const nextTransitionState = {
      transitionId: createId(),
      content,
      contentKey,
      animation: interpolateCubicBezierAnimation(createInitialCubicBezierAnimation(-1), 0, 400, 3, now),
      position: 'entering',
    };

    setPrevStates(prev => [...prev.filter(isStateValid), prevTransitionState]);
    setTransitionState(nextTransitionState);
  }, [contentKey])

  return h('div', { class: styles.transitionContainer }, [
    !!transitionState && h(SlideContainer, { transitionState, key: transitionState.transitionId }),
    ...prevStates.map(transitionState =>
      h(SlideContainer, { transitionState, key: transitionState.transitionId }))
  ]);
};

const SlideContainer = ({ transitionState }) => {
  const ref = useSlideTransitionState(transitionState);
  return h('div', { ref, class: styles.slideContainer }, transitionState.content);
}