import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { evaluateFlags, variantFor } from '../src/features.js';
import { createTracker } from '../src/analytics.js';
import { resolveConfig } from './flag-config.js';
import { runHTTPScenario } from './canary-lab.js';

const defaults = JSON.parse(await readFile(new URL('../config/flags.json', import.meta.url), 'utf8'));
const policy = JSON.parse(await readFile(new URL('../config/rollout.json', import.meta.url), 'utf8'));
const directory = new URL('../docs/evidence/week11/', import.meta.url);
await mkdir(directory, { recursive: true });
const generatedAt = new Date().toISOString();
const events = [];
const profiles = [];
for (const audience of ['general', 'beta']) {
  for (const expectedVariant of ['A', 'B']) {
    let n = 0;
    while (variantFor(`scripted-${audience}-${n}`, defaults.experiment) !== expectedVariant) n++;
    const identity = { id: `scripted-${audience}-${n}`, audience };
    const memory = new Map();
    const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
    const options = { storage, identity, experiment: defaults.experiment, variant: expectedVariant, makeId: randomUUID };
    const tracker = createTracker(options);
    tracker.exposure();
    createTracker(options).exposure(); // Recreate tracker to emulate a page reload.
    for (const name of ['recommend_click', 'recommend_success', 'routine_complete']) tracker.track(name);
    assert.equal(tracker.list().filter(e => e.event === 'experiment_exposure').length, 1);
    assert.equal(variantFor(identity.id, defaults.experiment), expectedVariant);
    const flags = evaluateFlags(identity, defaults);
    assert.equal(flags.detailedReason.enabled, audience === 'beta');
    assert.equal(flags.newResultCard.enabled, true);
    assert.equal(flags.completionLog.enabled, true);
    const off = resolveConfig(defaults, { FF_NEW_RESULT_CARD: 'false', FF_DETAILED_REASON: 'false', FF_COMPLETION_LOG: 'false' });
    assert.ok(Object.values(evaluateFlags(identity, off)).every(f => !f.enabled));
    events.push(...tracker.list());
    profiles.push({ ...identity, variant: expectedVariant, flags, reloadAssignmentConsistent: true });
  }
}
await writeFile(new URL('experiments.json', directory), JSON.stringify({ generatedAt,
  source: 'scripted-core-verification', note: 'Synthetic users exercising the same tracker and allocator as the browser; not production traffic.',
  profiles, events }, null, 2) + '\n');
const healthy = await runHTTPScenario(policy);
const rollback = await runHTTPScenario(policy, 10);
await writeFile(new URL('canary.json', directory), JSON.stringify({ generatedAt, healthy, rollback }, null, 2) + '\n');
console.log(JSON.stringify({ profiles: profiles.length, events: events.length,
  healthy: healthy.status, failureScenario: rollback.status,
  rollbackFrom: rollback.rollback.from, restoredVersion: rollback.activeVersion,
  evidenceDirectory: 'docs/evidence/week11' }, null, 2));
