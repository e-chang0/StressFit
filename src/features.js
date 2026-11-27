// Versioned salts keep assignments stable across reloads and independent of other flags.
export function bucket(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 10000;
}

export function variantFor(userId, experiment) {
  if (!experiment.enabled) return 'A';
  return bucket(`${experiment.id}:${userId}`) < 5000 ? 'A' : 'B';
}

export function flagFor(name, identity, config) {
  const flag = config.flags[name];
  if (!flag?.enabled) return { enabled: false, reason: '환경 설정 OFF' };
  if (!flag.audiences.includes(identity.audience)) return { enabled: false, reason: '대상 사용자 아님' };
  const enabled = bucket(`feature-rollout-v1:${identity.id}`) < config.rolloutPercent * 100;
  return { enabled, reason: enabled ? '대상·롤아웃 조건 충족' : '롤아웃 대상 아님' };
}

export function evaluateFlags(identity, config) {
  return Object.fromEntries(Object.keys(config.flags).map(name => [name, flagFor(name, identity, config)]));
}
