import { readFile, writeFile } from 'node:fs/promises';
import { recommendRoutine } from '../src/recommendation.js';

const path = new URL('../docs/week13/personas.json', import.meta.url);
const cases = JSON.parse(await readFile(path, 'utf8'));
const results = cases.map(({ id, profile, scenario, input, feedback, improvement }) => ({
  id, profile, scenario, input, result: recommendRoutine(input), feedback, improvement,
}));
await writeFile(new URL('../docs/week13/persona-results.json', import.meta.url),
  JSON.stringify({ source: 'LLM이 작성한 가상 인물과 평가; 실제 사용자 조사 아님', generatedAt: new Date().toISOString(), results }, null, 2) + '\n');
console.log(`${results.length}개 시나리오 실행 완료`);
