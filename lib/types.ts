import type { RedisArgument } from 'redis';

export type RedisVariadicArgument = RedisArgument | Array<RedisArgument>;
