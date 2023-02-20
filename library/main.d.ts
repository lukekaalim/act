// Element
export type ElementNode =
  | Element
  | string
  | number
  | false
  | null
  | ReadonlyArray<ElementNode>

export type ElementType = string | Component<Props>;

export type ElementID = string;
export type Element = {
  readonly id: ElementID,
  readonly type: ElementType,
  readonly props: Props,
  readonly children: ReadonlyArray<Element>,
}

export type Props = { readonly [k: string]: unknown };

export type FunctionComponent<T extends Props> = (props: T & { children: ElementNode }) => ElementNode;
export type Component<T extends Props = Props> = string | FunctionComponent<T>;

export const createElement: <T extends Props>(component: Component<T>, props?: T, children?: ElementNode) => Element;
export const h: typeof createElement;


// Context
export type ContextID = string;

export type Context<T> = {
  readonly contextId: ContextID,
  readonly defaultValue: T,
  readonly Provider: Component<{ value: T }>
};

export const createContext: <T>(defaultValue: T) => Context<T>;

// Hooks
export type Updater<T> = (previousValue: T) => T;
export type SetValue<T> = (value: T | Updater<T>) => void;
export type UseState = <T>(initialValue: T | (() => T)) => [T, SetValue<T>];

type CleanupFunc = () => unknown;
export type Deps = null | unknown[];
type Effect = () => CleanupFunc | void;
export type UseEffect = (effect: Effect, deps?: Deps) => void;

export type UseContext = <T>(context: Context<T>) => T;

export type Ref<T> = { current: T };

export type UseMemo = <T>(calc: () => T, deps?: Deps) => T;
export type UseRef = <T>(initial: T) => Ref<T>;

export type Hooks = {
  useState: UseState,
  useEffect: UseEffect,
  useContext: UseContext,
};

export const useState: UseState;
export const useEffect: UseEffect;
export const useContext: UseContext;

export const useRef: UseRef;
export const useMemo: UseMemo;

export var Boundary: Component<{ handleBoundaryValue?: (value: unknown[]) => unknown[] }>