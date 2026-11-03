import { cp, mkdir, rm } from 'node:fs/promises';

// 배포할 파일만 dist에 복사합니다. .env와 개발 도구는 포함하지 않습니다.
const dist = new URL('../dist/', import.meta.url);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(new URL('../public/', import.meta.url), dist, { recursive: true });
await cp(new URL('../src/', import.meta.url), dist, { recursive: true });
console.log('Build complete: dist/');
