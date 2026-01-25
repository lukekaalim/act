import {
  calculateDepsChange,
  Component, Context, createContext, EffectConstructor, h, primitiveNodeTypes, runUpdater, specialNodeTypes, StateSetter, Updater,
  useContext, useEffect, useMemo, useRef, useState, ValueOrCalculator
} from "@lukekaalim/act";

import { CommitID, ComponentState, HookID, useInternalComponentState } from "@lukekaalim/act-recon";

export type SSRComponentData = {
  id: CommitID,
  values: Map<HookID, JSONValue>,
  deps: Map<HookID, PrimitiveJSONValue[]>,
};

export type SSRContext = {
  components: Map<CommitID, SSRComponentData>,
  contexts: Map<CommitID, JSONValue>,

  commits: Map<CommitID, DehydratedCommit>,
  mounts: CommitID[],

  contextCommitID: CommitID | null,

  mode: 'server' | 'client',

  readyForServer(): void
};
// the serializable form of the SSR context
export type SSRPayload = {
  contextCommitID: CommitID | null,
  commits: DehydratedCommit[],
  mounts: CommitID[],
  components: SSRComponentPayload[],
  contexts: [CommitID, JSONValue][],
}
export type SSRComponentPayload = {
  id: CommitID,
  values: [HookID, JSONValue][],
  deps: [HookID, PrimitiveJSONValue[]][],
}
export const serializeSSRContext = (context: SSRContext): SSRPayload => {
  return {
    contextCommitID: context.contextCommitID,
    commits: [...context.commits.values()],
    mounts: context.mounts,
    components: [...context.components.values()].map(component => {
      return {
        id: component.id,
        values: [...component.values.entries()],
        deps: [...component.deps.entries()],
      } as SSRComponentPayload
    }),
    contexts: [...context.contexts.entries()]
  }
}

export const deserializeSSRPayload = (payload: SSRPayload, mode: 'server' | 'client', readyForServer: () => void): SSRContext => {
  return {
    contextCommitID: payload.contextCommitID,
    mode,
    readyForServer,
    commits: new Map(payload.commits.map(c => [c.id, c])),
    mounts: payload.mounts,
    components: new Map(payload.components.map(c => ([c.id, {
      id: c.id,
      values: new Map(c.values),
      deps: new Map(c.deps),
    } as SSRComponentData]))),
    contexts: new Map(payload.contexts)
  }
}

export const SSRContext = createContext<SSRContext | null>(null);

const useSSRComponentState = (data: SSRContext, state: ComponentState) => {
  return useMemo(() => {
    let ssrComponentState = data.components.get(state.ref.id);
    if (!ssrComponentState) {
      ssrComponentState = {
        id: state.ref.id,
        values: new Map(),
        deps: new Map(),
      }
      data.components.set(state.ref.id, ssrComponentState);
    }

    return ssrComponentState;
  }, []);
}

export const ssr = {
  useState<T extends JSONValue>(initialValue: ValueOrCalculator<T>): [value: T, setter: StateSetter<T>] {
    const state = useInternalComponentState();
    const ssrData = ssr.useSSRContext();
    const ssrComponentState = useSSRComponentState(ssrData, state);

    // this value will literally change
    // as we go down these other hooks,
    // but should stay "relatively" stable
    const hookIndex = state.hookIndex;

    // If we are a client, try to get the server's copy of the value
    const initialServerValue = useMemo(() => {
      if (ssrData.mode === 'server')
        return initialValue;

      if (!ssrComponentState.values.has(hookIndex))
        return initialValue;

      return ssrComponentState.values.get(hookIndex) as ValueOrCalculator<T>;
    }, [])

    // The inner setState
    const [value, innerSetter] = useState<T>(initialServerValue);

    const setter = useMemo(() => {
      if (ssrData.mode === 'client')
        return innerSetter;
      
      // intercept updates on server to write to SSRComponentData
      return (updater: Updater<T>) => {
        innerSetter(prevValue => {
          const nextValue = runUpdater<T>(prevValue, updater);
          ssrComponentState.values.set(hookIndex, nextValue);
          return nextValue;
        });
      }
    }, []);

    return [value, setter]
  },
  useEffect(effect: EffectConstructor, deps: PrimitiveJSONValue[]) {
    const liveState = useInternalComponentState();
    const ssrData = ssr.useSSRContext();
    const ssrComponentState = useSSRComponentState(ssrData, liveState);

    const hookIndex = liveState.hookIndex;

    let firstRun = useRef(true);

    useMemo(() => {
      if (ssrData.mode === 'client')
        return;

      // record the last server set of deps
      ssrComponentState.deps.set(hookIndex, deps);
    }, deps)

    useEffect(() => {
      if (!firstRun.current || ssrData.mode === 'server')
        return effect();

      firstRun.current = false;

      // for the very first run on a client, check against
      // the server props to see if we need to re-render
      const prevDeps = ssrComponentState.deps.get(hookIndex);
      
      // only run the effect if the deps change (or if we don't have a copy of past deps anyway)
      if (!prevDeps || calculateDepsChange(prevDeps, deps)) {
        return effect();
      }
    }, deps);

  },
  // This needs special rehydration efforts to restore
  createContext<T extends JSONValue>(defaultValue: T): Context<T> {
    const innerContext = createContext(defaultValue);

    return {
      ...innerContext,
      Provider({ value, children }) {
        const liveState = useInternalComponentState();
        const ssrData = ssr.useSSRContext();

        useMemo(() => {
          if (ssrData.mode === "client")
            return;
          // record the value
          ssrData.contexts.set(liveState.ref.id, value);
        }, [value]);

        return h(specialNodeTypes.provider, { id: innerContext.id, value }, children);
      },
    }
  },
  useSSRReady() {
    const ssrData = ssr.useSSRContext();

    return ssrData.readyForServer;
  },
  useSSRContext() {
    const ssrContext = useContext(SSRContext);
    if (!ssrContext)
      throw new Error('Missing SSR Bundle Context!')
    return ssrContext;
  },
};


export type DehydratedCommit = {
  id: CommitID,
  elementType: string,
  parent: CommitID | null,
  distance: number,
  key: string | null,
  children: CommitID[],
  props: [string, JSONValue][],
}

export type DehydratedTree = {
  commits: DehydratedCommit[],
  mounts: CommitID[],
}

export type PrimitiveJSONValue =
  | string
  | number
  | boolean
  | null

export type CompoundJSONValue =
  | ReadonlyArray<JSONValue>
  | { readonly [key: string]: JSONValue }

export type JSONValue =
  | PrimitiveJSONValue
  | CompoundJSONValue;

export type RehydratableProps = { [key: string]: JSONValue };

export type RehydratableComponent = Component<RehydratableProps>;

export const ssrStringToSymbolMap: Record<string, symbol> = {
  'primitive:string': primitiveNodeTypes.string,
  'primitive:number': primitiveNodeTypes.number,
  'primitive:null': primitiveNodeTypes.null,
  'primitive:boolean': primitiveNodeTypes.boolean,
  'primitive:array': primitiveNodeTypes.array,


  [primitiveNodeTypes.string]:  'primitive:string',
  [primitiveNodeTypes.number]:  'primitive:number',
  [primitiveNodeTypes.null]:    'primitive:null',
  [primitiveNodeTypes.boolean]: 'primitive:boolean',
  [primitiveNodeTypes.array]:   'primitive:array',

  'special:placeholder': specialNodeTypes.placeholder,
  'special:boundary': specialNodeTypes.boundary,
  'special:fallback': specialNodeTypes.fallback,
  'special:provider': specialNodeTypes.provider,
  'special:suspend': specialNodeTypes.suspend,
  'special:render': specialNodeTypes.render,

  [specialNodeTypes.placeholder]: 'special:placeholder',
  [specialNodeTypes.boundary]: 'special:boundary',
  [specialNodeTypes.fallback]: 'special:fallback',
  [specialNodeTypes.provider]: 'special:provider',
  [specialNodeTypes.suspend]: 'special:suspend',
  [specialNodeTypes.render]: 'special:render',
}
export const ssrSymbolToStringMap: Record<symbol, string> = Object.fromEntries(Object.entries(ssrStringToSymbolMap)
  .map(([key, value]) => [value, key]))
