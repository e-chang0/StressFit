import { bucket } from './features.js';

export function routeVersion(userId, percent, config) {
  return bucket(`canary-release-v1:${userId}`) < percent * 100 ? config.candidateVersion : config.stableVersion;
}

export function healthDecision(sample, config) {
  if (!sample || sample.healthOk !== true) return { ok: false, reason: 'health_probe_failed' };
  if (!Number.isInteger(sample.requests) || sample.requests < config.minRequests ||
      !Number.isInteger(sample.errors) || sample.errors < 0 || sample.errors > sample.requests ||
      !Number.isFinite(sample.p95Ms) || sample.p95Ms < 0) return { ok: false, reason: 'invalid_or_insufficient_metrics' };
  if (sample.errors / sample.requests > config.maxErrorRate) return { ok: false, reason: 'error_rate_exceeded' };
  if (sample.p95Ms > config.maxP95Ms) return { ok: false, reason: 'latency_exceeded' };
  return { ok: true, reason: 'healthy' };
}

export async function runRollout(config, probe, apply = async () => {}) {
  const history = [];
  for (const percent of config.stages) {
    await apply(percent);
    let sample;
    try { sample = await probe(percent); } catch { sample = { healthOk: false }; }
    const decision = healthDecision(sample, config);
    history.push({ percent, ...decision, sample });
    if (!decision.ok) {
      await apply(0);
      return { status: 'rolled_back', activePercent: 0, activeVersion: config.stableVersion,
        history, rollback: { from: percent, to: 0, reason: decision.reason } };
    }
  }
  return { status: 'promoted', activePercent: 100, activeVersion: config.candidateVersion, history, rollback: null };
}
