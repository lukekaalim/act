// @flow strict
/*:: import type { Component } from '@lukekaalim/act'; */
import { h } from '@lukekaalim/act/html';
import { createContext } from '../../context';

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

const slideContext = createContext

const slideStyle = {
  width: '1024px',
  height: 'calc(512px + 256px)',
  'box-sizing': 'border-box',
  'background-color': '#d6d6f4',
  display: 'flex',
  'flex-direction': 'column',
  padding: '64px'
};
export const Slide/*: Component<null>*/ = (_, children) => {
  return h('section', { style: slideStyle }, children);
};

const titleSlideStyle = {
  ...slideStyle,
  'align-items': 'center',
  'justify-content': 'center',
}
export const TitleSlide/*: Component<null>*/ = (_, children) => {
  return h('section', { style: titleSlideStyle }, children);
};

const borderlessSlideStyle = {
  ...slideStyle,
  padding: 0,
};

export const BorderlessSlide /*: Component<null>*/ = (_, children) => {
  return h('section', { style: borderlessSlideStyle }, children);
};