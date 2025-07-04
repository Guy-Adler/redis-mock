import { MockRedisClient } from './MockRedis';
import { Callback, response } from './utils/callbackOrPromise';

export function del(keys: string | string[], callback: Callback<number>): void;
export function del(keys: string | string[]): Promise<number>;
export function del(
  this: MockRedisClient,
  keys: string | string[],
  callback?: Callback<number>
): void | Promise<number> {
  keys = Array.isArray(keys) ? keys : [keys];

  const result = keys.reduce((count, key) => {
    return count + +this.storage.delete(key);
  }, 0);

  return response(result, callback);
}

export function exists(key: string, callback: Callback<number>): void;
export function exists(key: string): Promise<number>;
export function exists(
  this: MockRedisClient,
  key: string,
  callback?: Callback<number>
): void | Promise<number> {
  const result = +this.storage.has(key);

  return response(result, callback);
}

export function expire(key: string, seconds: number, callback: Callback<number>): void;
export function expire(key: string, seconds: number): Promise<number>;
export function expire(
  this: MockRedisClient,
  key: string,
  seconds: number,
  callback?: Callback<number>
): Promise<number> | void {
  const redisItem = this.storage.get(key);

  if (!redisItem) {
    return response(0, callback);
  }

  if (redisItem.expireTimeout !== null) {
    clearTimeout(redisItem.expireTimeout);
  }

  const ms = seconds * 1000;
  redisItem.expireTime = Date.now() + ms;
  redisItem.expireTimeout = setTimeout(() => {
    this.storage.delete(key);
  }, ms);

  return response(1, callback);
}

export function ttl(key: string, callback: Callback<number>): void;
export function ttl(key: string): Promise<number>;
export function ttl(
  this: MockRedisClient,
  key: string,
  callback?: Callback<number>
): Promise<number> | void {
  const redisItem = this.storage.get(key);

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
    var plain = pattern.slice(start, start + length);
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
    for (var i in groups) {
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

export function keys(pattern: string, callback: Callback<string[]>): void;
export function keys(pattern: string): Promise<string[]>;
export function keys(
  this: MockRedisClient,
  pattern: string,
  callback?: Callback<string[]>
): Promise<string[]> | void {
  const regex = patternToRegex(pattern);

  const result = Array.from(this.storage.keys()).filter((key) => regex.test(key));
  return response(result, callback);
}
