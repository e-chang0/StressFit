import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTracker, EVENT_KEY } from '../src/analytics.js';

function setup(storage) {
  const memory = new Map();
  const options = { storage: storage === undefined ? { getItem: key => memory.get(key), setItem: (key, value) => memory.set(key, value) } : storage,
    identity: { id: 'anonymous-1', audience: 'beta' }, experiment: { id: 'cta-v1', enabled: true }, variant: 'B',
    now: () => '2026-11-28T00:00:00.000Z', makeId: () => String(memory.size) };
  return options;
}
test('exposure is deduplicated across reloads, event records retain assigned variant', () => {
  const options = setup();
  createTracker(options).exposure();
  const reloaded = createTracker(options);
  reloaded.exposure();
  for (const event of ['recommend_click', 'recommend_success', 'routine_complete']) reloaded.track(event);
  assert.deepEqual(reloaded.list().map(e => e.event), ['experiment_exposure', 'recommend_click', 'recommend_success', 'routine_complete']);
  for (const event of reloaded.list()) {
    assert.equal(event.variant, 'B');
    assert.equal(event.userId, options.identity.id);
    assert.deepEqual(Object.keys(event).sort(), ['schemaVersion', 'eventId', 'timestamp', 'event', 'userId', 'audience', 'experimentId', 'variant'].sort());
  }
  const other = createTracker({ ...options, identity: { id: 'other-user', audience: 'general' } });
  other.exposure();
  assert.equal(other.list().filter(e => e.event === 'experiment_exposure').length, 2);
});
test('disabled experiments have no exposure and events are marked unassigned', () => {
  const tracker = createTracker({ ...setup(), experiment: { id: 'cta-v1', enabled: false } });
  tracker.exposure();
  assert.equal(tracker.list().length, 0);
  const event = tracker.track('recommend_click');
  assert.equal(event.experimentId, null);
  assert.equal(event.variant, null);
});
test('sequential writes from existing tabs preserve the other tracker events', () => {
  const options = setup();
  const first = createTracker(options);
  const second = createTracker(options);
  first.exposure();
  second.exposure();
  second.track('recommend_click');
  first.track('recommend_success');
  assert.deepEqual(first.list().map(e => e.event), ['experiment_exposure', 'recommend_click', 'recommend_success']);
});
test('logs are bounded and corrupt or unavailable storage does not stop interaction', () => {
  const options = setup();
  options.storage.setItem(EVENT_KEY, 'null');
  const tracker = createTracker(options);
  for (let i = 0; i < 510; i++) tracker.track('recommend_click');
  assert.equal(tracker.list().length, 500);
  assert.equal(createTracker(options).list().length, 500);
  assert.throws(() => tracker.track('stress_score'));
  assert.equal(tracker.clear(), true);
  assert.equal(createTracker(options).list().length, 0);
  const fallback = createTracker(setup(null));
  fallback.track('recommend_click');
  assert.equal(fallback.list().length, 1);
});
