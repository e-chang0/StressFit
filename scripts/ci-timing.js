import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const statePath = '.ci-timing.json';
const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : {};
const [command, phase] = process.argv.slice(2);
const output = (name, value) => {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
};
if (command === 'start') {
  state[phase] = { start: Date.now() };
} else if (command === 'finish') {
  if (!state[phase]) throw new Error(`No start time for ${phase}`);
  state[phase].ms = Date.now() - state[phase].start;
} else if (command === 'key') {
  const lockHash = createHash('sha256').update(readFileSync('package-lock.json')).digest('hex');
  const namespace = process.env.CACHE_NAMESPACE || 'stressfit-deps-v1';
  if (!/^[a-zA-Z0-9_-]+$/.test(namespace)) throw new Error('Invalid cache namespace');
  output('key', `${namespace}-${process.platform}-${process.arch}-${process.env.NODE_RUNTIME}-${lockHash}`);
} else if (command === 'expect') {
  const expected = process.env.EXPECT_CACHE || 'any';
  const hit = process.env.CACHE_HIT === 'true';
  if (!['any', 'miss', 'hit'].includes(expected)) throw new Error('Invalid expected cache state');
  if ((expected === 'hit' && !hit) || (expected === 'miss' && hit)) throw new Error(`Expected cache ${expected}, got cache-hit=${hit}`);
} else if (command === 'report') {
  if (!state.pipeline || !state.dependencies?.ms) throw new Error('Missing pipeline or dependency timing');
  const metrics = {
    sha: process.env.GITHUB_SHA, run_id: process.env.GITHUB_RUN_ID,
    node: process.env.NODE_RUNTIME, os: process.platform, arch: process.arch,
    cache_enabled: process.env.CACHE_ENABLED === 'true', cache_hit: process.env.CACHE_HIT === 'true',
    cache_key: process.env.CACHE_KEY,
    dependencies_ms: state.dependencies.ms, pipeline_ms: Date.now() - state.pipeline.start,
  };
  console.log(`STRESSFIT_METRICS ${JSON.stringify(metrics)}`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Measured verification\n\n\`\`\`json\n${JSON.stringify(metrics, null, 2)}\n\`\`\`\n\nDependency time includes cache lookup/restore and installation on miss. Pipeline time includes Node setup, dependencies, lint, build, and tests; excludes checkout, pre-timer action downloads, post-job cache save, and artifact upload.\n`);
} else {
  throw new Error(`Unknown timing command: ${command}`);
}
writeFileSync(statePath, JSON.stringify(state));
