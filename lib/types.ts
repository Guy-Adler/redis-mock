import type { RedisArgument } from 'redis';

export type RedisVariadicArgument = RedisArgument | Array<RedisArgument>;
export type { ReplyUnion } from '@redis/client/dist/lib/RESP/types';
export type { RedisJSON as RedisJSONType } from '@redis/json/dist/lib/commands/helpers';
