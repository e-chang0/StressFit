import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { loadConfig } from './flag-config.js';

// 배포할 파일만 dist에 복사합니다. .env와 개발 도구는 포함하지 않습니다.
const config = await loadConfig();
const dist = new URL('../dist/', import.meta.url);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(new URL('../public/', import.meta.url), dist, { recursive: true });
await cp(new URL('../src/', import.meta.url), dist, { recursive: true });
await writeFile(new URL('config.json', dist), JSON.stringify(config, null, 2));
await cp(new URL('../config/rollout.json', import.meta.url), new URL('rollout.json', dist));
console.log('Build complete: dist/');
