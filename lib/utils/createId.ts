export function createId() {
  const randomUUID = globalThis.crypto?.randomUUID;
  if (typeof randomUUID === 'function') {
    return randomUUID.call(globalThis.crypto);
  }

  const randomValues = globalThis.crypto?.getRandomValues?.(new Uint32Array(4));
  if (randomValues) {
    return Array.from(randomValues, (value) => value.toString(16).padStart(8, '0')).join('-');
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
