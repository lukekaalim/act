export type EventHandler<T = void> = (event: T) => void;
export type Subscription = { cancel(): void }
export type SubscribeFunction<T = void> = (handler: EventHandler<T>) => Subscription;

export type EventEmitter<T = void> = {
  run(event: T): void;

  subscribe: SubscribeFunction<T>
}

export const createEventEmitter = <T = void>(): EventEmitter<T> => {
  const handlers = new Map<symbol, EventHandler<T>>();

  return {
    subscribe(handler) {
      const id = Symbol();
      handlers.set(id, handler);
      return {
        cancel() {
          handlers.delete(id);
        }
      }
    },
    run(event) {
      for (const handler of handlers.values())
        handler(event)
    }
  };
}

