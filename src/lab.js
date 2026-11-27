import { evaluateFlags, variantFor } from './features.js';
import { browserStorage, loadIdentity, writeJSON } from './storage.js';
import { createTracker } from './analytics.js';
import { runRollout } from './rollout.js';

const storage = browserStorage();
let identity = loadIdentity(storage);
let config;
let policy;
let scenario;
const $ = selector => document.querySelector(selector);
function tracker() {
  return createTracker({ storage, identity, experiment: config.experiment, variant: variantFor(identity.id, config.experiment) });
}
function cell(text) {
  const element = document.createElement('td');
  element.textContent = text;
  return element;
}
function renderFlags() {
  const preview = globalThis.structuredClone(config);
  const mode = $('#preview-mode').value;
  if (mode !== 'deployed') for (const flag of Object.values(preview.flags)) flag.enabled = mode === 'on';
  const labels = { newResultCard: '새 추천 카드', detailedReason: '베타 상세 설명', completionLog: '운동 완료 기록' };
  const rows = Object.entries(evaluateFlags(identity, preview)).map(([name, result]) => {
    const li = document.createElement('li');
    const badge = document.createElement('strong');
    badge.textContent = result.enabled ? 'ON' : 'OFF';
    badge.className = result.enabled ? 'on' : 'off';
    li.append(badge, ` ${labels[name]} · ${result.reason}`);
    return li;
  });
  $('#flags').replaceChildren(...rows);
  $('#config-info').textContent = `환경 ${config.environment} · 기능 롤아웃 ${config.rolloutPercent}%`;
  $('#variant').textContent = config.experiment.enabled
    ? `${config.experiment.id} → Variant ${variantFor(identity.id, config.experiment)}` : 'A/B 실험 OFF · 기본 버튼 A 사용';
}
function renderEvents() {
  const events = tracker().list();
  const rows = events.slice(-30).reverse().map(event => {
    const row = document.createElement('tr');
    row.append(cell(event.timestamp), cell(event.userId), cell(event.event), cell(event.variant ?? '—'));
    return row;
  });
  $('#events').replaceChildren(...rows);
  $('#event-summary').textContent = `${events.length}건 저장 · 최근 30건 표시 · 노출 ${events.filter(e => e.event === 'experiment_exposure').length} / 클릭 ${events.filter(e => e.event === 'recommend_click').length} / 완료 ${events.filter(e => e.event === 'routine_complete').length}`;
}
function download(name, value) {
  const url = URL.createObjectURL(new globalThis.Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

try {
  const responses = await Promise.all(['config.json', 'rollout.json'].map(path => globalThis.fetch(`./${path}`, { cache: 'no-store' })));
  if (responses.some(r => !r.ok)) throw new Error('실습 설정을 불러오지 못했습니다. 새로고침해 주세요.');
  [config, policy] = await Promise.all(responses.map(r => r.json()));
  $('#user-id').value = identity.id;
  $('#audience').value = identity.audience;
  $('#health-policy').textContent = `승격 조건: 후보 버전 최소 ${policy.minRequests}회 요청 · 오류율 ≤ ${policy.maxErrorRate * 100}% · p95 ≤ ${policy.maxP95Ms}ms · /health 정상. 미충족 시 후보 트래픽을 0%로 복원합니다.`;
  renderFlags();
  renderEvents();
  $('#identity-form').addEventListener('submit', event => {
    event.preventDefault();
    const id = $('#user-id').value.trim();
    if (!id || id.length > 80) return;
    identity = { id, audience: $('#audience').value };
    const saved = writeJSON(storage, 'stressfit.identity.v1', identity);
    $('#identity-status').textContent = saved ? '저장했어요. 추천 화면을 열거나 새로고침하면 적용됩니다.' : '브라우저 저장이 제한되어 추천 화면에 사용자 설정을 전달할 수 없어요.';
    renderFlags();
  });
  $('#preview-mode').addEventListener('change', renderFlags);
  $('#export-events').addEventListener('click', () => download('stressfit-events.json', { source: 'browser-local', events: tracker().list() }));
  $('#clear-events').addEventListener('click', () => {
    const saved = tracker().clear();
    renderEvents();
    if (!saved) $('#event-summary').textContent = '브라우저 저장이 제한되어 로그를 지우지 못했어요.';
  });
  globalThis.addEventListener('focus', renderEvents);
  const simulate = async fail => {
    const result = await runRollout(policy, async percent => ({ healthOk: !(fail && percent === 10),
      requests: 100, errors: fail && percent === 10 ? 100 : 0, p95Ms: 40 }));
    scenario = { source: 'browser-simulation', policy, ...result };
    const rows = result.history.map(step => {
      const li = document.createElement('li');
      li.textContent = `${step.percent}% · ${step.ok ? 'PASS' : 'FAIL'} · ${step.reason}`;
      li.className = step.ok ? 'on' : 'off';
      return li;
    });
    $('#rollout-stages').replaceChildren(...rows);
    $('#rollout-status').textContent = result.status === 'promoted'
      ? '100% 승격 완료 · candidate-v2' : `자동 롤백 완료 · ${result.rollback.from}% → 0% · stable-v1`;
    $('#export-rollout').disabled = false;
  };
  $('#healthy-rollout').addEventListener('click', () => simulate(false));
  $('#failed-rollout').addEventListener('click', () => simulate(true));
  $('#export-rollout').addEventListener('click', () => download('stressfit-rollout.json', scenario));
} catch (error) {
  $('#lab-error').textContent = error.message;
  for (const button of document.querySelectorAll('button')) button.disabled = true;
}
