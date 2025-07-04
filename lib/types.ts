import type { RedisArgument } from 'redis';

export type RedisVariadicArgument = RedisArgument | Array<RedisArgument>;
export type { ReplyUnion } from '@redis/client/dist/lib/RESP/types';
