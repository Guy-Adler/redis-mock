import type { RedisArgument } from 'redis';
import { RedisItem } from './RedisItem';
import { RedisJSONType, RedisVariadicArgument } from './types';
import { Callback, response } from './utils/callbackOrPromise';
import jsonpath from 'jsonpath';
import { MockRedisClient } from './MockRedis';

export class RedisJSON extends RedisItem {
  constructor(public value: RedisJSONType) {
    super();
  }
}

export function get(
  key: RedisArgument,
  options?:
    | {
        /** Needs to be a valid JSONPath (mock does not support legacy Redis path) */
        path?: RedisVariadicArgument;
      }
    | undefined
): Promise<RedisJSONType>;
export function get(
  key: RedisArgument,
  options?:
    | {
        /** Needs to be a valid JSONPath (mock does not support legacy Redis path) */
        path?: RedisVariadicArgument;
      }
    | undefined,
  callback?: Callback<RedisJSONType>
): void;
export function get(
  this: MockRedisClient,
  key: RedisArgument,
  options:
    | {
        /** Needs to be a valid JSONPath (mock does not support legacy Redis path) */
        path?: RedisVariadicArgument;
      }
    | undefined = undefined,
  callback?: Callback<RedisJSONType>
): Promise<RedisJSONType> | void {
  key = key.toString();
  const value = this.storage.get(key);

  if (value === undefined) {
    return response(null, callback);
  } else if (!(value instanceof RedisJSON)) {
    throw new Error('');
  }

  if (options?.path === undefined) {
    return response(value.value, callback);
  }

  const queries = Array.isArray(options.path)
    ? options.path.map(String)
    : [options.path.toString()];

  if (queries.length === 1) {
    return response(jsonpath.query(value.value, queries[0]), callback);
  }

  const result = queries.reduce(
    (allResults, query) => {
      return {
        ...allResults,
        [query]: jsonpath.query(value.value, query),
      };
    },
    {} as Record<string, RedisJSONType>
  );

  return response(result, callback);
}

interface JsonSetOptions {
  condition?: 'NX' | 'XX';
  /**
   * @deprecated Use `{ condition: 'NX' }` instead.
   */
  NX?: boolean;
  /**
   * @deprecated Use `{ condition: 'XX' }` instead.
   */
  XX?: boolean;
}

export function set(
  key: RedisArgument,
  /** Needs to be a valid JSONPath (mock does not support legacy Redis path) */
  path: RedisArgument,
  json: RedisJSONType,
  options?: JsonSetOptions | undefined
): Promise<'OK' | null>;
export function set(
  key: RedisArgument,
  /** Needs to be a valid JSONPath (mock does not support legacy Redis path) */
  path: RedisArgument,
  json: RedisJSONType,
  options?: JsonSetOptions | undefined,
  callback?: Callback<'OK' | null>
): void;
export function set(
  this: MockRedisClient,
  key: RedisArgument,
  /** Needs to be a valid JSONPath (mock does not support legacy Redis path) */
  path: RedisArgument,
  json: RedisJSONType,
  options: JsonSetOptions | undefined = undefined,
  callback?: Callback<'OK' | null>
): Promise<'OK' | null> | void {
  key = key.toString();
  path = path.toString();
  const value = this.storage.get(key);

  if (value !== undefined && !(value instanceof RedisJSON)) {
    throw new Error('Existing key has wrong Redis type');
  }

  if (
    ((options?.NX || options?.condition === 'NX') && value !== undefined) ||
    ((options?.XX || options?.condition === 'XX') && value === undefined)
  ) {
    return response(null, callback);
  }

  if (value === undefined) {
    if (path === '$') {
      this.storage.set(key, new RedisJSON(json));
      return response('OK', callback);
    }
    throw new Error('ERR new objects must be created at the root');
  }

  if (path === '$') {
    value.value = json;
    return response('OK', callback);
  }

  const applyResult = jsonpath.apply(value.value, path, () => json);
  return response(applyResult.length > 0 ? 'OK' : null, callback);
}
