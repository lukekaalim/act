// @flow strict
/*:: import type { UseEffectData } from './hooks/useEffect.js'; */
/*:: import type { UseContextData } from './hooks/useContext.js'; */
/*:: import type { UseStateData } from './hooks/useState.js'; */
import { createId } from '@lukekaalim/act';

/*::
export opaque type StateID: string = string;
export opaque type StatePath: StateID[] = StateID[];

export type ComponentState = {|
  path: StatePath,
  id: StateID,
  useEffectData: UseEffectData,
  useStateData: UseStateData,
  useContextData: UseContextData,
|};
*/
export const generateStateID = ()/*: StateID*/ => createId();
export const generateStatePath = (
  id/*: StateID*/,
  prevPath/*: StatePath*/ = []
)/*: StatePath*/ => [...prevPath, id];
