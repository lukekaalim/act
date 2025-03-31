export type Subscription = { cancel: () => void };
export type EventHandler<T> = (event: T) => unknown; 
export type EventMap = Record<string, unknown>;

export type EventEmitter<T extends EventMap> = {
  on<K extends keyof T>(type: K, handler: EventHandler<T[K]>): Subscription,
  call<K extends keyof T>(type: K, event: T[K]): void;
}

export const createEventEmitter = <T extends EventMap>(): EventEmitter<T> => {
  type AnyEvent = T[keyof T];
  type AnyHandler = EventHandler<AnyEvent>
  const handlers = new Map<keyof T, Set<AnyHandler>>();

  return {
    on(type, handler) {
      const set = handlers.get(type) || new Set<AnyHandler>();
      handlers.set(type, set);
      set.add(handler as AnyHandler);
      return {
        cancel() {
          set.delete(handler as AnyHandler);
        },
      }
    },
    call(type, event) {
      const set = handlers.get(type);
      if (!set)
        return;
      for (const handler of set)
        handler(event);
    },
  }
};
