/*!
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

export function response(value: unknown): unknown {
  switch (typeof value) {
    case 'string':
      return value;
    case 'number':
      return Math.floor(value);
    case 'boolean':
      return value ? 1 : null;
    case 'object':
      if (Array.isArray(value)) {
        return value.map(response);
      }
      if (value) {
        if ('err' in value && typeof value.err === 'string') {
          throw new Error(value.err);
        }
        if ('ok' in value && typeof value.ok === 'string') {
          return value.ok;
        }
        return [];
      }
    // falls through
    case 'undefined':
    default:
      return null;
  }
}
