/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import type { RedisClientType } from 'redis';
import { MockRedisClient } from '../lib';
import EventEmitter from 'events';

type MethodPath<Prefix extends string, Name extends string> = Prefix extends ''
  ? Name
  : `${Prefix}.${Name}`;

type ExtractMethodPaths<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends Function
    ? MethodPath<Prefix, Extract<K, string>> // method found
    : T[K] extends object
      ? ExtractMethodPaths<T[K], MethodPath<Prefix, Extract<K, string>>> // recurse
      : never;
}[keyof T];

type Lookup<T, Path extends string> = Path extends `${infer CurrentLevel}.${infer Rest}`
  ? CurrentLevel extends keyof T
    ? Lookup<T[CurrentLevel], Rest>
    : never
  : Path extends keyof T
    ? T[Path]
    : never;

type MethodSignatures<T> = {
  [K in ExtractMethodPaths<T>]: Lookup<T, K> extends Function ? Lookup<T, K> : never;
};
type RealSignatures = MethodSignatures<RedisClientType>;
// Do not compare event emitter, since they will never be equal (they are not the same class)
type MockSignatures = MethodSignatures<Omit<MockRedisClient, keyof EventEmitter>>;

type FullDiff = {
  [K in keyof MockSignatures & string]: K extends keyof RealSignatures
    ? RealSignatures[K] extends MockSignatures[K]
      ? MockSignatures[K] extends RealSignatures[K]
        ? never
        : K // valid code in mock isn't valid in node-redis
      : K // valid code in node-redis isn't valid in mock
    : K; // doesn't exist in node-redis
}[keyof MockSignatures & string];

/**
 * Some commands simply can not have the same type in a reasonable way.
 * After manual testing, we can choose to ignore them.
 */
type ImpossibleFunctions =
  | 'connect' // we return a different client which isn't fully compliant
  | 'multi'
  | 'MULTI';

type Diff = Exclude<FullDiff, ImpossibleFunctions>;

type MustBeNever<T extends never> = T;
export type Expect = MustBeNever<Diff>;
export type MissingMethods = Uppercase<
  Exclude<keyof RealSignatures & string, keyof MockSignatures & string>
>;

// Drilldown:
type BadKeyFunctions = Extract<Diff, Uppercase<keyof typeof import('../lib/keys')>>;
type BadSetsFunctions = Extract<Diff, Uppercase<keyof typeof import('../lib/sets')>>;
type BadStringsFunctions = Extract<Diff, Uppercase<keyof typeof import('../lib/strings')>>;
type BadEvalFunctions = Extract<Diff, Uppercase<keyof typeof import('../lib/eval')>>;
type BadJSONFunctions = Extract<Diff, `JSON.${Uppercase<keyof typeof import('../lib/json')>}`>;
type OtherBadFunctions = Exclude<
  Diff,
  BadKeyFunctions | BadSetsFunctions | BadStringsFunctions | BadEvalFunctions | BadJSONFunctions
>;
