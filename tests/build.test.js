import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

test('배포 산출물에 화면과 실행 파일이 모두 포함된다', async () => {
  const files = await readdir(new URL('../dist/', import.meta.url));
  assert.deepEqual(files.sort(), ['index.html', 'main.js', 'recommendation.js', 'style.css']);
  for (const name of files) {
    const content = await readFile(new URL(`../dist/${name}`, import.meta.url), 'utf8');
    assert.ok(content.length > 0, `${name} must not be empty`);
  }
});
test('GitHub Pages 하위 경로에서 사용할 상대 경로를 유지한다', async () => {
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.match(html, /lang="ko"/);
  assert.match(html, /src="\.\/main.js"/);
  assert.match(html, /href="\.\/style.css"/);
});
