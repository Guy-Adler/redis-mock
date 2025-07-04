import { MockRedisClient } from './MockRedis';
import { RedisItem } from './RedisItem';
import { Callback, response } from './utils/callbackOrPromise';

class RedisSet extends RedisItem {
  constructor(public value: Set<string>) {
    super();
  }
}

export function sAdd(key: string, members: string | string[], callback: Callback<number>): void;
export function sAdd(key: string, members: string | string[]): Promise<number>;
export function sAdd(
  this: MockRedisClient,
  key: string,
  members: string | string[],
  callback?: Callback<number>
): Promise<number> | void {
  let set = this.storage.get(key);
  if (set === undefined) {
    set = new RedisSet(new Set());
    this.storage.set(key, set);
  }

  if (!(set instanceof RedisSet)) {
    throw new Error(`Key ${key} does not store a set`);
  }

  members = Array.isArray(members) ? members : [members];
  const result = members.reduce((count, member) => {
    if (set.value.has(member)) {
      return count;
    }
    set.value.add(member);
    return count + 1;
  }, 0);

  if (set.value.size === 0) {
    this.del(key, () => {}); // Delete synchronously to make the entire function sync
  }

  return response(result, callback);
}

export function sRem(key: string, members: string | string[], callback: Callback<number>): void;
export function sRem(key: string, members: string | string[]): Promise<number>;
export function sRem(
  this: MockRedisClient,
  key: string,
  members: string | string[],
  callback?: Callback<number>
): Promise<number> | void {
  let set = this.storage.get(key);
  if (set === undefined) {
    return response(0, callback);
  }

  if (!(set instanceof RedisSet)) {
    throw new Error(`Key ${key} does not store a set`);
  }

  members = Array.isArray(members) ? members : [members];
  const result = members.reduce((count, member) => {
    return count + +set.value.delete(member);
  }, 0);

  if (set.value.size === 0) {
    this.del(key, () => {}); // Delete synchronously to make the entire function sync
  }

  return response(result, callback);
}

export function sMembers(key: string, callback: Callback<string[]>): void;
export function sMembers(key: string): Promise<string[]>;
export function sMembers(
  this: MockRedisClient,
  key: string,
  callback?: Callback<string[]>
): Promise<string[]> | void {
  let set = this.storage.get(key);
  if (set === undefined) {
    return response([], callback);
  }

  if (!(set instanceof RedisSet)) {
    throw new Error(`Key ${key} does not store a set`);
  }

  return response([...set.value.keys()], callback);
}

export function sCard(key: string, callback: Callback<number>): void;
export function sCard(key: string): Promise<number>;
export function sCard(
  this: MockRedisClient,
  key: string,
  callback?: Callback<number>
): Promise<number> | void {
  let set = this.storage.get(key);
  if (set === undefined) {
    return response(0, callback);
  }

  if (!(set instanceof RedisSet)) {
    throw new Error(`Key ${key} does not store a set`);
  }

  return response(set.value.size, callback);
}
