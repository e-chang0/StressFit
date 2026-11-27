import { recommendRoutine } from './recommendation.js';
import { evaluateFlags, variantFor } from './features.js';
import { browserStorage, loadIdentity, readJSON, writeJSON } from './storage.js';
import { createTracker } from './analytics.js';

const form = document.querySelector('#routine-form');
const result = document.querySelector('#result');
const storage = browserStorage();
const identity = loadIdentity(storage);
let currentRoutine = null;
let flags;
let tracker;
form.querySelector('button').disabled = true;

try {
  const response = await globalThis.fetch('./config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('설정을 불러오지 못했습니다. 새로고침해 주세요.');
  const config = await response.json();
  flags = evaluateFlags(identity, config);
  const variant = variantFor(identity.id, config.experiment);
  const button = form.querySelector('button');
  button.textContent = variant === 'A' ? '내 루틴 확인하기 →' : '나에게 맞는 루틴 찾기 →';
  tracker = createTracker({ storage, identity, experiment: config.experiment, variant });
  tracker.exposure();
  document.querySelector('#completion-section').hidden = !flags.completionLog.enabled;
  renderCompletions();
  button.disabled = false;
} catch (error) {
  document.querySelector('#error').textContent = error.message;
}

function renderCompletions() {
  const saved = readJSON(storage, 'stressfit.completions.v1', []);
  const entries = Array.isArray(saved) ? saved.filter(x => x?.userId === identity.id) : [];
  document.querySelector('#completion-count').textContent = `이 브라우저에서 ${entries.length}회 완료했어요.`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!tracker) return;
  tracker.track('recommend_click');
  try {
    const routine = recommendRoutine({
      stress: Number(form.elements.stress.value),
      minutes: Number(form.elements.minutes.value),
      place: form.elements.place.value,
      hasPain: form.elements.hasPain.checked,
      isRaining: form.elements.isRaining.checked,
      preferLight: form.elements.preferLight.checked,
      hasBand: form.elements.hasBand.checked,
      wantsStretch: form.elements.wantsStretch.checked,
      includePlan: true,
    });
    document.querySelector('#routine-title').textContent = routine.title;
    document.querySelector('#routine-detail').textContent =
      `${routine.duration}분 · 강도 ${routine.intensity}`;
    document.querySelector('#routine-reason').textContent = routine.reason;
    const plan = document.querySelector('#routine-plan');
    plan.textContent = routine.steps.map(step => `${step.label} ${step.minutes}분`).join(' · ');
    plan.hidden = routine.steps.length === 0;
    // Safety guidance is always visible, including when the detailed-reason flag is OFF.
    document.querySelector('#extra-reason').hidden = !flags.detailedReason.enabled || routine.duration === 0;
    result.classList.toggle('result-v2', flags.newResultCard.enabled);
    document.querySelector('#result-badge').hidden = !flags.newResultCard.enabled;
    currentRoutine = routine;
    const complete = document.querySelector('#complete-routine');
    complete.hidden = !flags.completionLog.enabled || routine.duration === 0;
    complete.disabled = false;
    complete.textContent = '이 루틴을 완료했어요';
    tracker.track('recommend_success');
    result.hidden = false;
    document.querySelector('#error').textContent = '';
  } catch (error) {
    currentRoutine = null;
    tracker.track('recommend_error');
    result.hidden = true;
    document.querySelector('#error').textContent = error.message;
  }
});

document.querySelector('#complete-routine').addEventListener('click', () => {
  if (!currentRoutine || currentRoutine.duration === 0 || !flags.completionLog.enabled) return;
  tracker.track('routine_complete');
  const saved = readJSON(storage, 'stressfit.completions.v1', []);
  const entries = Array.isArray(saved) ? saved : [];
  const persisted = writeJSON(storage, 'stressfit.completions.v1', [...entries,
    { userId: identity.id, timestamp: new Date().toISOString() }].slice(-100));
  document.querySelector('#complete-routine').disabled = true;
  document.querySelector('#complete-routine').textContent = persisted ? '완료를 기록했어요 ✓' : '완료했어요 · 브라우저 저장이 제한돼 있어요';
  currentRoutine = null;
  renderCompletions();
});
