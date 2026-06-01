/**
 * Shared utility functions used across client and server.
 */

export function strHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}
