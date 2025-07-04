/*!
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { RedisArgument } from 'redis';
import type { MockRedisClient } from '../MockRedis';
import * as cjson from './lib/cjson';
import * as cmsgpack from './lib/cmsgpack';
import * as redis from './lib/redis';
import * as Lua from './utils/lua';
import * as Redis from './utils/redis';

export { cjson, cmsgpack, redis, Lua };

interface EvalOptions {
  keys?: RedisArgument[];
  arguments?: RedisArgument[];
}

export function evalSha(this: MockRedisClient, _script: RedisArgument, _options?: EvalOptions) {
  throw new Error('NOSCRIPT');
}

export function EVAL(this: MockRedisClient, script: RedisArgument, options?: EvalOptions) {
  this.lua.set('KEYS', (options?.keys ?? []).map(String));
  this.lua.set('ARGV', (options?.arguments ?? []).map(String));
  return Redis.response(this.lua.run(script.toString())[0]);
}
