import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewServer } from '../scripts/preview.js';

test('preview preserves deployment health and serves every browser module without exposing environment files', async () => {
  const server = createPreviewServer();
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    for (const path of ['/', '/lab.html', '/lab.js', '/main.js', '/features.js', '/storage.js', '/analytics.js', '/rollout.js', '/config.json', '/rollout.json', '/style.css']) {
      const response = await globalThis.fetch(origin + path);
      assert.equal(response.status, 200, path);
      assert.ok((await response.text()).length > 0);
    }
    const health = await globalThis.fetch(origin + '/health');
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok' });
    assert.equal((await globalThis.fetch(origin + '/.env')).status, 404);
    assert.equal((await globalThis.fetch(origin + '/../package.json')).status, 404);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
