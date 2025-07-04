import { MockRedisClient } from './MockRedis';
import { RedisItem } from './RedisItem';
import { Callback, response } from './utils/callbackOrPromise';

class RedisString extends RedisItem {
  constructor(public value: string) {
    super();
  }
}

export function set(key: string, value: string, callback: Callback<string>): void;
export function set(key: string, value: string): Promise<string>;
export function set(
  this: MockRedisClient,
  key: string,
  value: string,
  callback?: Callback<string>
): Promise<string> | void {
  const currentValue = this.storage.get(key);
  if (currentValue?.expireTimeout) {
    clearTimeout(currentValue.expireTimeout);
  }

  this.storage.set(key, new RedisString(value));

  return response('OK', callback);
}

export function setNX(key: string, value: string, callback: Callback<number>): void;
export function setNX(key: string, value: string): Promise<number>;
export function setNX(
  this: MockRedisClient,
  key: string,
  value: string,
  callback?: Callback<number>
): Promise<number> | void {
  const currentValue = this.storage.get(key);
  if (currentValue) {
    return response(0, callback);
  }

  this.storage.set(key, new RedisString(value));

  return response(1, callback);
}

export function get(key: string, callback: Callback<string | null>): void;
export function get(key: string): Promise<string | null>;
export function get(
  this: MockRedisClient,
  key: string,
  callback?: Callback<string | null>
): Promise<string | null> | void {
  const val = this.storage.get(key);

  if (val === undefined) return response(null, callback);
  if (val instanceof RedisString) return response(val.value, callback);
  throw new Error(`Key ${key} is not a string`);
}

export function mGet(keys: string[], callback: Callback<Array<string | null>>): void;
export function mGet(keys: string[]): Promise<Array<string | null>>;
export function mGet(
  this: MockRedisClient,
  keys: string[],
  callback?: Callback<Array<string | null>>
): Promise<Array<string | null>> | void {
  const result = keys.map((key) => {
    const value = this.storage.get(key);
    return value instanceof RedisString ? value.value : null;
  });

  return response(result, callback);
}

export function incr(key: string, callback: Callback<number>): void;
export function incr(key: string): Promise<number>;
export function incr(
  this: MockRedisClient,
  key: string,
  callback?: Callback<number>
): Promise<number> | void {
  const redisValue = this.storage.get(key);

  if (redisValue === undefined) {
    this.set(key, '1', () => {});
    return response(1, callback);
  }

  if (!(redisValue instanceof RedisString)) {
    throw new Error(`Key ${key} is not a string`);
  }
  const newValue = +redisValue.value + 1;
  if (!Number.isInteger(newValue)) {
    throw new Error(`Key ${key} does not store a string representation of an integer`);
  }

  redisValue.value = newValue.toString();

  return response(newValue, callback);
}

export function decr(key: string, callback: Callback<number>): void;
export function decr(key: string): Promise<number>;
export function decr(
  this: MockRedisClient,
  key: string,
  callback?: Callback<number>
): Promise<number> | void {
  const redisValue = this.storage.get(key);

  if (redisValue === undefined) {
    this.set(key, '-1', () => {});
    return response(-1, callback);
  }

  if (!(redisValue instanceof RedisString)) {
    throw new Error(`Key ${key} is not a string`);
  }
  const newValue = +redisValue.value - 1;
  if (!Number.isInteger(newValue)) {
    throw new Error(`Key ${key} does not store a string representation of an integer`);
  }

  redisValue.value = newValue.toString();

  return response(newValue, callback);
}
