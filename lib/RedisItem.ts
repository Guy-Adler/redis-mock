export abstract class RedisItem {
  /**
   * Time (in unix epoch) in which the item will expire.
   */
  expireTime: number | null = null;
  expireTimeout: NodeJS.Timeout | null = null;
}
