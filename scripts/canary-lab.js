import { createServer } from 'node:http';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import { runRollout, routeVersion } from '../src/rollout.js';

async function listen(handler) {
  const server = createServer(handler);
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}
async function close(server) {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
async function sampleRequests(count, request) {
  const results = [];
  for (let offset = 0; offset < count; offset += 10) {
    results.push(...await Promise.all(Array.from({ length: Math.min(10, count - offset) }, (_, i) => request(offset + i))));
  }
  return results;
}

// An actual local stable server, candidate server and traffic gateway; no cloud credentials.
export async function runHTTPScenario(config, failAt = null) {
  let percent = 0;
  let broken = false;
  const servers = [];
  const stageTraffic = [];
  const request = (url, init = {}) => globalThis.fetch(url, { ...init, signal: globalThis.AbortSignal.timeout(config.probeTimeoutMs) });
  try {
    const release = version => (req, res) => {
      const unhealthy = version === config.candidateVersion && broken;
      res.writeHead(unhealthy ? 503 : 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ version, status: unhealthy ? 'unhealthy' : 'ok', path: req.url }));
    };
    const stable = await listen(release(config.stableVersion)); servers.push(stable.server);
    const candidate = await listen(release(config.candidateVersion)); servers.push(candidate.server);
    const gateway = await listen(async (req, res) => {
      try {
        const user = new URL(req.url, 'http://localhost').searchParams.get('user') || 'anonymous';
        const version = routeVersion(user, percent, config);
        const upstream = version === config.candidateVersion ? candidate : stable;
        const response = await request(`${upstream.url}/`);
        res.writeHead(response.status, { 'Content-Type': 'application/json' });
        res.end(await response.text());
      } catch {
        res.writeHead(502).end('{}');
      }
    }); servers.push(gateway.server);
    const result = await runRollout(config, async stage => {
      broken = stage === failAt;
      const health = await request(`${candidate.url}/health`);
      const healthBody = await health.json();
      const routed = await sampleRequests(1000, async i => {
        const response = await request(`${gateway.url}/?user=sample-${i}`);
        const body = await response.json();
        assert.equal(body.version, routeVersion(`sample-${i}`, stage, config));
        return { version: body.version, status: response.status };
      });
      const candidateCount = routed.filter(r => r.version === config.candidateVersion).length;
      if (stage === 100) assert.equal(candidateCount, routed.length);
      else assert.ok(Math.abs(candidateCount / routed.length * 100 - stage) < 5, 'traffic split deviated from configured stage');
      stageTraffic.push({ percent: stage, total: routed.length, candidate: candidateCount,
        stable: routed.length - candidateCount, errors: routed.filter(r => r.status >= 500).length });
      // Probe the candidate directly as well so a 1% canary still has sufficient observations.
      const probes = await sampleRequests(config.minRequests, async () => {
        const started = performance.now();
        try {
          const response = await request(`${candidate.url}/`);
          await response.text();
          return { error: !response.ok, ms: performance.now() - started };
        } catch { return { error: true, ms: config.probeTimeoutMs }; }
      });
      const sorted = probes.map(r => r.ms).sort((a, b) => a - b);
      return { healthOk: health.ok && healthBody.status === 'ok' && healthBody.version === config.candidateVersion,
        requests: probes.length, errors: probes.filter(r => r.error).length,
        p95Ms: Number(sorted[Math.ceil(sorted.length * .95) - 1].toFixed(2)) };
    }, async next => { percent = next; });
    const after = await sampleRequests(100, async i => {
      const response = await request(`${gateway.url}/?user=after-${i}`);
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.version, result.activeVersion);
      return body.version;
    });
    if (failAt === null) {
      assert.equal(result.status, 'promoted');
      assert.deepEqual(result.history.map(s => s.percent), config.stages);
    } else {
      assert.equal(result.status, 'rolled_back');
      assert.equal(result.activePercent, 0);
      assert.equal(result.rollback.from, failAt);
      assert.ok(!result.history.some(s => s.percent > failAt));
    }
    return { source: 'local-http-integration', faultInjectedAt: failAt, policy: config,
      ...result, stageTraffic, afterDecision: { requests: after.length, version: result.activeVersion, allSuccessful: true } };
  } finally {
    await Promise.all(servers.reverse().map(close));
  }
}
