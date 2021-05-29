// @flow strict

/*::
export type Props = { +[string]: mixed };
*/

export const isPropsEqual = (propsA/*: Props*/, propsB/*: Props*/)/*: boolean*/ => {
  if (propsA === propsB)
    return true;
  const keysA = Object.keys(propsA);
  const keysB = Object.keys(propsB);

  if (keysA.length !== keysB.length)
    return false;

  for (let key of keysA)
    if (propsA[key] !== propsB[key])
      return false;

  return true;
};

/*::
export type PropDiff = {
  key: string,
  prev: mixed,
  next: mixed,
};
*/

export const calculatePropsDiff = (prevProps/*: Props*/, nextProps/*: Props*/)/*: Map<string, PropDiff>*/ => {
  const diff = new Map();

  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  for (let i = 0; i < prevKeys.length; i++) {
    const key = prevKeys[i];

    const prev = prevProps[key];
    const next = (key in nextProps) ? nextProps[key] : null;
    if (prev !== next)
      diff.set(key, { key, prev, next });
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];

    const next = nextProps[key];
    if (!(key in prevProps))
      diff.set(key, { key, prev: null, next });
  }

  return diff;
};
