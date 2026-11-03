// GitHub Actions에서 쓰는 이슈 안내, 첫 답변 시간 점검, 주간 요약 초안.
const SUPPORT = 'support';
const OVERDUE = 'sla: overdue';
const REPLY_MARKER = '<!-- stressfit-support-reply-v1 -->';
const LIMIT_HOURS = 48;
const HOUR = 60 * 60 * 1000;

function hasLabel(issue, name) {
  return (issue.labels || []).some(label => (typeof label === 'string' ? label : label.name) === name);
}

function isSupport(issue) {
  return !issue.pull_request && hasLabel(issue, SUPPORT);
}

function firstReply(issue, comments) {
  return comments.filter(comment =>
    comment.user?.type !== 'Bot' &&
    comment.user?.login !== issue.user?.login &&
    ['OWNER', 'MEMBER', 'COLLABORATOR'].includes(comment.author_association) &&
    !comment.body?.includes(REPLY_MARKER)
  ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
}

function slaStatus(issue, comments, now = new Date()) {
  const reply = firstReply(issue, comments);
  const hours = Math.max(0, (new Date(reply ? reply.created_at : now) - new Date(issue.created_at)) / HOUR);
  return { reply, hours, overdue: !reply && issue.state === 'open' && hours >= LIMIT_HOURS };
}

async function commentsFor(github, repo, number) {
  return github.paginate(github.rest.issues.listComments, { ...repo, issue_number: number, per_page: 100 });
}

async function issuesFor(github, repo, options = {}) {
  return github.paginate(github.rest.issues.listForRepo, { ...repo, state: 'open', per_page: 100, ...options });
}

function replyBody(context) {
  const base = `https://github.com/${context.repo.owner}/${context.repo.repo}`;
  return `${REPLY_MARKER}\n내용을 남겨주셔서 감사합니다. 담당자가 확인하고 48시간 안에 첫 답변을 남기는 것을 목표로 하고 있습니다. 이 댓글은 자동 안내라서 담당자의 답변으로 세지 않습니다.\n\n오류라면 재현 순서, 기대한 결과, 실행 환경이 적혀 있는지 확인해 주세요. 계정 정보나 개인 건강정보는 지워 주세요.\n\n[자주 막히는 부분](${base}/wiki/Troubleshooting) · [개발 안내](${base}/wiki/Development-Guide)`;
}

async function autoReply({ github, context, issue, dryRun = true }) {
  if (!issue || issue.state !== 'open' || !isSupport(issue)) return '대상 아님';
  const comments = await commentsFor(github, context.repo, issue.number);
  if (comments.some(comment => comment.body?.includes(REPLY_MARKER))) return '기존 안내가 있어 생략';
  if (dryRun) return `미리보기: #${issue.number} 자동 안내 댓글 작성 예정`;
  await github.rest.issues.createComment({ ...context.repo, issue_number: issue.number, body: replyBody(context) });
  return `#${issue.number} 안내 댓글 작성`;
}

async function ensureOverdueLabel(github, repo) {
  try {
    await github.rest.issues.getLabel({ ...repo, name: OVERDUE });
  } catch (error) {
    if (error.status !== 404) throw error;
    await github.rest.issues.createLabel({ ...repo, name: OVERDUE, color: 'D93F0B', description: '첫 담당자 답변 목표 48시간 경과' });
  }
}

async function trackSla({ github, context, dryRun = true, now = new Date() }) {
  // 열린 support 이슈와, 닫혔지만 이전 지연 라벨이 남은 이슈를 함께 확인한다.
  const open = await issuesFor(github, context.repo, { labels: SUPPORT });
  const marked = await issuesFor(github, context.repo, { state: 'all', labels: OVERDUE });
  const candidates = [...new Map([...open, ...marked].map(issue => [issue.number, issue])).values()];
  const rows = [];
  let labelReady = false;
  for (const issue of candidates) {
    if (issue.pull_request) continue;
    const comments = isSupport(issue) && issue.state === 'open' ? await commentsFor(github, context.repo, issue.number) : [];
    const status = slaStatus(issue, comments, now);
    const shouldMark = isSupport(issue) && status.overdue;
    const markedBefore = hasLabel(issue, OVERDUE);
    if (!dryRun && shouldMark && !markedBefore) {
      if (!labelReady) { await ensureOverdueLabel(github, context.repo); labelReady = true; }
      await github.rest.issues.addLabels({ ...context.repo, issue_number: issue.number, labels: [OVERDUE] });
    }
    if (!dryRun && !shouldMark && markedBefore) {
      await github.rest.issues.removeLabel({ ...context.repo, issue_number: issue.number, name: OVERDUE });
    }
    const result = shouldMark ? '첫 답변 대기: 48시간 경과' : status.reply ? '담당자 답변 있음' : issue.state === 'closed' ? '닫힘' : !isSupport(issue) ? 'support 해제됨' : '첫 답변 대기: 목표 시간 이내';
    rows.push(`- #${issue.number}: ${result}${dryRun ? ' (미리보기)' : ''}`);
  }
  return rows.length ? rows.join('\n') : '점검할 support 이슈가 없습니다.';
}

function safeTitle(title) {
  return String(title).replace(/[\r\n]+/g, ' ').replace(/[\\`*_[\]<>|]/g, char => `\\${char}`);
}

function itemLine(item) {
  return `- [#${item.number}](${item.html_url}) ${safeTitle(item.title)}`;
}

async function weeklySummary({ github, context, now = new Date() }) {
  const end = new Date(now);
  const start = new Date(end.getTime() - 7 * 24 * HOUR);
  const changed = await issuesFor(github, context.repo, { state: 'all', since: start.toISOString() });
  const inWindow = value => value && new Date(value) >= start && new Date(value) < end;
  const issues = changed.filter(item => !item.pull_request);
  const opened = issues.filter(item => inWindow(item.created_at));
  const closed = issues.filter(item => item.state === 'closed' && inWindow(item.closed_at));
  const prs = changed.filter(item => item.pull_request && inWindow(item.created_at));
  const pending = [];
  for (const issue of await issuesFor(github, context.repo, { labels: SUPPORT })) {
    if (!isSupport(issue)) continue;
    const status = slaStatus(issue, await commentsFor(github, context.repo, issue.number), end);
    if (!status.reply) pending.push(`${itemLine(issue)} — ${Math.floor(status.hours)}시간 대기${status.overdue ? ', 48시간 경과' : ''}`);
  }
  const list = items => items.length ? items.map(itemLine).join('\n') : '- 없음';
  return `# StressFit 주간 요약\n\n집계 구간: ${start.toISOString()} 이상 ~ ${end.toISOString()} 미만(UTC, 최근 7일)\n\n## 이번 주 변화\n\n- 새 이슈: ${opened.length}건\n- 현재 닫힌 이슈 중 이번 주 닫힌 것: ${closed.length}건\n- 새 PR: ${prs.length}건\n\n## 새 이슈\n\n${list(opened)}\n\n## 닫힌 이슈\n\n${list(closed)}\n\n## 새 PR\n\n${list(prs)}\n\n## 첫 답변 대기\n\n${pending.join('\n') || '- 없음'}\n\n## 다음 확인 사항\n\n- 첫 답변이 늦어진 이슈와 막힌 작업 확인\n- RFC 의견을 읽고 바뀐 점 정리\n- 프로젝트 보드의 진행 상태 갱신\n\n이 요약은 현재 이슈 상태와 생성·종료 시각으로 집계한다. 중간에 닫았다가 다시 연 이력 전체나 PR 병합 건수는 집계하지 않는다. 본문과 댓글의 개인정보는 요약에 복사하지 않는다.\n`;
}

module.exports = { SUPPORT, OVERDUE, REPLY_MARKER, hasLabel, isSupport, firstReply, slaStatus, autoReply, trackSla, weeklySummary };
