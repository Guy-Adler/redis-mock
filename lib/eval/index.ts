/*!
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { MockRedisClient } from '../MockRedis';
import * as cjson from './lib/cjson';
import * as cmsgpack from './lib/cmsgpack';
import * as redis from './lib/redis';
import * as Lua from './utils/lua';
import * as Redis from './utils/redis';

export { cjson, cmsgpack, redis, Lua };

interface EvalOptions {
  keys?: string[];
  arguments?: string[];
}

export async function evalsha(this: MockRedisClient, ...input: any[]) {
  throw new Error('NOSCRIPT');
}

export async function EVAL(this: MockRedisClient, script: string, options?: EvalOptions) {
  this.lua.set('KEYS', options?.keys ?? []);
  this.lua.set('ARGV', options?.arguments ?? []);
  return Redis.response(this.lua.run(script)[0]);
}
