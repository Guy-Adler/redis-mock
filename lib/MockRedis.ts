import msgpack from 'msgpack5';
import EventEmitter from 'events';
import type { RedisItem } from './RedisItem';
import { cjson, cmsgpack, redis, Lua } from './eval';
import * as keys from './keys';
import * as strings from './strings';
import * as sets from './sets';
import * as evals from './eval';
import * as json from './json';
import { multi } from './multi';
import type { RedisClientOptions, RedisPoolOptions } from 'redis';

class MockRedisClient extends EventEmitter {
  protected readonly storage = new Map<string, RedisItem>();
  protected readonly lua = new Lua.VM();

  constructor(public readonly options?: RedisClientOptions) {
    super();
    this.lua.set('redis', this, redis);
    this.lua.set('cjson', JSON, cjson);
    this.lua.set('cmsgpack', msgpack(), cmsgpack);
  }

  async connect() {
    return this;
  }

  async close() {}

  async flushDb() {
    this.storage.forEach((value) => {
      if (value.expireTimeout) {
        clearTimeout(value.expireTimeout);
      }
    });

    this.storage.clear();

    return 'OK';
  }

  FLUSHDB = this.flushDb;
  flushAll = this.flushDb;
  FLUSHALL = this.flushDb;

  // #region keys
  DEL = keys.del;
  del = keys.del;
  EXISTS = keys.exists;
  exists = keys.exists;
  EXPIRE = keys.expire;
  expire = keys.expire;
  EXPIREAT = keys.expireAt;
  expireAt = keys.expireAt;
  PEXPIRE = keys.pExpire;
  pExpire = keys.pExpire;
  PEXPIREAT = keys.pExpireAt;
  pExpireAt = keys.pExpireAt;
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
  EVALSHA = evals.evalSha;
  evalSha = evals.evalSha;
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

  // #region multi
  MULTI = multi;
  multi = multi;
  // #endregion multi

  // #region json
  json = {
    // Need to bind all methods to `this`, otherwise their `this` is the object.
    GET: json.get.bind(this) as typeof json.get,
    get: json.get.bind(this) as typeof json.get,
    SET: json.set.bind(this) as typeof json.set,
    set: json.set.bind(this) as typeof json.set,
  };
  // #endregion json
}

export type { MockRedisClient };

export function createClient(options?: RedisClientOptions) {
  return new MockRedisClient(options);
}

export function createClientPool(
  clientOptions?: RedisClientOptions,
  _options?: Partial<RedisPoolOptions>
) {
  return new MockRedisClient(clientOptions);
}
