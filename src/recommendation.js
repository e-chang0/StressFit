// CI 실습용 규칙 기반 데모입니다. 의료·운동 처방용 모델이 아닙니다.
export function recommendRoutine({
  stress, minutes, place, hasPain = false,
  isRaining = false, preferLight = false, hasBand = false, wantsStretch = false,
  includePlan = false,
}) {
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
      ...(includePlan ? { steps: [] } : {}),
    };
  }
  const duration = Math.min(minutes, 20);
  const moveIndoors = place === 'outdoor' && isRaining;
  const indoor = place === 'indoor' || moveIndoors;
  const light = stress >= 7 || preferLight;
  const routine = chooseRoutine({ indoor, light, hasBand, wantsStretch });
  return {
    ...routine,
    duration,
    reason: explainRoutine(moveIndoors, preferLight && !wantsStretch, routine.reason),
    ...(includePlan ? {
      steps: [
        { label: '준비', minutes: Math.floor(duration / 5) },
        { label: '본운동', minutes: duration - 2 * Math.floor(duration / 5) },
        { label: '마무리', minutes: Math.floor(duration / 5) },
      ],
    } : {}),
  };
}

function chooseRoutine({ indoor, light, hasBand, wantsStretch }) {
  if (wantsStretch) {
    return { title: '전신 스트레칭', intensity: '낮음', reason: '스트레칭을 목표로 골랐어요.' };
  }
  if (light) {
    return {
      title: indoor ? '가벼운 스트레칭' : '천천히 걷기',
      intensity: '낮음',
      reason: '스트레스가 높은 날을 위한 가벼운 활동 데모입니다.',
    };
  }
  if (indoor && hasBand) {
    return { title: '밴드 운동', intensity: '보통', reason: '선택한 운동 밴드를 사용하는 실내 루틴입니다.' };
  }
  return {
    title: indoor ? '가벼운 맨몸 운동' : '편안한 속도로 걷기',
    intensity: '보통',
    reason: '선택한 장소와 가용 시간에 맞춘 기본 루틴입니다.',
  };
}

function explainRoutine(moveIndoors, preferLight, defaultReason) {
  if (moveIndoors) return '비가 와서 실내 루틴을 골랐어요.';
  if (preferLight) return '가벼운 강도를 선택해 이 루틴을 골랐어요.';
  return defaultReason;
}
