import { test } from 'node:test';
import assert from 'node:assert/strict';
// 소스 대신 Build에서 전달받은 실제 배포 파일을 테스트합니다.
import { recommendRoutine } from '../dist/recommendation.js';

const input = { stress: 5, minutes: 10, place: 'indoor' };

test('높은 스트레스 + 실내에서는 낮은 강도의 스트레칭을 추천한다', () => {
  const result = recommendRoutine({ ...input, stress: 7 });
  assert.equal(result.title, '가벼운 스트레칭');
  assert.equal(result.intensity, '낮음');
});
test('높은 스트레스 + 야외에서는 천천히 걷기를 추천한다', () => {
  assert.equal(recommendRoutine({ ...input, stress: 10, place: 'outdoor' }).title, '천천히 걷기');
});
test('일반 상태에서는 장소에 맞는 기본 운동을 추천한다', () => {
  assert.equal(recommendRoutine(input).title, '가벼운 맨몸 운동');
  assert.equal(recommendRoutine({ ...input, place: 'outdoor' }).title, '편안한 속도로 걷기');
});
test('운동 시간은 가용 시간을 넘지 않고 최대 20분이다', () => {
  for (const minutes of [5, 10, 20, 30, 60]) {
    assert.equal(recommendRoutine({ ...input, minutes }).duration, Math.min(minutes, 20));
  }
});
test('통증이 있으면 운동 대신 휴식을 안내한다', () => {
  const result = recommendRoutine({ ...input, hasPain: true });
  assert.equal(result.intensity, '휴식');
  assert.equal(result.duration, 0);
  assert.match(result.reason, /전문가/);
});
test('스트레스 범위와 정수 조건을 검사한다', () => {
  for (const stress of [0, 11, 1.5, '5', NaN, Infinity, undefined]) {
    assert.throws(() => recommendRoutine({ ...input, stress }), RangeError);
  }
  assert.doesNotThrow(() => recommendRoutine({ ...input, stress: 1 }));
  assert.doesNotThrow(() => recommendRoutine({ ...input, stress: 10 }));
});
test('운동 시간과 장소, 통증 여부의 잘못된 입력을 거부한다', () => {
  for (const minutes of [4, 61, 10.5, '10', NaN]) {
    assert.throws(() => recommendRoutine({ ...input, minutes }), RangeError);
  }
  assert.throws(() => recommendRoutine({ ...input, place: 'gym' }), RangeError);
  assert.throws(() => recommendRoutine({ ...input, hasPain: 'false' }), TypeError);
});
