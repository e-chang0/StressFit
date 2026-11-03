import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changedFiles, classifyChanges, comparisonRange } from '../scripts/changed-files.js';
test('documentation-only changes skip CI and deployment', () => {
  assert.deepEqual(classifyChanges(['README.md', 'docs/report.md']), { ci: false, deploy: false });
});
test('app changes, including deleted source, require CI and deployment', () => {
  for (const path of ['src/main.js', 'public/style.css', 'package-lock.json', 'scripts/build.js']) assert.deepEqual(classifyChanges([path]), { ci: true, deploy: true });
});
test('test and workflow edits verify without deploying unchanged app', () => {
  for (const path of ['tests/build.test.js', '.github/actions/setup-node/action.yml', '.github/workflows/reusable-ci.yml']) assert.deepEqual(classifyChanges([path]), { ci: true, deploy: false });
});
test('PR compares base and head, not the synthetic merge commit', () => {
  assert.deepEqual(comparisonRange('pull_request', { pull_request: { base: { sha: 'base' }, head: { sha: 'head' } } }), { base: 'base', head: 'head' });
});
test('push compares before/after and a new branch scans the whole tree', () => {
  assert.deepEqual(comparisonRange('push', { before: 'a', after: 'b' }), { base: 'a', head: 'b' });
  assert.deepEqual(comparisonRange('push', { before: '0000000', after: 'b' }), { base: null, head: 'b' });
});
test('NUL-separated paths preserve whitespace, deletions and renamed source paths', () => {
  let command;
  const files = changedFiles({ base: 'a', head: 'b' }, args => { command = args; return 'src/old name.js\0docs/new name.md\0'; });
  assert.ok(command.includes('--no-renames'));
  assert.deepEqual(files, ['src/old name.js', 'docs/new name.md']);
  assert.equal(classifyChanges(files).deploy, true);
});
test('new branch uses ls-tree and unknown events fail closed', () => {
  let command;
  assert.deepEqual(changedFiles({ base: null, head: 'b' }, args => { command = args; return 'public/index.html\0'; }), ['public/index.html']);
  assert.equal(command[0], 'ls-tree');
  assert.throws(() => comparisonRange('issues', {}), /Unsupported/);
});
