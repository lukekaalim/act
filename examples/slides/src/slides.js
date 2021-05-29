// @flow strict
/*:: import type { Component, ComponentHooks } from '@lukekaalim/act'; */
import { h, createContext } from '@lukekaalim/act';

/*::
export type SlideControlsProps = {|
  visible?: boolean,
  count: number,
  index: number,
  onIndexChange: number => mixed
|};
*/

const buttonStyle = {
  flexGrow: 1
};

/*::
export type UseSlideState = (active: boolean, states: number) => number; 
*/

export const loadUseSlideState = ({ useState, useEffect }/*: ComponentHooks*/)/*: UseSlideState*/ => (active, max) => {
  const [slideState, setSlideState] = useState(0);
  useEffect(() => {
    const keydownListener = (e) => {
      if (document.activeElement instanceof HTMLInputElement)
        return;
      if (!active)
        return;
      switch (e.keyCode) {
        case 40:
        case 83:
          return setSlideState(Math.min(max, slideState + 1))
        case 38:
        case 87:
          return setSlideState(Math.max(0, slideState - 1))
      }
    };
    window.addEventListener('keydown', keydownListener);
    return () => window.removeEventListener('keydown', keydownListener);
  }, [active, max, slideState])

  return slideState;
};

export const SlideControls/*: Component<SlideControlsProps>*/ = ({ onIndexChange, count, index, visible = true }, [], { useEffect }) => {
  const onRangeChange = (e) => {
    onIndexChange(e.currentTarget.valueAsNumber);
  };
  const onButtonPress = (index) => (e) => {
    onIndexChange(index);
  }
  const onNextPress = () => {
    onIndexChange(index + 1);
  }
  const onPreviousPress = () => {
    onIndexChange(index - 1);
  }
  useEffect(() => {
    const keydownListener = (e) => {
      if (document.activeElement instanceof HTMLInputElement)
        return;
      if (document.activeElement instanceof HTMLTextAreaElement)
        return;
      switch (e.keyCode) {
        case 65:
        case 37:
          return index > 0 && onIndexChange(index - 1)
        case 68:
        case 39:
          return index < (count - 1) && onIndexChange(index + 1)
      }
    };
    window.addEventListener('keydown', keydownListener);
    return () => window.removeEventListener('keydown', keydownListener);
  }, [index])

  if (!visible)
    return null;
  
  return h('section', { className: 'slide-controls' }, [
    h('div', { className: 'slide-controls-list', style: { display: 'flex' } }, [
      Array.from({ length: count })
        .map((_, slideIndex) =>
          h('button', { style: buttonStyle, disabled: index === slideIndex, onclick: onButtonPress(slideIndex) }, slideIndex.toString()))
    ]),
    h('div', {}, [
      h('input', { onInput: onRangeChange, type: 'range', style: { width: '100%' }, min: 0, max: count - 1, step: 1, value: index })
    ]),
    h('div', {}, [
      h('button', { disabled: index === 0, onclick: onPreviousPress }, 'Previous Slide'),
      h('button', { disabled: index === (count - 1), onclick: onNextPress }, 'Next Slide'),
    ]),
  ])
};

const slideStyle = {
  width: '1024px',
  height: 'calc(512px + 256px)',
  'box-sizing': 'border-box',
  'background-color': '#d6d6f4',
  display: 'flex',
  'flex-direction': 'column',
  padding: '64px'
};
export const Slide/*: Component<{}>*/ = (_, children) => {
  return h('section', { style: slideStyle }, children);
};

const titleSlideStyle = {
  ...slideStyle,
  'align-items': 'center',
  'justify-content': 'center',
}
export const TitleSlide/*: Component<{}>*/ = (_, children) => {
  return h('section', { style: titleSlideStyle }, children);
};

const borderlessSlideStyle = {
  ...slideStyle,
  padding: 0,
};

export const BorderlessSlide /*: Component<{}>*/ = (_, children) => {
  return h('section', { style: borderlessSlideStyle }, children);
};

const slideShowItemDefaultType = {
  transition: 'opacity 0.5s, transform 0.5s'
};

const presenterStyle = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  overflow: 'hidden',
  width: '100vw',
  perspective: '100vw',
};
const sliderDefaultStyle = {
  display: 'flex',
  listStyle: 'none',
  width: '1024px',
  margin: 0,
  padding: 0,
  flexDirection: 'row',
  transition: 'transform 0.5s',
  transformStyle: 'preserve-3d'
};

/*::
export type SlideType =
  | 'plain'
  | 'title'
  | 'borderless'
export type SlideShowProps = {|
  slides: [SlideType, Component<{ active: boolean }>][],
  index: number,
|};
*/

const getSlideComponent = slideType => {
  switch (slideType) {
    case 'plain':
      return Slide;
    case 'title':
      return TitleSlide;
    case 'borderless':
      return BorderlessSlide;
  }
}

export const SlideShow/*: Component<SlideShowProps>*/ = ({ slides, index }) => {
  const transform = `translate3d(-${index * 1024}px, 0px, 0px)`;
  const sliderStyle = { ...sliderDefaultStyle, transform };

  return h('section', { style: presenterStyle }, h('ul', { style: sliderStyle }, slides.map(([type, slide], slideIndex) => {
    const distance = index - slideIndex;
    const absDistance = Math.abs(distance);
    const distanceUnit = (distance / absDistance) || 1;
    const clampedDistance = Math.min(absDistance, 2);
    
    const transform = `scale(${1 - (clampedDistance * 0.1)}) rotateY(${-(distanceUnit * clampedDistance) * 20}deg) translateZ(${-clampedDistance * 200}px)`;
    const opacity = Math.max(1 - (clampedDistance * 0.4), 0);
    const style = { ...slideShowItemDefaultType, opacity, transform, zIndex: slideIndex === index ? 1 : 0 }

    const slideComponent = getSlideComponent(type);

    return h('li', { style }, h(slideComponent, {}, h(slide, { active: index === slideIndex })));
  })))
};