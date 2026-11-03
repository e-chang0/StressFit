// CI 실습용 규칙 기반 데모입니다. 의료·운동 처방용 모델이 아닙니다.
export function recommendRoutine({ stress, minutes, place, hasPain = false }) {
  if (!Number.isInteger(stress) || stress < 1 || stress > 10) {
    throw new RangeError('스트레스는 1~10 사이 정수로 입력해 주세요.');
  }
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 60) {
    throw new RangeError('운동 시간은 5~60분 사이 정수로 입력해 주세요.');
  }
  if (!['indoor', 'outdoor'].includes(place)) {
    throw new RangeError('운동 장소를 선택해 주세요.');
  }
  if (typeof hasPain !== 'boolean') {
    throw new TypeError('통증 여부는 참 또는 거짓이어야 합니다.');
  }
  if (hasPain) {
    return {
      title: '오늘은 휴식을 선택해 주세요',
      intensity: '휴식',
      duration: 0,
      reason: '통증이 있으면 운동을 멈추고 전문가와 상담해 주세요.',
    };
  }
  const duration = Math.min(minutes, 20);
  if (stress >= 7) {
    return {
      title: place === 'indoor' ? '가벼운 스트레칭' : '천천히 걷기',
      intensity: '낮음',
      duration,
      reason: '스트레스가 높은 날을 위한 가벼운 활동 데모입니다.',
    };
  }
  return {
    title: place === 'indoor' ? '가벼운 맨몸 운동' : '편안한 속도로 걷기',
    intensity: '보통',
    duration,
    reason: '선택한 장소와 가용 시간에 맞춘 기본 루틴입니다.',
  };
}
