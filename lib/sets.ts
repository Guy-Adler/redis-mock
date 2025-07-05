import type { RedisArgument } from 'redis';
import { MockRedisClient } from './MockRedis';
import { RedisItem } from './RedisItem';
import { Callback, response } from './utils/callbackOrPromise';
import type { RedisVariadicArgument } from './types';

class RedisSet extends RedisItem {
  constructor(public value: Set<string>) {
    super();
  }
}

export function sAdd(key: RedisArgument, members: RedisVariadicArgument): Promise<number>;
export function sAdd(
  key: RedisArgument,
  members: RedisVariadicArgument,
  callback: Callback<number>
): void;
export function sAdd(
  this: MockRedisClient,
  key: RedisArgument,
  members: RedisVariadicArgument,
  callback?: Callback<number>
): Promise<number> | void {
  key = key.toString();
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
    member = member.toString();
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

export function sRem(key: RedisArgument, members: RedisVariadicArgument): Promise<number>;
export function sRem(
  key: RedisArgument,
  members: RedisVariadicArgument,
  callback: Callback<number>
): void;
export function sRem(
  this: MockRedisClient,
  key: RedisArgument,
  members: RedisVariadicArgument,
  callback?: Callback<number>
): Promise<number> | void {
  key = key.toString();
  const set = this.storage.get(key);
  if (set === undefined) {
    return response(0, callback);
  }

  if (!(set instanceof RedisSet)) {
    throw new Error(`Key ${key} does not store a set`);
  }

  members = Array.isArray(members) ? members : [members];
  const result = members.reduce((count, member) => {
    return count + +set.value.delete(member.toString());
  }, 0);

  if (set.value.size === 0) {
    this.del(key, () => {}); // Delete synchronously to make the entire function sync
  }

  return response(result, callback);
}

export function sMembers(key: RedisArgument): Promise<string[]>;
export function sMembers(key: RedisArgument, callback: Callback<string[]>): void;
export function sMembers(
  this: MockRedisClient,
  key: RedisArgument,
  callback?: Callback<string[]>
): Promise<string[]> | void {
  key = key.toString();
  const set = this.storage.get(key);
  if (set === undefined) {
    return response([], callback);
  }

  if (!(set instanceof RedisSet)) {
    throw new Error(`Key ${key} does not store a set`);
  }

  return response([...set.value.keys()], callback);
}

export function sCard(key: RedisArgument): Promise<number>;
export function sCard(key: RedisArgument, callback: Callback<number>): void;
export function sCard(
  this: MockRedisClient,
  key: RedisArgument,
  callback?: Callback<number>
): Promise<number> | void {
  key = key.toString();
  const set = this.storage.get(key);
  if (set === undefined) {
    return response(0, callback);
  }

  if (!(set instanceof RedisSet)) {
    throw new Error(`Key ${key} does not store a set`);
  }

  return response(set.value.size, callback);
}
