import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recommendRoutine } from '../src/recommendation.js';

const input = { stress: 5, minutes: 10, place: 'indoor' };

test('운동을 준비, 본운동, 마무리로 나누고 휴식일에는 표시하지 않는다', () => {
  for (const [minutes, expected] of [[5, [1, 3, 1]], [10, [2, 6, 2]], [19, [3, 13, 3]], [30, [4, 12, 4]]]) {
    const { duration, steps } = recommendRoutine({ ...input, minutes, includePlan: true });
    assert.deepEqual(steps?.map(step => step.label), ['준비', '본운동', '마무리']);
    assert.deepEqual(steps.map(step => step.minutes), expected);
    assert.equal(steps.reduce((sum, step) => sum + step.minutes, 0), duration);
  }
  assert.deepEqual(recommendRoutine({ ...input, hasPain: true, includePlan: true }).steps, []);
  assert.equal(recommendRoutine(input).steps, undefined);
});

test('스트레칭 목표를 고르면 장소나 밴드와 상관없이 스트레칭을 추천한다', () => {
  const stretch = { ...input, wantsStretch: true, hasBand: true };
  assert.equal(recommendRoutine(stretch).title, '전신 스트레칭');
  assert.equal(recommendRoutine({ ...stretch, place: 'outdoor', stress: 8 }).intensity, '낮음');
  assert.match(recommendRoutine({ ...stretch, place: 'outdoor' }).reason, /스트레칭을 목표로/);
  assert.match(recommendRoutine({ ...stretch, place: 'outdoor', isRaining: true }).reason, /비가 와서 실내/);
  assert.equal(recommendRoutine({ ...stretch, hasPain: true }).duration, 0);
  assert.equal(recommendRoutine({ ...stretch, wantsStretch: false }).title, '밴드 운동');
});

test('밴드를 챙긴 경우 일반 강도의 실내 운동에만 밴드를 사용한다', () => {
  const withBand = { ...input, hasBand: true };
  assert.equal(recommendRoutine(withBand).title, '밴드 운동');
  assert.match(recommendRoutine(withBand).reason, /밴드/);
  assert.equal(recommendRoutine({ ...withBand, place: 'outdoor' }).title, '편안한 속도로 걷기');
  assert.equal(recommendRoutine({ ...withBand, stress: 7 }).title, '가벼운 스트레칭');
  assert.equal(recommendRoutine({ ...withBand, preferLight: true }).title, '가벼운 스트레칭');
});

test('가벼운 강도를 선택하면 스트레스가 낮아도 가벼운 운동을 추천한다', () => {
  const light = { ...input, preferLight: true };
  assert.equal(recommendRoutine(light).title, '가벼운 스트레칭');
  assert.equal(recommendRoutine(light).intensity, '낮음');
  assert.match(recommendRoutine(light).reason, /가벼운 강도를 선택/);
  assert.equal(recommendRoutine({ ...light, place: 'outdoor' }).title, '천천히 걷기');
  assert.equal(recommendRoutine({ ...light, preferLight: false }).intensity, '보통');
});

test('비가 오면 야외 운동 대신 실내 운동을 추천한다', () => {
  const rainy = { ...input, place: 'outdoor', isRaining: true };
  assert.equal(recommendRoutine(rainy).title, '가벼운 맨몸 운동');
  assert.match(recommendRoutine(rainy).reason, /비가 와서 실내/);
  assert.equal(recommendRoutine({ ...rainy, stress: 8 }).title, '가벼운 스트레칭');
  assert.equal(recommendRoutine({ ...rainy, hasPain: true }).duration, 0);
  assert.equal(recommendRoutine({ ...rainy, isRaining: false }).title, '편안한 속도로 걷기');
});
