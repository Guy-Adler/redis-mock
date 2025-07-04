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
import { ReplyUnion } from '@/types';

export { cjson, cmsgpack, redis, Lua };

interface EvalOptions {
  keys?: RedisArgument[];
  arguments?: RedisArgument[];
}

export async function evalSha(
  this: MockRedisClient,
  _script: RedisArgument,
  _options?: EvalOptions
): Promise<ReplyUnion> {
  throw new Error('NOSCRIPT');
}

export async function EVAL(
  this: MockRedisClient,
  script: RedisArgument,
  options?: EvalOptions
): Promise<ReplyUnion> {
  this.lua.set('KEYS', (options?.keys ?? []).map(String));
  this.lua.set('ARGV', (options?.arguments ?? []).map(String));
  return Redis.response(this.lua.run(script.toString())[0]) as ReplyUnion;
}
