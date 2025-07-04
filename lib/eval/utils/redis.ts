/*!
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

export function response(value: any): any {
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
        if (typeof value.err === 'string') {
          throw new Error(value.err);
        }
        if (typeof value.ok === 'string') {
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
