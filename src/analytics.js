import { readJSON, writeJSON } from './storage.js';

export const EVENT_KEY = 'stressfit.events.v1';
const allowed = new Set(['experiment_exposure', 'recommend_click', 'recommend_success', 'recommend_error', 'routine_complete']);

export function createTracker({ storage, identity, experiment, variant,
  now = () => new Date().toISOString(), makeId = () => globalThis.crypto.randomUUID() }) {
  const saved = readJSON(storage, EVENT_KEY, []);
  let events = Array.isArray(saved) ? saved.filter(event => event?.schemaVersion === 1 && allowed.has(event.event)).slice(-500) : [];
  function refresh() {
    const current = readJSON(storage, EVENT_KEY, null);
    if (Array.isArray(current)) events = current.filter(event => event?.schemaVersion === 1 && allowed.has(event.event)).slice(-500);
    return events;
  }
  function track(event) {
    if (!allowed.has(event)) throw new Error('Unknown event');
    refresh();
    // Never record form inputs, health information, names or email addresses.
    const entry = { schemaVersion: 1, eventId: makeId(), timestamp: now(), event,
      userId: identity.id, audience: identity.audience,
      experimentId: experiment.enabled ? experiment.id : null,
      variant: experiment.enabled ? variant : null };
    events = [...events, entry].slice(-500);
    writeJSON(storage, EVENT_KEY, events);
    return entry;
  }
  return {
    track,
    exposure() {
      if (!experiment.enabled) return;
      if (!refresh().some(e => e.event === 'experiment_exposure' && e.userId === identity.id && e.experimentId === experiment.id)) {
        return track('experiment_exposure');
      }
    },
    list: () => [...refresh()],
    clear() { events = []; return writeJSON(storage, EVENT_KEY, events); },
  };
}
