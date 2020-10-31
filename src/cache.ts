
type Key = string;

type Value = string;

interface IOptions {
  maxSize: number;
  maxByteSize: number;
}

const SIZE_OF_JAVASCRIPT_CHARACTER = 2;

class MemoryCache {
  public cache = new Map<string, string>();
  public maxSize: number;
  public maxByteSize: number;
  public currentByteSize = 0;
  public forEach = this.cache.forEach.bind(this.cache);

  constructor({ maxSize, maxByteSize }: IOptions) {
    this.maxSize = maxSize;
    this.maxByteSize = maxByteSize;
  }

  public set(key: Key, value: Value) {
    const valueBytes = value.length * SIZE_OF_JAVASCRIPT_CHARACTER;
    if (valueBytes > this.maxByteSize) { return this; }
    if (this.cache.size > this.maxSize) { this.clear(); }
    if (valueBytes + this.currentByteSize > this.maxByteSize) { this.clear(); }
    this.cache.set(key, value);
    return this;
  }

  public clear() {
    return this.cache.clear();
  }

  public delete(key: Key) {
    return this.cache.delete(key);
  }

  public get(key: Key) {
    return this.cache.get(key);
  }

  public has(key: Key) {
    return this.cache.has(key);
  }

  public entries() {
    return this.cache.entries();
  }

  public * keys() {
    for (const [key] of this) {
      yield key;
    }
  }

  public * values() {
    for (const [, value] of this) {
      yield value;
    }
  }

  public *[Symbol.iterator]() {
    for (const item of this.cache) {
      yield item;
    }
  }

  get [Symbol.toStringTag]() {
    return "MemoryCache";
  }

  get size() {
    return this.cache.size;
  }
}

export default MemoryCache;
