import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { bucket, evaluateFlags, variantFor } from '../src/features.js';
import { resolveConfig } from '../scripts/flag-config.js';
import { classifyChanges } from '../scripts/changed-files.js';
import { loadIdentity } from '../src/storage.js';

const config = JSON.parse(await readFile(new URL('../config/flags.json', import.meta.url), 'utf8'));
test('all three flags obey environment kill switches and audience targeting', () => {
  for (const audience of ['general', 'beta']) {
    const identity = { id: 'same-user', audience };
    const flags = evaluateFlags(identity, config);
    assert.equal(flags.newResultCard.enabled, true);
    assert.equal(flags.completionLog.enabled, true);
    assert.equal(flags.detailedReason.enabled, audience === 'beta');
    const disabled = resolveConfig(config, { FF_NEW_RESULT_CARD: 'false', FF_DETAILED_REASON: 'false', FF_COMPLETION_LOG: 'false' });
    assert.ok(Object.values(evaluateFlags(identity, disabled)).every(f => !f.enabled));
  }
  assert.equal(evaluateFlags({ id: 'untrusted', audience: 'admin' }, config).detailedReason.enabled, false);
});
test('rollout sets are nested and zero always disables every flag', () => {
  const previous = new Set();
  for (const percent of [0, 1, 10, 50, 100]) {
    const cfg = resolveConfig(config, { FF_ROLLOUT_PERCENT: String(percent) });
    const selected = new Set(Array.from({ length: 10000 }, (_, i) => `user-${i}`).filter(id => evaluateFlags({ id, audience: 'beta' }, cfg).newResultCard.enabled));
    for (const id of previous) assert.ok(selected.has(id));
    assert.ok(Math.abs(selected.size - percent * 100) < 250);
    for (const id of selected) previous.add(id);
  }
});
test('A/B allocation survives serialized config reloads with roughly equal groups', () => {
  const groups = { A: 0, B: 0 };
  for (let i = 0; i < 10000; i++) {
    const id = `visitor-${i}`;
    const variant = variantFor(id, config.experiment);
    assert.equal(variant, variantFor(id, JSON.parse(JSON.stringify(config)).experiment));
    groups[variant]++;
  }
  assert.ok(groups.A > 4700 && groups.A < 5300);
  assert.ok(groups.B > 4700 && groups.B < 5300);
  assert.equal(variantFor('any', { ...config.experiment, enabled: false }), 'A');
  assert.ok(bucket('한글 사용자') >= 0 && bucket('한글 사용자') < 10000);
});
test('invalid environment settings fail build rather than enabling by truthiness', () => {
  for (const value of ['yes', '', 'FALSE', '0']) assert.throws(() => resolveConfig(config, { FF_COMPLETION_LOG: value }));
  for (const value of ['NaN', '-1', '101', '10.5', '', ' ']) assert.throws(() => resolveConfig(config, { FF_ROLLOUT_PERCENT: value }));
  assert.throws(() => resolveConfig(config, { AB_ENABLED: 'false-ish' }));
  assert.equal(config.flags.completionLog.enabled, true);
});
test('configuration edits trigger app deployment', () => {
  for (const file of ['config/flags.json', 'config/rollout.json', 'scripts/flag-config.js']) {
    assert.deepEqual(classifyChanges([file]), { ci: true, deploy: true });
  }
});
test('anonymous identity persists, corrupt storage recovers, and blocked storage does not crash', () => {
  const memory = new Map();
  const storage = { getItem: key => memory.get(key), setItem: (key, value) => memory.set(key, value) };
  assert.deepEqual(loadIdentity(storage, () => 'first'), { id: 'first', audience: 'general' });
  assert.equal(loadIdentity(storage, () => 'second').id, 'first');
  memory.set('stressfit.identity.v1', '{invalid');
  assert.equal(loadIdentity(storage, () => 'recovered').id, 'recovered');
  assert.equal(loadIdentity(null, () => 'temporary').id, 'temporary');
});
