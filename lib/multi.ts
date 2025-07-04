import type { MockRedisClient } from './MockRedis';

type Batchify<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => any
    ? (...args: A) => Batchify<T>
    : T[K] extends object
      ? Batchify<T[K]>
      : never;
} & {
  exec(): Promise<unknown[]>;
};

type RedisMultiClient = Batchify<Omit<MockRedisClient, 'multi'>>;

type MethodCall = {
  path: string[];
  args: any[];
};

export function multi(this: MockRedisClient): RedisMultiClient {
  const calls: MethodCall[] = [];
  const self = this;

  function makeProxy(path: string[], obj: any) {
    return new Proxy(
      {},
      {
        get(_, property, receiver) {
          if (property === 'exec' && path.length === 0) {
            async function exec(): Promise<unknown[]> {
              const results = [] as unknown[];

              for (const call of calls) {
                let ctx = self;
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

          const next = obj?.[property];

          if (typeof next === 'function') {
            return (...args: any[]) => {
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

  return makeProxy([], this) as RedisMultiClient;
}
