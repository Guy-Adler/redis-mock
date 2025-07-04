import msgpack from 'msgpack5';
import type { RedisItem } from './RedisItem';
import { cjson, cmsgpack, redis, Lua } from './eval';
import * as keys from './keys';
import * as strings from './strings';
import * as sets from './sets';
import * as evals from './eval';

class MockRedisClient {
  protected readonly storage = new Map<string, RedisItem>();
  protected readonly lua = new Lua.VM();

  constructor() {
    this.lua.set('redis', this, redis);
    this.lua.set('cjson', JSON, cjson);
    this.lua.set('cmsgpack', msgpack(), cmsgpack);
  }

  // #region keys
  DEL = keys.del;
  del = keys.del;
  EXISTS = keys.exists;
  exists = keys.exists;
  EXPIRE = keys.expire;
  expire = keys.expire;
  TTL = keys.ttl;
  ttl = keys.ttl;
  KEYS = keys.keys;
  keys = keys.keys;
  // #endregion keys

  // #region strings
  GET = strings.get;
  get = strings.get;
  SET = strings.set;
  set = strings.set;
  SETNX = strings.setNX;
  setNX = strings.setNX;
  MGET = strings.mGet;
  mGet = strings.mGet;
  INCR = strings.incr;
  incr = strings.incr;
  DECR = strings.decr;
  decr = strings.decr;
  // #endregion strings

  // #region eval
  EVAL = evals.EVAL;
  eval = evals.EVAL;
  EVALSHA = evals.evalsha;
  evalsha = evals.evalsha;
  // #endregion eval

  // #region set
  SADD = sets.sAdd;
  sAdd = sets.sAdd;
  SREM = sets.sRem;
  sRem = sets.sRem;
  SMEMBERS = sets.sMembers;
  sMembers = sets.sMembers;
  SCARD = sets.sCard;
  sCard = sets.sCard;
  // #endregion set
}

export type { MockRedisClient };

export function createClient() {
  return new MockRedisClient();
}
