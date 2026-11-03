import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function classifyChanges(files) {
  const app = path => /^(src\/|public\/)/.test(path) || ['package.json', 'package-lock.json', 'scripts/build.js'].includes(path);
  const ci = path => app(path) || /^(tests\/|scripts\/|\.github\/actions\/)/.test(path) ||
    /^\.github\/workflows\/(ci-cd|reusable-ci|cache-benchmark)\.yml$/.test(path) || path === 'eslint.config.js';
  return { ci: files.some(ci), deploy: files.some(app) };
}
export function comparisonRange(eventName, event) {
  if (eventName === 'pull_request') return { base: event.pull_request.base.sha, head: event.pull_request.head.sha };
  if (eventName === 'push') return { base: /^0+$/.test(event.before) ? null : event.before, head: event.after };
  if (eventName === 'workflow_dispatch') return { base: 'HEAD^', head: 'HEAD' };
  throw new Error(`Unsupported event: ${eventName}`);
}
export function changedFiles(range, git = args => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })) {
  const data = range.base
    ? git(['diff', '--name-only', '--no-renames', '-z', range.base, range.head, '--'])
    : git(['ls-tree', '-r', '--name-only', '-z', range.head]);
  return data.split('\0').filter(Boolean);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const range = comparisonRange(process.env.GITHUB_EVENT_NAME, event);
  const files = changedFiles(range);
  const result = classifyChanges(files);
  console.log(JSON.stringify({ range, files, ...result }, null, 2));
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `ci=${result.ci}\ndeploy=${result.deploy}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Changed file decision\n\nCompared ${files.length} paths. CI: **${result.ci}**. App deployment candidate: **${result.deploy}**.\n\nPRs use base/head; pushes use before/after. Deletions and both sides of renames are included.\n`);
}
