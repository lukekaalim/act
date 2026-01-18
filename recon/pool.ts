export abstract class ObjectPool<T, TArgs extends unknown[]> {
  maxSize = 256;

  #available: T[] = [];

  abstract assign(value: T, ...args: TArgs): void;
  abstract build(...args: TArgs): T;

  get size() {
    return this.#available.length;
  }

  acquire(...args: TArgs) {
    const object = this.#available.pop();
    if (!object)
      return this.build(...args);

    this.assign(object, ...args);
    return object;
  }

  release(value: T) {
    if (this.size < this.maxSize)
      this.#available.push(value);
  }
}

export const createObjectPool = <T, TArgs extends unknown[]>(
  build: (...args: TArgs) => T,
  assign: (value: T, ...args: TArgs) => void,
) => {
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