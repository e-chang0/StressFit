import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recommendRoutine } from '../src/recommendation.js';

const input = { stress: 5, minutes: 10, place: 'indoor' };

test('비가 오면 야외 운동 대신 실내 운동을 추천한다', () => {
  const rainy = { ...input, place: 'outdoor', isRaining: true };
  assert.equal(recommendRoutine(rainy).title, '가벼운 맨몸 운동');
  assert.match(recommendRoutine(rainy).reason, /비가 와서 실내/);
  assert.equal(recommendRoutine({ ...rainy, stress: 8 }).title, '가벼운 스트레칭');
  assert.equal(recommendRoutine({ ...rainy, hasPain: true }).duration, 0);
  assert.equal(recommendRoutine({ ...rainy, isRaining: false }).title, '편안한 속도로 걷기');
});
