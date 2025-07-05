import type { RedisArgument } from 'redis';
import { MockRedisClient } from './MockRedis';
import { RedisItem } from './RedisItem';
import { Callback, response } from './utils/callbackOrPromise';

class RedisString extends RedisItem {
  constructor(public value: string) {
    super();
  }
}

interface SetOptions {
  expiration?:
    | {
        type: 'EX' | 'PX' | 'EXAT' | 'PXAT';
        value: number;
      }
    | {
        type: 'KEEPTTL';
      }
    | 'KEEPTTL';
  /**
   * @deprecated Use `expiration` { type: 'EX', value: number } instead
   */
  EX?: number;
  /**
   * @deprecated Use `expiration` { type: 'PX', value: number } instead
   */
  PX?: number;
  /**
   * @deprecated Use `expiration` { type: 'EXAT', value: number } instead
   */
  EXAT?: number;
  /**
   * @deprecated Use `expiration` { type: 'PXAT', value: number } instead
   */
  PXAT?: number;
  /**
   * @deprecated Use `expiration` 'KEEPTTL' instead
   */
  KEEPTTL?: boolean;
  condition?: 'NX' | 'XX';
  /**
   * @deprecated Use `{ condition: 'NX' }` instead.
   */
  NX?: boolean;
  /**
   * @deprecated Use `{ condition: 'XX' }` instead.
   */
  XX?: boolean;
  GET?: boolean;
}

export function set(
  key: RedisArgument,
  value: number | RedisArgument,
  options?: SetOptions | undefined
): Promise<string | null>;
export function set(
  key: RedisArgument,
  value: number | RedisArgument,
  options?: SetOptions | undefined,
  callback?: Callback<string | null>
): void;
export function set(
  this: MockRedisClient,
  key: RedisArgument,
  value: number | RedisArgument,
  options: SetOptions | undefined = undefined,
  callback?: Callback<string | null>
): Promise<string | null> | void {
  key = key.toString();
  const currentValue = this.storage.get(key);

  if (!(currentValue instanceof RedisString) && options?.GET) {
    throw new Error(`Key ${key} is not a string`);
  }

  const prevValue: string | null = (currentValue as RedisString | undefined)?.value ?? null;

  if (
    ((options?.XX || options?.condition === 'XX') && currentValue === undefined) ||
    ((options?.NX || options?.condition === 'NX') && currentValue !== undefined)
  ) {
    return response(options?.GET ? prevValue : null, callback);
  }

  let keepTTL = false;

  if (options) {
    if (
      options?.expiration === 'KEEPTTL' ||
      options?.expiration?.type === 'KEEPTTL' ||
      options.KEEPTTL
    ) {
      keepTTL = true;
    }
  }

  if (
    keepTTL &&
    (options?.EX !== undefined ||
      options?.EXAT !== undefined ||
      options?.PX !== undefined ||
      options?.PXAT !== undefined ||
      (typeof options?.expiration === 'object' && 'value' in options.expiration))
  ) {
    // Cant both have keepttl and set a ttl
    throw new Error(`Syntax Error`);
  }

  if (
    [options?.EX, options?.EXAT, options?.PX, options?.PXAT].filter((i) => i !== undefined).length >
    1
  ) {
    // cant have multiple expire options
    throw new Error(`Syntax Error`);
  }

  const newValue = new RedisString(value.toString());

  if (keepTTL) {
    newValue.expireTimeout = currentValue?.expireTimeout ?? null;
    newValue.expireTime = currentValue?.expireTime ?? null;
  }

  this.storage.set(key, newValue);

  if (!keepTTL) {
    if (typeof options?.expiration === 'object' && 'value' in options.expiration) {
      const expire = {
        EX: this.expire,
        PX: this.pExpire,
        EXAT: this.expireAt,
        PXAT: this.pExpireAt,
      }[options.expiration.type];
      expire(key, options.expiration.value, undefined, () => {});
    } else if (options?.EX !== undefined) {
      this.expire(key, options.EX);
    } else if (options?.PX !== undefined) {
      this.pExpire(key, options.PX);
    } else if (options?.EXAT !== undefined) {
      this.expireAt(key, options.EXAT);
    } else if (options?.PXAT !== undefined) {
      this.pExpireAt(key, options.PXAT);
    }
  }

  return response(options?.GET ? prevValue : 'OK', callback);
}

export function setNX(key: RedisArgument, value: RedisArgument): Promise<number>;
export function setNX(key: RedisArgument, value: RedisArgument, callback: Callback<number>): void;
export function setNX(
  this: MockRedisClient,
  key: RedisArgument,
  value: RedisArgument,
  callback?: Callback<number>
): Promise<number> | void {
  key = key.toString();
  const currentValue = this.storage.get(key);
  if (currentValue) {
    return response(0, callback);
  }

  this.storage.set(key, new RedisString(value.toString()));

  return response(1, callback);
}

export function get(key: RedisArgument): Promise<string | null>;
export function get(key: RedisArgument, callback: Callback<string | null>): void;
export function get(
  this: MockRedisClient,
  key: RedisArgument,
  callback?: Callback<string | null>
): Promise<string | null> | void {
  key = key.toString();
  const val = this.storage.get(key);

  if (val === undefined) return response(null, callback);
  if (val instanceof RedisString) return response(val.value, callback);
  throw new Error(`Key ${key} is not a string`);
}

export function mGet(keys: RedisArgument[]): Promise<Array<string | null>>;
export function mGet(keys: RedisArgument[], callback: Callback<Array<string | null>>): void;
export function mGet(
  this: MockRedisClient,
  keys: RedisArgument[],
  callback?: Callback<Array<string | null>>
): Promise<Array<string | null>> | void {
  const result = keys.map((key) => {
    const value = this.storage.get(key.toString());
    return value instanceof RedisString ? value.value : null;
  });

  return response(result, callback);
}

export function incr(key: RedisArgument): Promise<number>;
export function incr(key: RedisArgument, callback: Callback<number>): void;
export function incr(
  this: MockRedisClient,
  key: RedisArgument,
  callback?: Callback<number>
): Promise<number> | void {
  key = key.toString();
  const redisValue = this.storage.get(key);

  if (redisValue === undefined) {
    this.set(key, '1', undefined, () => {});
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

export function decr(key: RedisArgument): Promise<number>;
export function decr(key: RedisArgument, callback: Callback<number>): void;
export function decr(
  this: MockRedisClient,
  key: RedisArgument,
  callback?: Callback<number>
): Promise<number> | void {
  key = key.toString();
  const redisValue = this.storage.get(key);

  if (redisValue === undefined) {
    this.set(key, '-1', undefined, () => {});
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
