import type { RedisClientType } from 'redis';
import { MockRedisClient } from '../lib';

// Extract method signatures
type MethodKeys<T> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

type MethodSignatures<T> = Pick<T, MethodKeys<T>>;
type RealSignatures = MethodSignatures<RedisClientType>;
type MockSignatures = MethodSignatures<MockRedisClient>;

type Diff = {
  [K in keyof MockSignatures as Uppercase<K>]: K extends keyof RealSignatures
    ? MockSignatures[K] extends RealSignatures[K]
      ? RealSignatures[K] extends MockSignatures[K]
        ? never
        : Uppercase<K>
      : Uppercase<K>
    : Uppercase<K>;
}[Uppercase<keyof MockSignatures>];

type MustBeNever<T extends never> = T;
export type Expect = MustBeNever<Diff>;

// Drilldown:
type BadKeyFunctions = Extract<Diff, Uppercase<keyof typeof import('../lib/keys')>>;
type BadSetsFunctions = Extract<Diff, Uppercase<keyof typeof import('../lib/sets')>>;
type BadStringsFunctions = Extract<Diff, Uppercase<keyof typeof import('../lib/strings')>>;
type BadEvalFunctions = Extract<Diff, Uppercase<keyof typeof import('../lib/eval')>>;
type BadMultiFunctions = Extract<Diff, Uppercase<keyof typeof import('../lib/multi')>>;
type OtherBadFunctions = Exclude<
  Diff,
  BadKeyFunctions | BadSetsFunctions | BadStringsFunctions | BadEvalFunctions | BadMultiFunctions
>;
