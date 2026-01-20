
/**
 * A short utility for re-using old objects
 * to avoid doing too much GC thrashing, at the
 * cost of increased memory.
 * 
 * Don't know yet if the trade off it worth it.
 */
export type ObjectPool<T, TArgs extends unknown[]> = {
  maxSize: number,
  size: number,

  all: T[],
  available: T[],

  acquire(...args: TArgs): T,
  release(value: T): void,
}

export const createObjectPool = <T, TArgs extends unknown[]>(
  build: (...args: TArgs) => T,
  assign: (value: T, ...args: TArgs) => void,
): ObjectPool<T, TArgs> => {
  const pool = {
    maxSize: 256,
    available: [] as T[],
    all: [] as T[],
    get size() {
      return pool.available.length;
    },
    acquire(...args: TArgs): T {
      let object = pool.available.pop();
      if (!object) {
        object = build(...args);
        pool.all.push(object);
        return object;
      }

      assign(object, ...args);
      return object;
    },
    release(value: T) {
      //if (pool.size < pool.maxSize)
      pool.available.push(value);
    }
  }
  return pool;
}