export function readJSON(storage, key, fallback) {
  try { return JSON.parse(storage.getItem(key)) ?? fallback; } catch { return fallback; }
}

export function writeJSON(storage, key, value) {
  try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

export function browserStorage() {
  try { return globalThis.localStorage; } catch { return null; }
}

export function loadIdentity(storage, makeId = () => globalThis.crypto.randomUUID()) {
  const saved = readJSON(storage, 'stressfit.identity.v1', null);
  if (typeof saved?.id === 'string' && saved.id.length > 0 && saved.id.length <= 80 &&
      ['general', 'beta'].includes(saved.audience)) return saved;
  const identity = { id: makeId(), audience: 'general' };
  writeJSON(storage, 'stressfit.identity.v1', identity);
  return identity;
}
