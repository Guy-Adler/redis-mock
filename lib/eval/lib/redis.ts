/*!
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { MockRedisClient } from '@/MockRedis';
import deasync from 'deasync';
import { nil } from '../utils/lua';

// https://redis.io/commands/eval

// TODO: Reject Redis random commands prior to calling this
export function replicate_commands(this: MockRedisClient) {
  return true;
}

export function call(this: MockRedisClient, cmd: string, ...args: unknown[]) {
  const func = cmd.split('.').reduce((acc, key) => {
    const properties = Object.getOwnPropertyNames(acc ?? {});
    if (properties.includes(key)) {
      return acc?.[key as keyof typeof acc];
    } else if (properties.includes(key.toUpperCase())) {
      return acc?.[key.toUpperCase() as keyof typeof acc];
    } else if (properties.includes(key.toLowerCase())) {
      return acc?.[key.toLowerCase() as keyof typeof acc];
    }

    return acc?.[key as keyof typeof acc];
  }, this as unknown) as unknown as undefined | ((...args: unknown[]) => unknown);

  if (func === undefined) {
    throw new Error(`Calling non existant function ${cmd} on ${this.constructor.name}`);
  }
  // The Lua VM can only handle synchronous calls, so we need to force the
  // Redis library (which may be using process ticks to simulate actual
  // network calls) to execute synchronously
  const command: (...args: unknown[]) => unknown = deasync(func.bind(this));
  const result = command(...args);
  return result != null ? result : nil;
}

export function pcall(this: MockRedisClient, cmd: string, ...args: unknown[]) {
  try {
    return call.call(this, cmd, ...args);
  } catch (err) {
    return error_reply.call(this, String(err));
  }
}

export function error_reply(this: MockRedisClient, err: string) {
  return { err };
}

export function status_reply(this: MockRedisClient, ok: string) {
  return { ok };
}
