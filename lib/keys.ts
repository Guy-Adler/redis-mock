import type { RedisArgument } from 'redis';
import type { RedisVariadicArgument } from './types';
import { MockRedisClient } from './MockRedis';
import { Callback, response } from './utils/callbackOrPromise';

export function del(keys: RedisVariadicArgument): Promise<number>;
export function del(keys: RedisVariadicArgument, callback: Callback<number>): void;
export function del(
  this: MockRedisClient,
  keys: RedisVariadicArgument,
  callback?: Callback<number>
): void | Promise<number> {
  keys = Array.isArray(keys) ? keys : [keys];

  const result = keys.reduce((count, key) => {
    return count + +this.storage.delete(key.toString());
  }, 0);

  return response(result, callback);
}

export function exists(key: RedisVariadicArgument): Promise<number>;
export function exists(key: RedisVariadicArgument, callback: Callback<number>): void;
export function exists(
  this: MockRedisClient,
  keys: RedisVariadicArgument,
  callback?: Callback<number>
): void | Promise<number> {
  keys = Array.isArray(keys) ? keys : [keys];

  const result = keys.reduce((count, key) => {
    return count + +this.storage.has(key.toString());
  }, 0);

  return response(result, callback);
}

export function expire(
  key: RedisArgument,
  seconds: number,
  mode?: 'NX' | 'XX' | 'GT' | 'LT' | undefined
): Promise<number>;
export function expire(key: RedisArgument, seconds: number, callback: Callback<number>): void;
export function expire(
  key: RedisArgument,
  seconds: number,
  mode: 'NX' | 'XX' | 'GT' | 'LT' | undefined,
  callback: Callback<number>
): void;
export function expire(
  this: MockRedisClient,
  key: RedisArgument,
  seconds: number,
  mode: Callback<number> | 'NX' | 'XX' | 'GT' | 'LT' | undefined = undefined,
  callback?: Callback<number>
): Promise<number> | void {
  mode = typeof mode === 'function' ? undefined : mode;
  callback = callback ?? (typeof mode === 'function' ? mode : undefined);
  return this.pExpire(key, seconds * 1000, mode, callback!);
}

export function pExpire(
  key: RedisArgument,
  ms: number,
  mode?: 'NX' | 'XX' | 'GT' | 'LT' | undefined
): Promise<number>;
export function pExpire(key: RedisArgument, ms: number, callback: Callback<number>): void;
export function pExpire(
  key: RedisArgument,
  ms: number,
  mode: 'NX' | 'XX' | 'GT' | 'LT' | undefined,
  callback: Callback<number>
): void;
export function pExpire(
  this: MockRedisClient,
  key: RedisArgument,
  ms: number,
  mode: Callback<number> | 'NX' | 'XX' | 'GT' | 'LT' | undefined = undefined,
  callback?: Callback<number>
): Promise<number> | void {
  key = key.toString();
  mode = typeof mode === 'function' ? undefined : mode;
  callback = callback ?? (typeof mode === 'function' ? mode : undefined);
  const redisItem = this.storage.get(key);

  if (!redisItem || ms <= 0) {
    return response(0, callback);
  }

  const newExpiryTime = Date.now() + ms;

  const currentExpiry = redisItem.expireTime;

  if (
    (mode === 'NX' && currentExpiry !== null) ||
    (mode === 'XX' && currentExpiry === null) ||
    (mode === 'LT' && currentExpiry !== null && currentExpiry <= newExpiryTime) ||
    (mode === 'GT' && (currentExpiry === null || currentExpiry >= newExpiryTime))
  ) {
    return response(0, callback);
  }

  if (redisItem.expireTimeout !== null) {
    clearTimeout(redisItem.expireTimeout);
  }

  redisItem.expireTime = newExpiryTime;
  redisItem.expireTimeout = setTimeout(() => {
    this.storage.delete(key);
  }, ms);

  return response(1, callback);
}

export function pExpireAt(
  key: RedisArgument,
  timestampMs: number | Date,
  mode?: 'NX' | 'XX' | 'GT' | 'LT' | undefined
): Promise<number>;
export function pExpireAt(
  key: RedisArgument,
  timestampMs: number | Date,
  mode: 'NX' | 'XX' | 'GT' | 'LT' | undefined,
  callback: Callback<number>
): void;
export function pExpireAt(
  key: RedisArgument,
  timestampMs: number | Date,
  callback: Callback<number>
): void;
export function pExpireAt(
  this: MockRedisClient,
  key: RedisArgument,
  timestampMs: number | Date,
  mode: Callback<number> | 'NX' | 'XX' | 'GT' | 'LT' | undefined = undefined,
  callback?: Callback<number>
): Promise<number> | void {
  mode = typeof mode === 'function' ? undefined : mode;
  callback = callback ?? (typeof mode === 'function' ? mode : undefined);

  return this.pExpire(
    key,
    (typeof timestampMs === 'number' ? timestampMs : timestampMs.getTime()) - Date.now(),
    mode,
    callback!
  );
}

export function expireAt(
  key: RedisArgument,
  timestampSeconds: number | Date,
  mode?: 'NX' | 'XX' | 'GT' | 'LT' | undefined
): Promise<number>;
export function expireAt(
  key: RedisArgument,
  timestampSeconds: number | Date,
  callback: Callback<number>
): void;
export function expireAt(
  key: RedisArgument,
  timestampSeconds: number | Date,
  mode: 'NX' | 'XX' | 'GT' | 'LT' | undefined,
  callback: Callback<number>
): void;
export function expireAt(
  this: MockRedisClient,
  key: RedisArgument,
  timestampSeconds: number | Date,
  mode: Callback<number> | 'NX' | 'XX' | 'GT' | 'LT' | undefined = undefined,
  callback?: Callback<number>
): Promise<number> | void {
  mode = typeof mode === 'function' ? undefined : mode;
  callback = callback ?? (typeof mode === 'function' ? mode : undefined);
  return this.pExpireAt(
    key,
    typeof timestampSeconds === 'number' ? timestampSeconds * 1000 : timestampSeconds,
    mode,
    callback!
  );
}

export function ttl(key: RedisArgument): Promise<number>;
export function ttl(key: RedisArgument, callback: Callback<number>): void;
export function ttl(
  this: MockRedisClient,
  key: RedisArgument,
  callback?: Callback<number>
): Promise<number> | void {
  const redisItem = this.storage.get(key.toString());

  if (!redisItem) {
    return response(-2, callback);
  }

  const { expireTime } = redisItem;
  if (!expireTime) {
    return response(-1, callback);
  }

  const seconds = (expireTime - Date.now()) / 1000;
  return response(seconds > 0 ? seconds : expireTime, callback);
}

function patternToRegex(pattern: string) {
  function process_plain(start: number, length: number) {
    let plain = pattern.slice(start, start + length);
    plain = plain.replace(/(\(|\)|\\|\.|\^|\$|\||\+)/gi, function (spec) {
      return '\\' + spec;
    });
    plain = plain.replace('*', '.*');
    plain = plain.replace('?', '.');
    return plain;
  }

  let currentPos = 0;
  const parts = [];
  const groupRegEx = /\[([^\]]+?)\]/gi;

  let matches: RegExpExecArray | null;
  while ((matches = groupRegEx.exec(pattern))) {
    if (matches.index > 0) {
      parts.push(process_plain(currentPos, matches.index - currentPos));
    }
    const groups = matches[1].split('');
    for (const i in groups) {
      groups[i] = groups[i].replace(/(\(|\)|\\|\.|\^|\$|\||\?|\+|\*)/gi, function (spec) {
        return '\\' + spec;
      });
    }

    const group = '(' + groups.join('|') + ')';
    parts.push(group);
    currentPos = matches.index + matches[0].length;
  }

  if (currentPos != pattern.length) {
    parts.push(process_plain(currentPos, pattern.length - currentPos));
  }
  return new RegExp(parts.join(''));
}

export function keys(pattern: RedisArgument): Promise<string[]>;
export function keys(pattern: RedisArgument, callback: Callback<string[]>): void;
export function keys(
  this: MockRedisClient,
  pattern: RedisArgument,
  callback?: Callback<string[]>
): Promise<string[]> | void {
  const regex = patternToRegex(pattern.toString());

  const result = Array.from(this.storage.keys()).filter((key) => regex.test(key));
  return response(result, callback);
}
