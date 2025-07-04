import type { MockRedisClient } from './MockRedis';
import { ReplyUnion } from './types';

type Batchify<REPLIES extends unknown[], T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer B
    ? (...args: A) => Batchify<[...REPLIES, Awaited<B>], T>
    : T[K] extends object
      ? Batchify<REPLIES, T[K]>
      : never;
} & {
  exec<T extends 'generic' | 'typed' = 'generic'>(): Promise<
    T extends 'typed' ? REPLIES : ReplyUnion[]
  >;
};

type OmitByUppercase<T, K extends string> = {
  [P in keyof T as Uppercase<P & string> extends K ? never : P]: T[P];
};

type RedisMultiClient<REPLIES extends unknown[]> = Batchify<
  REPLIES,
  OmitByUppercase<MockRedisClient, 'MULTI'>
>;

type MethodCall = {
  path: string[];
  args: unknown[];
};

export function multi<REPLIES extends unknown[] = []>(
  this: MockRedisClient
): RedisMultiClient<REPLIES> {
  const calls: MethodCall[] = [];
  const self = this;

  function makeProxy(path: string[], obj: unknown) {
    return new Proxy(
      {},
      {
        get(_, property, receiver) {
          if (property === 'exec' && path.length === 0) {
            async function exec(): Promise<unknown[]> {
              const results = [] as unknown[];

              for (const call of calls) {
                let ctx: unknown = self;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let current: any = self;

                for (const key of call.path) {
                  ctx = current;
                  current = current[key];
                }

                if (typeof current !== 'function') {
                  throw new Error(`Path ${call.path.join('.')} does not resolve to a function`);
                }

                results.push(await current.apply(ctx, call.args));
              }

              calls.length = 0;
              return results;
            }

            return exec;
          }

          const next = obj?.[property as keyof typeof obj];

          if (typeof next === 'function') {
            return (...args: unknown[]) => {
              calls.push({
                path: [...path, property.toString()],
                args,
              });

              return receiver;
            };
          }

          if (typeof next === 'object' && next !== null) {
            return makeProxy([...path, property.toString()], next);
          }

          return next;
        },
      }
    );
  }

  return makeProxy([], this) as RedisMultiClient<REPLIES>;
}
