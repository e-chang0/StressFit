import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupSamples, parseMetric, renderBenchmarkReport } from '../scripts/benchmark-report.js';
const sample = { sha: 'abc', os: 'linux', arch: 'x64', node: 'v24', dependencies_ms: 2000, pipeline_ms: 4000, job_ms: 10000, cache_enabled: false, cache_hit: false, job_url: 'https://example.com/job' };
const samples = () => [sample, sample, sample, { ...sample, cache_enabled: true }, ...[1, 2, 3].map(() => ({ ...sample, cache_enabled: true, cache_hit: true, dependencies_ms: 1000, pipeline_ms: 3000, job_ms: 8000 }))];
test('report calculates improvements from measured samples and separates cold cache', () => {
  const report = renderBenchmarkReport({ samples: samples(), date: '2026-11-03', run_url: 'https://example.com/run' });
  assert.match(report, /50.00%/);
  assert.match(report, /25.00%/);
  assert.match(report, /20.00%/);
  assert.match(report, /cold 1/);
});
test('a missing warm sample, mixed runtime, or invalid duration cannot produce a report', () => {
  assert.throws(() => groupSamples(samples().slice(1)), /Expected/);
  assert.throws(() => groupSamples(samples().map((s, i) => i === 0 ? { ...s, node: 'v22' } : s)), /Mixed node/);
  assert.throws(() => groupSamples(samples().map(s => ({ ...s, job_ms: 0 }))), /Invalid/);
});
test('job logs must contain an actual metric marker', () => {
  assert.deepEqual(parseMetric(`timestamp STRESSFIT_METRICS ${JSON.stringify(sample)}\n`), sample);
  assert.throws(() => parseMetric('no measurements'), /no measured/);
});
