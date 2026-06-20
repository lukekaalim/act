/**
 * A convenience interface to describe a series of functions that represent
 * event handlers.
 * 
 * Only one function exists per "event" type, so this is simpler and more
 * direction approach than an pub/sub architecture.
 * 
 * Often used in recon to avoid circular reference issues when initializing,
 * as assigning the event bus can occur after all associated resources init properly.
 * 
 * A system that has a (writable) event bus often fills it with a stub implementation
 * initially. The individual functions are readonly, so you should endeavour to replace
 * the whole bus.
 * 
 * @example
 * You have something that wants to listen for events, and something that
 * emits them.
 * ```ts
 * const listener = new Listener();
 * const emitter = new Emitter();
 * 
 * emitter.bus = listener.bus;
 * ```
 */
export type EventBus<T extends { [K: string]: (...args: any[]) => void }> = { readonly [key in keyof T]: T[key] };
