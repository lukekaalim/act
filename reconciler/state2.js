// @flow strict
/*:: import type { UseEffectData } from './hooks/useEffect.js'; */
/*:: import type { UseContextData } from './hooks/useContext.js'; */
/*:: import type { UseStateData } from './hooks/useState.js'; */
import { nanoid } from 'nanoid/non-secure';

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
export const generateStateID = ()/*: StateID*/ => nanoid(8);
export const generateStatePath = (
  id/*: StateID*/,
  prevPath/*: StatePath*/ = []
)/*: StatePath*/ => [...prevPath, id];
