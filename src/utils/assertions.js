export function invariant(condition, message) {
  if (!condition) {
    throw new Error(`Invariant failed: ${message}`);
  }
}

export function assertString(value, name) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }
  return value;
}
