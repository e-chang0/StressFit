const { test } = require('node:test');
const assert = require('node:assert/strict');
const { autoReply, firstReply, slaStatus, trackSla, weeklySummary, REPLY_MARKER } = require('../scripts/community.cjs');

const context = { repo: { owner: 'e-chang0', repo: 'StressFit' } };
const now = new Date('2026-11-03T00:00:00Z');
const issue = (overrides = {}) => ({
  number: 20, title: '질문', html_url: 'https://github.com/e-chang0/StressFit/issues/20',
  state: 'open', labels: [{ name: 'support' }], user: { login: 'student' },
  created_at: '2026-11-01T00:00:00Z', updated_at: '2026-11-03T00:00:00Z', ...overrides
});
const comment = (overrides = {}) => ({
  user: { login: 'maintainer', type: 'User' }, author_association: 'OWNER',
  created_at: '2026-11-02T00:00:00Z', body: '확인하겠습니다.', ...overrides
});

function fakeGithub({ issues = [], comments = {}, labelExists = true } = {}) {
  const writes = [];
  const rest = { issues: {
    listComments: 'comments', listForRepo: 'issues',
    createComment: async args => writes.push(['comment', args]),
    getLabel: async () => { if (!labelExists) throw Object.assign(new Error('missing'), { status: 404 }); },
    createLabel: async args => writes.push(['createLabel', args]),
    addLabels: async args => writes.push(['addLabels', args]),
    removeLabel: async args => writes.push(['removeLabel', args])
  } };
  return {
    writes, rest,
    paginate: async (endpoint, args) => {
      if (endpoint === 'comments') return comments[args.issue_number] || [];
      return issues.filter(item => (args.state === 'all' || item.state === args.state) &&
        (!args.labels || item.labels.some(label => (label.name || label) === args.labels)) &&
        (!args.since || new Date(item.updated_at) >= new Date(args.since)));
    }
  };
}

test('48시간 직전은 목표 이내, 정확히 48시간이면 지연', () => {
  assert.equal(slaStatus(issue(), [], new Date('2026-11-02T23:59:59Z')).overdue, false);
  assert.equal(slaStatus(issue(), [], now).overdue, true);
});

test('작성자, 봇, 외부 방문자, 자동 안내는 담당자 답변에서 제외', () => {
  const replies = [
    comment({ user: { login: 'student', type: 'User' } }),
    comment({ user: { login: 'helper[bot]', type: 'Bot' } }),
    comment({ author_association: 'NONE' }),
    comment({ body: REPLY_MARKER })
  ];
  assert.equal(firstReply(issue(), replies), undefined);
  assert.equal(slaStatus(issue(), replies, now).overdue, true);
});

test('시간순으로 가장 이른 담당자 답변을 고르고 기다리는 목록에서 제외', () => {
  const replies = [comment({ created_at: '2026-11-02T12:00:00Z' }), comment()];
  const result = slaStatus(issue(), replies, now);
  assert.equal(result.hours, 24);
  assert.equal(result.overdue, false);
});

test('기존 안내가 있으면 자동 응답을 다시 쓰지 않음', async () => {
  const github = fakeGithub({ comments: { 20: [comment({ body: REPLY_MARKER })] } });
  assert.match(await autoReply({ github, context, issue: issue(), dryRun: false }), /생략/);
  assert.equal(github.writes.length, 0);
});

test('자동 응답 미리보기에는 쓰기가 없고 실제 모드에서 한 번 작성', async () => {
  const github = fakeGithub();
  await autoReply({ github, context, issue: issue() });
  assert.equal(github.writes.length, 0);
  await autoReply({ github, context, issue: issue(), dryRun: false });
  assert.equal(github.writes.length, 1);
  assert.match(github.writes[0][1].body, /48시간/);
  assert.match(github.writes[0][1].body, /wiki\/Troubleshooting/);
});

test('일반 백로그, PR, 닫힌 이슈에는 자동 응답하지 않음', async () => {
  const github = fakeGithub();
  for (const data of [issue({ labels: [] }), issue({ pull_request: {} }), issue({ state: 'closed' })]) {
    assert.equal(await autoReply({ github, context, issue: data, dryRun: false }), '대상 아님');
  }
  assert.equal(github.writes.length, 0);
});

test('SLA 미리보기는 지연 상태만 보고하고 라벨을 바꾸지 않음', async () => {
  const github = fakeGithub({ issues: [issue()] });
  const result = await trackSla({ github, context, now });
  assert.match(result, /48시간 경과/);
  assert.equal(github.writes.length, 0);
});

test('지연 라벨이 없으면 만들고 대상 이슈에 추가', async () => {
  const github = fakeGithub({ issues: [issue()], labelExists: false });
  await trackSla({ github, context, now, dryRun: false });
  assert.deepEqual(github.writes.map(write => write[0]), ['createLabel', 'addLabels']);
});

test('답변 완료, 닫힘, support 제거 시 남아 있는 지연 라벨 해제', async () => {
  const labels = [{ name: 'support' }, { name: 'sla: overdue' }];
  const github = fakeGithub({ issues: [
    issue({ number: 20, labels }), issue({ number: 21, labels, state: 'closed' }),
    issue({ number: 22, labels: [{ name: 'sla: overdue' }] })
  ], comments: { 20: [comment()] } });
  await trackSla({ github, context, now, dryRun: false });
  assert.deepEqual(github.writes.map(write => write[1].issue_number).sort(), [20, 21, 22]);
  assert.ok(github.writes.every(write => write[0] === 'removeLabel'));
});

test('주간 집계는 7일 시작 포함·끝 제외, PR과 이슈 분리', async () => {
  const github = fakeGithub({ issues: [
    issue({ number: 1, labels: [], created_at: '2026-10-27T00:00:00Z' }),
    issue({ number: 2, labels: [], created_at: '2026-10-26T23:59:59Z' }),
    issue({ number: 3, labels: [], created_at: now.toISOString() }),
    issue({ number: 4, labels: [], created_at: '2026-10-28T00:00:00Z', pull_request: {} }),
    issue({ number: 5, labels: [], created_at: '2026-10-01T00:00:00Z', state: 'closed', closed_at: '2026-11-02T00:00:00Z' })
  ] });
  const report = await weeklySummary({ github, context, now });
  assert.match(report, /새 이슈: 1건/);
  assert.match(report, /새 PR: 1건/);
  assert.match(report, /이번 주 닫힌 것: 1건/);
  assert.equal(github.writes.length, 0);
});

test('주간 요약은 오래된 미응답도 포함하고 댓글·본문은 복사하지 않음', async () => {
  const github = fakeGithub({ issues: [issue({ title: '질문 [예시]\n두 번째 줄', body: 'PRIVATE-BODY' })],
    comments: { 20: [comment({ author_association: 'NONE', body: 'PRIVATE-COMMENT' })] } });
  const report = await weeklySummary({ github, context, now });
  assert.match(report, /48시간 대기, 48시간 경과/);
  assert.ok(report.includes('질문 \\[예시\\] 두 번째 줄'));
  assert.doesNotMatch(report, /PRIVATE-/);
});

test('필수 Wiki 세 문서가 각각 다른 두 문서를 연결', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const names = ['Getting-Started', 'Development-Guide', 'Troubleshooting'];
  for (const name of names) {
    const source = fs.readFileSync(path.join(__dirname, '..', 'docs/wiki', `${name}.md`), 'utf8');
    for (const other of names.filter(other => other !== name)) {
      assert.ok(source.includes(`https://github.com/e-chang0/StressFit/wiki/${other}`), `${name} → ${other}`);
    }
  }
});
