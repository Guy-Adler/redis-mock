/*!
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

export function encode(this: JSON, value: unknown) {
  return this.stringify(value);
}

export function decode(this: JSON, value: string) {
  return this.parse(value);
}

module.exports.null = null;
