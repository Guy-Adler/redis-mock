export type Callback<T> = (err: unknown, result: T) => void;

export function response<T>(value: T, callback: Callback<T> | undefined): Promise<T> | void {
  if (typeof callback === 'function') {
    callback(null, value);
  } else {
    return Promise.resolve(value);
  }
}
