import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { healthDecision, routeVersion, runRollout } from '../src/rollout.js';

const config = JSON.parse(await readFile(new URL('../config/rollout.json', import.meta.url), 'utf8'));
const healthy = { healthOk: true, requests: 100, errors: 0, p95Ms: 40 };
test('promotion applies exactly 1/10/50/100 and routing remains sticky', async () => {
  const applied = [];
  const result = await runRollout(config, async () => healthy, async p => applied.push(p));
  assert.equal(result.status, 'promoted');
  assert.deepEqual(applied, [1, 10, 50, 100]);
  for (let i = 0; i < 1000; i++) {
    assert.equal(routeVersion(`u-${i}`, 0, config), config.stableVersion);
    assert.equal(routeVersion(`u-${i}`, 100, config), config.candidateVersion);
    assert.equal(routeVersion(`u-${i}`, 10, config), routeVersion(`u-${i}`, 10, config));
  }
});
test('health, error, latency, missing metrics and thrown probes all roll back and stop progression', async () => {
  for (const failed of [
    { ...healthy, healthOk: false }, { ...healthy, errors: 3 }, { ...healthy, p95Ms: 251 },
    { ...healthy, requests: 99 }, { ...healthy, p95Ms: NaN }, { ...healthy, errors: -1 }, null, 'throws',
  ]) {
    const applied = [];
    const result = await runRollout(config, async percent => {
      if (percent !== 10) return healthy;
      if (failed === 'throws') throw new Error('probe timeout');
      return failed;
    }, async p => applied.push(p));
    assert.equal(result.status, 'rolled_back');
    assert.equal(result.activeVersion, config.stableVersion);
    assert.deepEqual(applied, [1, 10, 0]);
    assert.deepEqual(result.history.map(s => s.percent), [1, 10]);
  }
});
test('health limits include the configured boundaries', () => {
  assert.equal(healthDecision({ ...healthy, errors: 2, p95Ms: 250 }, config).ok, true);
  assert.equal(healthDecision({ ...healthy, errors: 3 }, config).reason, 'error_rate_exceeded');
});
